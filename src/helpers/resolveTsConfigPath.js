import fs from "fs-extra"
import path from "path"
import { JsoncFileHelper } from "./JsoncFileHelper.js"

/**
 * Locate tsconfig (auto-search or explicit path), ensure it exists, parses as JSONC,
 * and has `compilerOptions`.
 *
 * @param {string} root - Directory to start searching from (usually the app folder)
 * @param {string | undefined} tsconfigPath - Optional path relative to cwd or absolute
 * @param {{ quiet?: boolean }} [options] - When `quiet`, skip candidate log lines
 * @returns {Promise<string>} Resolved path to the chosen tsconfig file
 */
export async function resolveTsConfigPath(root, tsconfigPath, { quiet = false } = {}) {
    let configPath = tsconfigPath ? path.resolve(process.cwd(), tsconfigPath) : null

    if (!configPath) {
        let current = path.resolve(root)
        const stop = path.resolve(process.cwd())
        const pattern = /^tsconfig.*\.json$/i

        while (true) {
            if (current.startsWith(stop)) {
                const entries = await fs.readdir(current)

                for (const entry of entries) {
                    if (pattern.test(entry)) {
                        const candidate = path.join(current, entry)
                        if (!quiet) {
                            console.log(`📄 Candidate tsconfig file: ${candidate}`)
                        }

                        const { data: content } =
                            await JsoncFileHelper.readFile(candidate)

                        if (content && content.compilerOptions) {
                            configPath = candidate
                            if (!quiet) {
                                console.log(`✅ Using tsconfig file: ${configPath}`)
                            }
                            break
                        }
                    }
                }
            }

            if (configPath) break

            if (current === stop || current === path.parse(current).root) {
                break
            }

            current = path.dirname(current)
        }
    }

    if (!configPath) {
        throw new Error(
            "No tsconfig*.json file with compilerOptions found. Please specify with --tsconfigPath option.",
        )
    }

    if (!(await fs.pathExists(configPath))) {
        throw new Error(`Specified tsconfig file does not exist: ${configPath}`)
    }

    const { data } = await JsoncFileHelper.readFile(configPath)
    if (!data.compilerOptions) {
        throw new Error(
            `The tsconfig file does not contain compilerOptions: ${configPath}`,
        )
    }

    return configPath
}
