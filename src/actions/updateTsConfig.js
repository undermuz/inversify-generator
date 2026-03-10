import fs from "fs-extra";
import path from "path";

export async function updateTsConfig(root, tsconfigPath) {
    let configPath = tsconfigPath;

    if (!configPath) {
        // Search upward from root for any tsconfig*.json containing compilerOptions,
        // but don't go above the current working directory.
        let current = path.resolve(root);
        const stop = path.resolve(process.cwd());
        const pattern = /^tsconfig.*\.json$/i;

        while (true) {
            if (current.startsWith(stop)) {
                // read directory entries
                const entries = await fs.readdir(current);
                for (const entry of entries) {
                    if (pattern.test(entry)) {
                        const candidate = path.join(current, entry);
                        const content = await fs.readJson(candidate);

                        console.log(`📄 Candidate tsconfig file: ${candidate}`);
                        
                        if (content && content.compilerOptions) {
                            configPath = candidate;

                            console.log(`✅ Using tsconfig file: ${configPath}`);

                            break;
                        }
                    }
                }
            }

            if (configPath) break;

            // if we've reached or passed the stop directory, break out
            if (current === stop || current === path.parse(current).root) {
                break;
            }

            // move up one directory
            current = path.dirname(current);
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
    console.log(`📄 Updated tsconfig file: ${configPath}`);

    return configPath;
}