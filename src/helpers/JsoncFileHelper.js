import fs from "fs-extra"
import { parse, modify, applyEdits, printParseErrorCode } from "jsonc-parser"

const PARSE_OPTIONS = { allowTrailingComma: true }

function gcd(a, b) {
    a = Math.abs(a)
    b = Math.abs(b)
    while (b) {
        const t = b
        b = a % b
        a = t
    }
    return a || 1
}

function gcdArray(nums) {
    if (nums.length === 0) return 2
    if (nums.length === 1) return nums[0]
    return nums.reduce((a, b) => gcd(a, b))
}

/**
 * Read / patch JSONC (JSON with comments, trailing commas) while preserving formatting.
 */
export class JsoncFileHelper {
    /**
     * Infer jsonc-parser formatting from existing file text (EOL, tabs vs spaces, indent width).
     */
    static detectFormattingOptions(text) {
        const eol = text.includes("\r\n") ? "\r\n" : "\n"
        const lines = text.split(/\r\n|\n|\r/)

        let sawTabIndent = false
        const spaceIndents = []

        for (const line of lines) {
            const m = line.match(/^([ \t]+)\S/)
            if (!m) continue
            const ws = m[1]
            if (ws.includes("\t")) {
                sawTabIndent = true
                break
            }
            spaceIndents.push(ws.length)
        }

        if (sawTabIndent) {
            return { eol, insertSpaces: false, tabSize: 4 }
        }

        if (spaceIndents.length > 0) {
            const g = gcdArray(spaceIndents)
            const tabSize = g >= 2 ? g : 2
            return { eol, insertSpaces: true, tabSize }
        }

        return { eol, insertSpaces: true, tabSize: 2 }
    }

    /** Options object for {@linkcode modify} derived from file contents. */
    static modificationOptionsFromText(text) {
        return { formattingOptions: this.detectFormattingOptions(text) }
    }

    static parse(text, filePath = "") {
        const errors = []
        const data = parse(text, errors, PARSE_OPTIONS)
        if (errors.length > 0) {
            const msg = errors
                .map((e) => printParseErrorCode(e.error))
                .join("; ")
            const where = filePath ? ` in ${filePath}` : ""
            throw new Error(`Invalid JSONC${where}: ${msg}`)
        }
        return data
    }

    static applyModification(text, jsonPath, value, modificationOptions) {
        return applyEdits(
            text,
            modify(text, jsonPath, value, modificationOptions),
        )
    }

    static async readFile(filePath) {
        const text = await fs.readFile(filePath, "utf8")
        const data = this.parse(text, filePath)
        return { text, data }
    }

    static async writeFile(filePath, text) {
        await fs.writeFile(filePath, text, "utf8")
    }
}
