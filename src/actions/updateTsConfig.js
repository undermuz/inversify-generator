import fs from "fs-extra";
import path from "path";

export async function updateTsConfig(root, tsconfigPath) {
    let configPath = tsconfigPath;

    if (!configPath) {
        // Find the nearest tsconfig*.json with compilerOptions
        const possibleNames = ["tsconfig.json", "tsconfig.app.json", "tsconfig.build.json"];
        for (const name of possibleNames) {
            const candidate = path.join(root, name);
            if (await fs.pathExists(candidate)) {
                const content = await fs.readJson(candidate);
                if (content.compilerOptions) {
                    configPath = candidate;
                    break;
                }
            }
        }
    }

    if (!configPath) {
        throw new Error(
            "No tsconfig*.json file with compilerOptions found. Please specify with --tsconfigPath option."
        );
    }

    if (!(await fs.pathExists(configPath))) {
        throw new Error(`Specified tsconfig file does not exist: ${configPath}`);
    }

    const config = await fs.readJson(configPath);

    if (!config.compilerOptions) {
        throw new Error(`The tsconfig file does not contain compilerOptions: ${configPath}`);
    }

    // Set the required options
    config.compilerOptions.emitDecoratorMetadata = true;
    config.compilerOptions.experimentalDecorators = true;

    await fs.writeJson(configPath, config, { spaces: 2 });

    return configPath;
}