import fs from "fs-extra"
import path from "path"
import { access, constants } from "fs/promises"
import { JsoncFileHelper } from "../helpers/JsoncFileHelper.js"
import { resolveTsConfigPath } from "../helpers/resolveTsConfigPath.js"

async function assertIsDirectory(dirPath, label) {
    if (!(await fs.pathExists(dirPath))) {
        throw new Error(`${label} does not exist: ${dirPath}`)
    }

    const st = await fs.stat(dirPath)

    if (!st.isDirectory()) {
        throw new Error(`${label} is not a directory: ${dirPath}`)
    }
}

async function assertTemplatesReadable(templatesDir) {
    await assertIsDirectory(templatesDir, "Templates directory")

    try {
        await fs.readdir(templatesDir)
    } catch (e) {
        throw new Error(
            `Cannot read templates directory (permissions?): ${templatesDir}`,
        )
    }
}

/**
 * Ensures we can create a new file in this directory (copy / probe write).
 */
async function assertDirectoryWritable(dirPath) {
    await fs.ensureDir(dirPath)
    await assertIsDirectory(dirPath, "Target directory")

    const marker = path.join(
        dirPath,
        `.inversify-init-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    )

    try {
        await fs.writeFile(marker, "ok", "utf8")
        await fs.remove(marker)
    } catch {
        throw new Error(
            `Cannot write into project directory (check permissions): ${dirPath}`,
        )
    }
}

async function assertTargetPathOk(targetDir) {
    if (await fs.pathExists(targetDir)) {
        const st = await fs.stat(targetDir)

        if (!st.isDirectory()) {
            throw new Error(
                `Project path exists but is not a directory: ${targetDir}`,
            )
        }
    }

    await assertDirectoryWritable(targetDir)
}

async function assertFileReadWrite(filePath, label) {
    if (!(await fs.pathExists(filePath))) {
        throw new Error(`${label} not found: ${filePath}`)
    }

    const st = await fs.stat(filePath)

    if (!st.isFile()) {
        throw new Error(`${label} is not a file: ${filePath}`)
    }

    try {
        await access(filePath, constants.R_OK | constants.W_OK)
    } catch {
        throw new Error(`No read/write permission for ${label}: ${filePath}`)
    }
}

/**
 * Run before copying templates: templates readable, target directory writable (probe file),
 * `package.json` / tsconfig exist, parse as JSONC, and pass `fs.access` read+write.
 */
export async function preflightInit({
    cwd,
    templatesDir,
    targetDir,
    tsconfigSearchRoot,
    tsconfigPath,
}) {
    await assertTemplatesReadable(templatesDir)
    await assertTargetPathOk(targetDir)

    const packageJsonPath = path.join(cwd, "package.json")
    await assertFileReadWrite(packageJsonPath, "package.json")
    await JsoncFileHelper.readFile(packageJsonPath)

    const tsResolved = await resolveTsConfigPath(
        tsconfigSearchRoot,
        tsconfigPath,
        {
            quiet: true,
        },
    )
    await assertFileReadWrite(tsResolved, "tsconfig")
}
