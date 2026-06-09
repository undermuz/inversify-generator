import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const PRESETS_ROOT = path.join(PROJECT_ROOT, "presets");
const PRESETS_PACKAGE_JSON = path.join(PRESETS_ROOT, "package.json");
const BUILTIN_PACKAGES = new Set(["inversify", "reflect-metadata"]);

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
        throw new Error("Invalid preset selector");
    }

    return parts.join("/");
}

async function listPresetSelectors() {
    const found = [];

    async function walk(dir) {
        const entries = await fs.readdir(dir);
        for (const entry of entries) {
            const abs = path.join(dir, entry);
            const rel = path.relative(PRESETS_ROOT, abs).replace(/\\/g, "/");
            const stat = await fs.stat(abs);

            if (!stat.isDirectory()) {
                continue;
            }

            const manifestPath = path.join(abs, "preset.json");
            if (await fs.pathExists(manifestPath)) {
                found.push(rel);
            }

            await walk(abs);
        }
    }

    await walk(PRESETS_ROOT);
    return found;
}

function toPackageName(specifier) {
    if (specifier.startsWith("@")) {
        const parts = specifier.split("/");
        return `${parts[0]}/${parts[1]}`;
    }

    return specifier.split("/")[0];
}

async function loadPresetPackageVersions() {
    if (!(await fs.pathExists(PRESETS_PACKAGE_JSON))) {
        return {};
    }

    const pkg = JSON.parse(await fs.readFile(PRESETS_PACKAGE_JSON, "utf-8"));
    return pkg.dependencies ?? {};
}

function extractImports(content) {
    const imports = [];
    const importRegex =
        /(?:import\s+(?:type\s+)?(?:[^"'`]+?\s+from\s+)?|export\s+(?:type\s+)?[^"'`]*?\s+from\s+)["']([^"']+)["']/g;
    const dynamicImportRegex = /import\(\s*["']([^"']+)["']\s*\)/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }
    while ((match = dynamicImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }

    return imports;
}

async function resolveImportFile(fromFile, specifier) {
    const base = path.resolve(path.dirname(fromFile), specifier);
    const variants = [
        base,
        `${base}.ts`,
        `${base}.tsx`,
        `${base}.js`,
        path.join(base, "index.ts"),
        path.join(base, "index.tsx"),
        path.join(base, "index.js"),
    ];

    for (const file of variants) {
        if (await fs.pathExists(file)) {
            const stat = await fs.stat(file);
            if (stat.isFile()) {
                return file;
            }
        }
    }

    return null;
}

function findOwnerPresetSelector(targetFile, presetSelectors) {
    const rel = path.relative(PRESETS_ROOT, targetFile).replace(/\\/g, "/");
    const sorted = [...presetSelectors].sort((a, b) => b.length - a.length);

    for (const selector of sorted) {
        if (rel === selector || rel.startsWith(`${selector}/`)) {
            return selector;
        }
    }

    return null;
}

async function main() {
    const rawSelector = process.argv[2];
    const shouldWrite = process.argv.includes("--write");

    if (!rawSelector) {
        throw new Error(
            "Usage: node scripts/generate-preset-manifest.mjs <selector> [--write]",
        );
    }

    const selector = normalizeSelector(rawSelector);
    const presetDir = path.join(PRESETS_ROOT, selector);
    const manifestPath = path.join(presetDir, "preset.json");

    if (!(await fs.pathExists(manifestPath))) {
        throw new Error(`Manifest not found: presets/${selector}/preset.json`);
    }

    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));
    if (!Array.isArray(manifest.files) || !manifest.files.length) {
        throw new Error(
            `Preset '${selector}' has no files list in manifest. Cannot infer dependencies.`,
        );
    }

    const presetSelectors = await listPresetSelectors();
    const presetPackageVersions = await loadPresetPackageVersions();
    const depFilesMap = new Map();
    const packageNames = new Set();

    for (const relFile of manifest.files) {
        const absFile = path.join(presetDir, relFile);
        if (!(await fs.pathExists(absFile))) {
            continue;
        }

        const content = await fs.readFile(absFile, "utf-8");
        const imports = extractImports(content);

        for (const specifier of imports) {
            if (specifier.startsWith("@/")) {
                throw new Error(
                    `Alias import is forbidden (${specifier}) in presets/${selector}/${relFile}`,
                );
            }

            if (!specifier.startsWith("./") && !specifier.startsWith("../")) {
                const packageName = toPackageName(specifier);
                if (!BUILTIN_PACKAGES.has(packageName)) {
                    packageNames.add(packageName);
                }
                continue;
            }

            const resolved = await resolveImportFile(absFile, specifier);
            if (!resolved) {
                continue;
            }

            if (!resolved.startsWith(PRESETS_ROOT)) {
                continue;
            }

            const ownerSelector = findOwnerPresetSelector(resolved, presetSelectors);
            if (!ownerSelector || ownerSelector === selector) {
                continue;
            }

            const ownerDir = path.join(PRESETS_ROOT, ownerSelector);
            const ownerRel = path
                .relative(ownerDir, resolved)
                .replace(/\\/g, "/");

            if (!depFilesMap.has(ownerSelector)) {
                depFilesMap.set(ownerSelector, new Set());
            }
            depFilesMap.get(ownerSelector).add(ownerRel);
        }
    }

    const dependencies = [...depFilesMap.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([depSelector, files]) => ({
            preset: depSelector,
            files: [...files].sort(),
        }));

    const packageDependencies = {};
    const missingPackages = [];

    for (const packageName of [...packageNames].sort()) {
        const version = presetPackageVersions[packageName];
        if (version) {
            packageDependencies[packageName] = version;
        } else {
            missingPackages.push(packageName);
        }
    }

    if (missingPackages.length > 0) {
        throw new Error(
            `Preset '${selector}' uses packages missing from presets/package.json: ${missingPackages.join(", ")}`,
        );
    }

    if (shouldWrite) {
        if (dependencies.length > 0) {
            manifest.dependencies = dependencies;
        } else {
            delete manifest.dependencies;
        }

        if (Object.keys(packageDependencies).length > 0) {
            manifest.packageDependencies = packageDependencies;
        } else {
            delete manifest.packageDependencies;
        }

        await fs.writeFile(
            manifestPath,
            `${JSON.stringify(manifest, null, 2)}\n`,
            "utf-8",
        );
        console.log(`Updated dependencies in presets/${selector}/preset.json`);
        return;
    }

    console.log(
        JSON.stringify({ selector, dependencies, packageDependencies }, null, 2),
    );
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});

