import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function addModule(diPath, moduleName) {
    // Validate module name
    if (!moduleName || typeof moduleName !== "string") {
        throw new Error("Module name is required");
    }

    // normalize: lowercase, kebab-case, strip invalid chars
    const normalized = moduleName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    if (!normalized) {
        throw new Error("Invalid module name");
    }

    const modulePath = path.join(diPath, normalized);

    // don't overwrite existing module
    if (await fs.pathExists(modulePath)) {
        throw new Error(
            `Module '${normalized}' already exists: ${modulePath}`,
        );
    }

    await fs.ensureDir(modulePath);
    console.log(`📁 Created directory ${modulePath}`);

    // compute pascal case base name (e.g. "my-provider" -> "MyProvider")
    const pascalName = normalized
        .split(/[-_]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("");

    // load templates from the built-in example
    const templateDir = path.join(__dirname, "../../templates/di/my-provider");
    const moduleTemplate = await fs.readFile(
        path.join(templateDir, "module.ts"),
        "utf-8",
    );
    const providerTemplate = await fs.readFile(
        path.join(templateDir, "provider.ts"),
        "utf-8",
    );
    const typesTemplate = await fs.readFile(
        path.join(templateDir, "types.ts"),
        "utf-8",
    );

    // perform simple replacements based on the example naming
    const replacements = [
        { from: /MyModule/g, to: `${pascalName}Module` },
        { from: /MyProvider/g, to: `${pascalName}Provider` },
        { from: /IMyProvider/g, to: `I${pascalName}Provider` },
        { from: /MyClass/g, to: `${pascalName}Class` },
    ];

    const apply = (content) => {
        let res = content;
        for (const { from, to } of replacements) {
            res = res.replace(from, to);
        }
        return res;
    };

    const moduleFile = path.join(modulePath, "module.ts");
    const providerFile = path.join(modulePath, "provider.ts");
    const typesFile = path.join(modulePath, "types.ts");

    await fs.writeFile(moduleFile, apply(moduleTemplate));
    console.log(`📄 Created ${moduleFile}`);
    await fs.writeFile(providerFile, apply(providerTemplate));
    console.log(`📄 Created ${providerFile}`);
    await fs.writeFile(typesFile, apply(typesTemplate));
    console.log(`📄 Created ${typesFile}`);

    // update container.ts to wire the new module
    const containerPath = path.join(diPath, "container.ts");
    if (!(await fs.pathExists(containerPath))) {
        throw new Error(`Container file not found: ${containerPath}`);
    }

    let containerContent = await fs.readFile(containerPath, "utf-8");

    // guard against duplicate import
    if (containerContent.includes(`{ ${pascalName}Module }`)) {
        throw new Error(
            `Module '${normalized}' is already imported in container.ts`,
        );
    }

    const lines = containerContent.split("\n");
    let lastImport = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith("import ")) {
            lastImport = i;
        }
    }

    const importLine = `import { ${pascalName}Module } from "./${normalized}/module";`;
    lines.splice(lastImport + 1, 0, importLine);
    containerContent = lines.join("\n");

    // add load call after existing load statements (or before return)
    const loadRegex = /di\.load\([^)]+\);/g;
    const matches = [...containerContent.matchAll(loadRegex)];
    if (matches.length > 0) {
        const last = matches[matches.length - 1];
        const insertPos = last.index + last[0].length;
        containerContent =
            containerContent.slice(0, insertPos) +
            `\n    di.load(${pascalName}Module);` +
            containerContent.slice(insertPos);
    } else {
        containerContent = containerContent.replace(
            /return di;/,
            `    di.load(${pascalName}Module);\n\n    return di;`,
        );
    }

    await fs.writeFile(containerPath, containerContent);
    console.log(`📄 Updated container file: ${containerPath}`);

    return {
        name: normalized,
        path: modulePath,
    };
}
