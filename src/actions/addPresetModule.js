import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { collectPresetPackageDependencies } from "../helpers/collectPresetPackageDependencies.js";
import { updatePackageJson } from "./updatePackageJson.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRESETS_ROOT = path.join(__dirname, "../../presets");

function normalizeSelector(rawSelector) {
    const parts = String(rawSelector)
        .replace(/\\/g, "/")
        .split("/")
        .map((part) =>
            part
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, ""),
        )
        .filter(Boolean);

    if (!parts.length) {
        throw new Error("Invalid preset name");
    }

    return parts.join("/");
}

function validateRelativeFilePath(filePath, presetSelector) {
    if (!filePath || typeof filePath !== "string") {
        throw new Error(`Invalid file entry in preset '${presetSelector}'`);
    }

    const normalized = filePath.replace(/\\/g, "/");
    const parts = normalized.split("/");

    if (
        path.isAbsolute(normalized) ||
        normalized.startsWith("../") ||
        normalized.includes("/../") ||
        parts.includes("..")
    ) {
        throw new Error(
            `Invalid file path '${filePath}' in preset '${presetSelector}'`,
        );
    }

    if (parts.includes("__tests__")) {
        return null;
    }

    return normalized;
}

function toImportPathFromSelector(selector, moduleFile) {
    const normalizedFile = moduleFile.replace(/\\/g, "/").replace(/\.tsx?$/, "");

    return `./${selector}/${normalizedFile}`;
}

async function updateContainerWithModules(containerPath, modulesToLoad) {
    if (!(await fs.pathExists(containerPath)) || modulesToLoad.length === 0) {
        return;
    }

    let content = await fs.readFile(containerPath, "utf-8");
    const lines = content.split("\n");

    for (const moduleInfo of modulesToLoad) {
        const importStmt = `import { ${moduleInfo.exportName} } from "${moduleInfo.importPath}";`;
        if (content.includes(importStmt)) {
            continue;
        }

        let lastImport = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith("import ")) {
                lastImport = i;
            }
        }

        lines.splice(lastImport + 1, 0, importStmt);
        content = lines.join("\n");
    }

    for (const moduleInfo of modulesToLoad) {
        const loadStmt = `di.load(${moduleInfo.exportName});`;
        if (content.includes(loadStmt)) {
            continue;
        }

        const loadRegex = /di\.load\([^)]+\);/g;
        const matches = [...content.matchAll(loadRegex)];
        if (matches.length > 0) {
            const last = matches[matches.length - 1];
            const insertPos = last.index + last[0].length;
            content =
                content.slice(0, insertPos) +
                `\n    ${loadStmt}` +
                content.slice(insertPos);
        } else {
            content = content.replace(
                /return di;/,
                `    ${loadStmt}\n\n    return di;`,
            );
        }
    }

    await fs.writeFile(containerPath, content);
}

async function readManifest(selector) {
    const presetDir = path.join(PRESETS_ROOT, selector);
    const manifestPath = path.join(presetDir, "preset.json");

    if (!(await fs.pathExists(presetDir))) {
        throw new Error(`Preset '${selector}' not found in templates`);
    }

    if (!(await fs.pathExists(manifestPath))) {
        throw new Error(
            `Preset '${selector}' is not a standalone preset (missing preset.json)`,
        );
    }

    const raw = await fs.readFile(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);

    if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
        throw new Error(`Preset '${selector}' has invalid or empty files list`);
    }

    if (
        manifest.module &&
        (typeof manifest.module.file !== "string" ||
            typeof manifest.module.export !== "string")
    ) {
        throw new Error(`Preset '${selector}' has invalid module declaration`);
    }

    if (manifest.dependencies && !Array.isArray(manifest.dependencies)) {
        throw new Error(`Preset '${selector}' has invalid dependencies section`);
    }

    if (manifest.packageDependencies !== undefined) {
        if (
            typeof manifest.packageDependencies !== "object" ||
            Array.isArray(manifest.packageDependencies)
        ) {
            throw new Error(
                `Preset '${selector}' has invalid packageDependencies section`,
            );
        }
    }

    return { presetDir, manifest };
}

