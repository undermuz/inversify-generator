import { program } from "commander";

import path from "path";

import { fileURLToPath } from "url";

import { copyFiles } from "./actions/copyFiles.js";
import { updatePackageJson } from "./actions/updatePackageJson.js";
import { addModule } from "./actions/addModule.js";
import { addPresetModule } from "./actions/addPresetModule.js";
import { updateTsConfig } from "./actions/updateTsConfig.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize command
program
    .command("init")
    .description("Initialize InversifyJs in project")
    .option("-p, --project <path>", "Path to src/app", "src/app")
    .option("-t, --tsconfigPath <path>", "Path to tsconfig.json file")
    .action(async (options, command) => {
        try {
            const projectPath = command.optsWithGlobals().project || "src/app";
            const target = path.resolve(process.cwd(), projectPath);

            console.log("📦 Copy templates...");

            await copyFiles(path.join(__dirname, "../templates"), target);

            console.log("📘 Update package.json...");

            await updatePackageJson(process.cwd());

            console.log("🔧 Update tsconfig.json...");

            const tsconfigPath = command.optsWithGlobals().tsconfigPath;
            await updateTsConfig(target, tsconfigPath);

            console.log("✨ InversifyJs successfully installed!");
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    });

// Add module command
program
    .command("add-module <name>")
    .option(
        "-p, --project <path>",
        "Path to app directory (module will be created inside)",
        "src/app",
    )
    .description("Add a new module to the project")
    .action(async (name, options, command) => {
        try {
            const projectPath = command.optsWithGlobals().project || "src/app";
            const appPath = path.resolve(process.cwd(), projectPath);
            const diPath = path.join(appPath, "di");
            const result = await addModule(diPath, name);

            console.log(`✨ Module '${result.name}' added successfully!`);
            console.log(`📁 Location: ${result.path}`);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    });

// Add preset module command
program
    .command("add-preset-module <name>")
    .option(
        "-p, --project <path>",
        "Path to app directory (module will be created inside)",
        "src/app",
    )
    .description("Copy a predefined preset module into the project")
    .action(async (name, options, command) => {
        try {
            const projectPath = command.optsWithGlobals().project || "src/app";
            const appPath = path.resolve(process.cwd(), projectPath);
            const diPath = path.join(appPath, "di");
            const result = await addPresetModule(diPath, name);

            console.log(`✨ Preset module '${result.name}' added successfully!`);
            console.log(`📁 Location: ${result.path}`);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    });

program.parse(process.argv);
