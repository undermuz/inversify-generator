import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Copy a preset module into a project's di folder, and if the
 * copied directory contains `module.ts`, wire it into container.ts.
 */
export async function addPresetModule(diPath, presetName) {
    if (!presetName || typeof presetName !== "string") {
        throw new Error("Preset name is required");
    }

    const normalized = presetName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    if (!normalized) {
        throw new Error("Invalid preset name");
    }

    // presets folder sits at workspace root, two levels above this file
    const presetDir = path.join(__dirname, `../../presets/${presetName}`);
    if (!(await fs.pathExists(presetDir))) {
        throw new Error(`Preset '${presetName}' not found in templates`);
    }

    const destDir = path.join(diPath, normalized);
    if (await fs.pathExists(destDir)) {
        throw new Error(
            `Module '${normalized}' already exists: ${destDir}`,
        );
    }

    // copy entire preset directory and log each file
    const copyWithLogging = async (src, dst) => {
        const items = await fs.readdir(src);
        await fs.ensureDir(dst);
        for (const item of items) {
            // Never copy internal tests from preset modules
            if (item === "__tests__") continue;
            const s = path.join(src, item);
            const d = path.join(dst, item);
            const stat = await fs.stat(s);
            if (stat.isDirectory()) {
                await copyWithLogging(s, d);
            } else {
                await fs.copy(s, d, { overwrite: false, errorOnExist: true });
                console.log(`📄 Created ${d}`);
            }
        }
    };
    await copyWithLogging(presetDir, destDir);
    console.log(`📁 Copied preset directory to ${destDir}`);

    // if there is a module.ts, attempt to update container
    const moduleFile = path.join(destDir, "module.ts");
    const containerPath = path.join(diPath, "container.ts");

    if (await fs.pathExists(moduleFile) && (await fs.pathExists(containerPath))) {
        let content = await fs.readFile(containerPath, "utf-8");
        // build pascal name for import
        const pascalName = normalized
            .split(/[-_]/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join("");

        const importStmt = `import { ${pascalName}Module } from "./${normalized}/module";`;
        if (!content.includes(importStmt)) {
            const lines = content.split("\n");
            let lastImport = -1;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim().startsWith("import ")) {
                    lastImport = i;
                }
            }
            lines.splice(lastImport + 1, 0, importStmt);
            content = lines.join("\n");

            // add di.load call
            const loadRegex = /di\.load\([^)]+\);/g;
            const matches = [...content.matchAll(loadRegex)];
            if (matches.length > 0) {
                const last = matches[matches.length - 1];
                const insertPos = last.index + last[0].length;
                content =
                    content.slice(0, insertPos) +
                    `\n    di.load(${pascalName}Module);` +
                    content.slice(insertPos);
            } else {
                content = content.replace(
                    /return di;/,
                    `    di.load(${pascalName}Module);\n\n    return di;`,
                );
            }

            await fs.writeFile(containerPath, content);
        }
    }

    return { name: normalized, path: destDir };
}