async function buildPresetGraph(rootSelector) {
    const nodes = new Map();
    const visiting = new Set();
    const orderedSelectors = [];

    async function visit(selector, requestedFiles, isRoot = false) {
        if (visiting.has(selector)) {
            throw new Error(`Cyclic preset dependency detected at '${selector}'`);
        }

        let node = nodes.get(selector);

        if (!node) {
            const { presetDir, manifest } = await readManifest(selector);
            node = {
                selector,
                presetDir,
                manifest,
                files: new Set(),
            };
            nodes.set(selector, node);
        }

        if (isRoot || !requestedFiles) {
            node.manifest.files.forEach((file) => node.files.add(file));
        } else {
            requestedFiles.forEach((file) => node.files.add(file));
        }

        if (node.__resolved) {
            return;
        }

        visiting.add(selector);
        const deps = node.manifest.dependencies ?? [];

        for (const dep of deps) {
            if (!dep || typeof dep.preset !== "string") {
                throw new Error(
                    `Preset '${selector}' has invalid dependency declaration`,
                );
            }

            const depSelector = normalizeSelector(dep.preset);
            const depFiles = Array.isArray(dep.files) ? dep.files : undefined;

            await visit(depSelector, depFiles, false);
        }

        visiting.delete(selector);
        node.__resolved = true;
        orderedSelectors.push(selector);
    }

    await visit(rootSelector, undefined, true);

    return { nodes, orderedSelectors };
}

/**
 * Copy a preset module into a project's di folder, and if the
 * copied directory contains a module entry in `preset.json`,
 * wire it into container.ts.
 */
export async function addPresetModule(diPath, presetName, options = {}) {
    if (!presetName || typeof presetName !== "string") {
        throw new Error("Preset name is required");
    }

    const selector = normalizeSelector(presetName);
    const destDir = path.join(diPath, selector);
    if (await fs.pathExists(destDir)) {
        throw new Error(
            `Module '${selector}' already exists: ${destDir}`,
        );
    }

    const { nodes, orderedSelectors } = await buildPresetGraph(selector);
    const modulesToLoad = [];

    for (const nodeSelector of orderedSelectors) {
        const node = nodes.get(nodeSelector);
        const nodeDestDir = path.join(diPath, nodeSelector);
        const copiedFiles = [];

        for (const rawFile of node.files) {
            const relativeFile = validateRelativeFilePath(rawFile, nodeSelector);
            if (!relativeFile) {
                continue;
            }

            const src = path.join(node.presetDir, relativeFile);
            const dst = path.join(nodeDestDir, relativeFile);

            if (!(await fs.pathExists(src))) {
                throw new Error(
                    `Preset '${nodeSelector}' file not found: ${relativeFile}`,
                );
            }

            await fs.ensureDir(path.dirname(dst));
            await fs.copy(src, dst, { overwrite: false, errorOnExist: false });
            copiedFiles.push(relativeFile);
            console.log(`📄 Created ${dst}`);
        }

        console.log(`📁 Copied preset '${nodeSelector}' to ${nodeDestDir}`);

        if (node.manifest.module) {
            const moduleFile = validateRelativeFilePath(
                node.manifest.module.file,
                nodeSelector,
            );
            if (!moduleFile) {
                throw new Error(
                    `Preset '${nodeSelector}' has invalid module.file path`,
                );
            }

            if (!copiedFiles.includes(moduleFile)) {
                // Ensure module file exists for container wiring even if not in explicit files
                const src = path.join(node.presetDir, moduleFile);
                const dst = path.join(nodeDestDir, moduleFile);
                if (await fs.pathExists(src)) {
                    await fs.ensureDir(path.dirname(dst));
                    await fs.copy(src, dst, {
                        overwrite: false,
                        errorOnExist: false,
                    });
                    console.log(`📄 Created ${dst}`);
                }
            }

            modulesToLoad.push({
                exportName: node.manifest.module.export,
                importPath: toImportPathFromSelector(nodeSelector, moduleFile),
            });
        }
    }

    const containerPath = path.join(diPath, "container.ts");
    await updateContainerWithModules(containerPath, modulesToLoad);

    const { projectRoot } = options;
    if (projectRoot) {
        const packageDependencies = collectPresetPackageDependencies(
            nodes,
            orderedSelectors,
        );

        if (Object.keys(packageDependencies).length > 0) {
            await updatePackageJson(projectRoot, packageDependencies);
        }
    }

    return { name: selector, path: destDir };
}
