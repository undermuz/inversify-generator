import { program } from "commander";

import path from "path";

import { fileURLToPath } from "url";

import { copyFiles } from "./actions/copyFiles.js";
import { updatePackageJson } from "./actions/updatePackageJson.js";
import { addModule } from "./actions/addModule.js";
import { addPresetModule } from "./actions/addPresetModule.js";
import { updateTsConfig } from "./actions/updateTsConfig.js";
import { preflightInit } from "./preflight/initPreflight.js";
import {
    resolveProjectPath,
} from "./helpers/resolveProjectPath.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function formatProjectPath(absolutePath) {
    const relative = path.relative(process.cwd(), absolutePath);

    return relative || ".";
}

function logResolvedProjectPath(result) {
    if (result.detected) {
        console.log(
            `📍 Detected project directory: ${formatProjectPath(result.absolutePath)}`,
        );
        return;
    }

    if (result.usedFallback) {
        console.log(
            `📍 Using default project directory: ${formatProjectPath(result.absolutePath)}`,
        );
    }
}

// Initialize command
program
    .command("init")
    .description("Initialize InversifyJs in project")
    .option("-p, --project <path>", "Path to src directory")
    .option("-t, --tsconfigPath <path>", "Path to tsconfig.json file")
    .action(async (options, command) => {
        try {
            const { absolutePath: target } = await resolveProjectPath(
                command.opts().project,
                { autoDetect: false },
            );
            const tsconfigPath = command.optsWithGlobals().tsconfigPath;
            const templatesDir = path.join(__dirname, "../templates/di");

            console.log("🔍 Checking prerequisites...");
            await preflightInit({
                cwd: process.cwd(),
                templatesDir,
                targetDir: target,
                tsconfigSearchRoot: target,
                tsconfigPath,
            });

            console.log("📦 Copy templates...");

            await copyFiles(templatesDir, target);

            console.log("📘 Update package.json...");

            await updatePackageJson(process.cwd());

            console.log("🔧 Update tsconfig.json...");
            try {
                await updateTsConfig(target, tsconfigPath);
            } catch (tsconfigError) {
                console.error("");
                console.error(
                    "❌ Could not update tsconfig: the step failed or no suitable config was found.",
                );
                console.error("");
                console.error("Details:");
                console.error(`  ${tsconfigError.message}`);
                console.error("");
                console.error(
                    "You can pass the path to your tsconfig file explicitly:",
                );
                console.error(
                    "  -t, --tsconfigPath <path>  Path to tsconfig.json file",
                );
                console.error("");
                process.exit(1);
            }

            console.log("✨ InversifyJs successfully installed!");
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    });

// Add module command
program
    .command("add-module <name>")
    .option("-p, --project <path>", "Path to src directory")
    .description("Add a new module to the project")
    .action(async (name, options, command) => {
        try {
            const resolved = await resolveProjectPath(command.opts().project);
            logResolvedProjectPath(resolved);
            const result = await addModule(resolved.absolutePath, name);

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
    .option("-p, --project <path>", "Path to src directory")
    .description("Copy a predefined preset module into the project")
    .action(async (name, options, command) => {
        try {
            const resolved = await resolveProjectPath(command.opts().project);
            logResolvedProjectPath(resolved);
            const result = await addPresetModule(resolved.absolutePath, name, {
                projectRoot: process.cwd(),
            });

            console.log(`✨ Preset module '${result.name}' added successfully!`);
            console.log(`📁 Location: ${result.path}`);
        } catch (error) {
            console.error("❌ Error:", error.message);
            process.exit(1);
        }
    });

program.parse(process.argv);
