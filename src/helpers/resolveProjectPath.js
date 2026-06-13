import fs from "fs-extra"
import path from "path"

const DEFAULT_PROJECT_PATH = "src"

const SKIP_DIRS = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    ".next",
    ".turbo",
    ".nx",
    "presets",
    "templates",
])

const SOURCE_EXTENSIONS = new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mts",
    ".cts",
])

function hasInversifyImport(content) {
    return /(?:from\s+["']inversify["']|require\s*\(\s*["']inversify["']\s*\))/.test(
        content,
    )
}

function hasNewContainer(content) {
    return /\bnew\s+Container\s*(?:<[^>]*>)?\s*\(/.test(content)
}

export function isInversifyContainerSource(content) {
    return hasInversifyImport(content) && hasNewContainer(content)
}

function shouldSkipDir(name) {
    return (
        SKIP_DIRS.has(name) ||
        name.startsWith("temp-test-") ||
        (name.startsWith(".") && name !== ".")
    )
}

async function walkForContainerFiles(dir, searchRoot, results) {
    let entries

    try {
        entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
        return
    }

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
            if (shouldSkipDir(entry.name)) {
                continue
            }

            await walkForContainerFiles(fullPath, searchRoot, results)
            continue
        }

        if (!entry.isFile()) {
            continue
        }

        const ext = path.extname(entry.name)
        if (!SOURCE_EXTENSIONS.has(ext)) {
            continue
        }

        let content
        try {
            content = await fs.readFile(fullPath, "utf-8")
        } catch {
            continue
        }

        if (isInversifyContainerSource(content)) {
            results.push(fullPath)
        }
    }
}

export async function findInversifyContainerFiles(searchRoot = process.cwd()) {
    const root = path.resolve(searchRoot)
    const results = []

    await walkForContainerFiles(root, root, results)

    return results.sort((a, b) => a.localeCompare(b))
}

function rankContainerMatch(file, cwd) {
    const relative = path.relative(cwd, file)
    const depth = relative.split(path.sep).filter(Boolean).length

    return {
        file,
        dir: path.dirname(file),
        depth,
        isNamedContainer: /^container\.tsx?$/i.test(path.basename(file)),
    }
}

/**
 * Resolve the project directory used by add-module / add-preset-module.
 * When --project is omitted, searches for a file with an inversify import and `new Container()`.
 */
export async function resolveProjectPath(explicitPath, options = {}) {
    const {
        fallback = DEFAULT_PROJECT_PATH,
        searchRoot = process.cwd(),
        autoDetect = true,
    } = options
    const cwd = path.resolve(searchRoot)

    if (explicitPath) {
        return {
            absolutePath: path.resolve(cwd, explicitPath),
            detected: false,
            containerFile: null,
            usedFallback: false,
        }
    }

    if (!autoDetect) {
        return {
            absolutePath: path.resolve(cwd, fallback),
            detected: false,
            containerFile: null,
            usedFallback: true,
        }
    }

    const matches = await findInversifyContainerFiles(cwd)

    if (matches.length === 0) {
        return {
            absolutePath: path.resolve(cwd, fallback),
            detected: false,
            containerFile: null,
            usedFallback: true,
        }
    }

    const ranked = matches
        .map((file) => rankContainerMatch(file, cwd))
        .sort((a, b) => {
            if (a.isNamedContainer !== b.isNamedContainer) {
                return Number(b.isNamedContainer) - Number(a.isNamedContainer)
            }

            return a.depth - b.depth
        })

    const best = ranked[0]
    const tied = ranked.filter(
        (entry) =>
            entry.isNamedContainer === best.isNamedContainer &&
            entry.depth === best.depth,
    )

    if (tied.length > 1) {
        const listing = tied
            .map((entry) => `  - ${path.relative(cwd, entry.file)}`)
            .join("\n")

        throw new Error(
            `Multiple Inversify container files found:\n${listing}\nSpecify the project directory with --project=<path>`,
        )
    }

    return {
        absolutePath: best.dir,
        detected: true,
        containerFile: best.file,
        usedFallback: false,
    }
}

export { DEFAULT_PROJECT_PATH }
