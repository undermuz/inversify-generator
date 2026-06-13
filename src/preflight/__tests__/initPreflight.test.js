import path from "path"
import fs from "fs-extra"
import { vi } from "vitest"
import { preflightInit } from "../initPreflight.js"

describe("preflightInit", () => {
    let tempDir

    beforeEach(async () => {
        tempDir = path.join(process.cwd(), "temp-preflight-" + Math.random())
        await fs.ensureDir(tempDir)
    })

    afterEach(async () => {
        await fs.remove(tempDir)
    })

    /**
     * Minimal valid tree: templates dir, package.json, tsconfig.json with compilerOptions
     * above the search root (src → walks up to project root).
     */
    async function writeValidPackageAndTsconfig() {
        await fs.writeJson(path.join(tempDir, "package.json"), {
            name: "preflight-test",
        })
        await fs.writeJson(path.join(tempDir, "tsconfig.json"), {
            compilerOptions: { target: "ES2020" },
        })
    }

    async function writeTemplatesDir() {
        const templatesDir = path.join(tempDir, "templates")
        await fs.ensureDir(templatesDir)
        await fs.writeFile(path.join(templatesDir, "stub.txt"), "x", "utf8")
        return templatesDir
    }

    it("resolves when templates, target, package.json and tsconfig are valid", async () => {
        const templatesDir = await writeTemplatesDir()
        await writeValidPackageAndTsconfig()

        const targetDir = path.join(tempDir, "src", "app")

        await expect(
            preflightInit({
                cwd: tempDir,
                templatesDir,
                targetDir,
                tsconfigSearchRoot: targetDir,
                tsconfigPath: undefined,
            }),
        ).resolves.toBeUndefined()
    })

    it("rejects when templates directory does not exist", async () => {
        await writeValidPackageAndTsconfig()
        const missingTemplates = path.join(tempDir, "no-templates")
        const targetDir = path.join(tempDir, "src", "app")

        await expect(
            preflightInit({
                cwd: tempDir,
                templatesDir: missingTemplates,
                targetDir,
                tsconfigSearchRoot: targetDir,
                tsconfigPath: undefined,
            }),
        ).rejects.toThrow(/Templates directory does not exist/)
    })

    it("rejects when templates path is a file, not a directory", async () => {
        const templatesFile = path.join(tempDir, "not-a-dir")
        await fs.writeFile(templatesFile, "", "utf8")
        await writeValidPackageAndTsconfig()
        const targetDir = path.join(tempDir, "src", "app")

        await expect(
            preflightInit({
                cwd: tempDir,
                templatesDir: templatesFile,
                targetDir,
                tsconfigSearchRoot: targetDir,
                tsconfigPath: undefined,
            }),
        ).rejects.toThrow(/Templates directory is not a directory/)
    })

    it("rejects when project path exists as a file", async () => {
        const templatesDir = await writeTemplatesDir()
        await writeValidPackageAndTsconfig()

        const blocked = path.join(tempDir, "src", "app")
        await fs.ensureDir(path.dirname(blocked))
        await fs.writeFile(blocked, "", "utf8")

        await expect(
            preflightInit({
                cwd: tempDir,
                templatesDir,
                targetDir: blocked,
                tsconfigSearchRoot: blocked,
                tsconfigPath: undefined,
            }),
        ).rejects.toThrow(/Project path exists but is not a directory/)
    })

    it("rejects when package.json is missing", async () => {
        const templatesDir = await writeTemplatesDir()
        await fs.writeJson(path.join(tempDir, "tsconfig.json"), {
            compilerOptions: { target: "ES2020" },
        })
        const targetDir = path.join(tempDir, "app")

        await expect(
            preflightInit({
                cwd: tempDir,
                templatesDir,
                targetDir,
                tsconfigSearchRoot: targetDir,
                tsconfigPath: undefined,
            }),
        ).rejects.toThrow(/package\.json not found/)
    })

    it("rejects when package.json is not valid JSONC", async () => {
        const templatesDir = await writeTemplatesDir()
        await fs.writeFile(
            path.join(tempDir, "package.json"),
            "{ broken",
            "utf8",
        )
        await fs.writeJson(path.join(tempDir, "tsconfig.json"), {
            compilerOptions: { target: "ES2020" },
        })
        const targetDir = path.join(tempDir, "app")

        await expect(
            preflightInit({
                cwd: tempDir,
                templatesDir,
                targetDir,
                tsconfigSearchRoot: targetDir,
                tsconfigPath: undefined,
            }),
        ).rejects.toThrow(/Invalid JSONC/)
    })

    it("rejects when package.json path is a directory", async () => {
        const templatesDir = await writeTemplatesDir()
        await fs.ensureDir(path.join(tempDir, "package.json"))
        await fs.writeJson(path.join(tempDir, "tsconfig.json"), {
            compilerOptions: { target: "ES2020" },
        })
        const targetDir = path.join(tempDir, "app")

        await expect(
            preflightInit({
                cwd: tempDir,
                templatesDir,
                targetDir,
                tsconfigSearchRoot: targetDir,
                tsconfigPath: undefined,
            }),
        ).rejects.toThrow(/package\.json is not a file/)
    })

    it("rejects when no tsconfig with compilerOptions can be resolved", async () => {
        const templatesDir = await writeTemplatesDir()
        await fs.writeJson(path.join(tempDir, "package.json"), { name: "x" })
        const targetDir = path.join(tempDir, "src", "app")

        await expect(
            preflightInit({
                cwd: tempDir,
                templatesDir,
                targetDir,
                tsconfigSearchRoot: targetDir,
                tsconfigPath: undefined,
            }),
        ).rejects.toThrow(/No tsconfig\*\.json file with compilerOptions found/)
    })

    it("rejects when only tsconfig.json exists but has no compilerOptions", async () => {
        const templatesDir = await writeTemplatesDir()
        await fs.writeJson(path.join(tempDir, "package.json"), { name: "x" })
        await fs.writeJson(path.join(tempDir, "tsconfig.json"), {})
        const targetDir = path.join(tempDir, "src", "app")

        await expect(
            preflightInit({
                cwd: tempDir,
                templatesDir,
                targetDir,
                tsconfigSearchRoot: targetDir,
                tsconfigPath: undefined,
            }),
        ).rejects.toThrow(/No tsconfig\*\.json file with compilerOptions found/)
    })

    it("rejects when explicit tsconfig path does not exist", async () => {
        const templatesDir = await writeTemplatesDir()
        await fs.writeJson(path.join(tempDir, "package.json"), { name: "x" })
        const targetDir = path.join(tempDir, "app")
        const missing = path.join(tempDir, "missing-tsconfig.json")

        await expect(
            preflightInit({
                cwd: tempDir,
                templatesDir,
                targetDir,
                tsconfigSearchRoot: targetDir,
                tsconfigPath: missing,
            }),
        ).rejects.toThrow(/Specified tsconfig file does not exist/)
    })

    it("rejects when explicit tsconfig has no compilerOptions", async () => {
        const templatesDir = await writeTemplatesDir()
        await fs.writeJson(path.join(tempDir, "package.json"), { name: "x" })
        const tsPath = path.join(tempDir, "empty-ts.json")
        await fs.writeJson(tsPath, {})
        const targetDir = path.join(tempDir, "app")

        await expect(
            preflightInit({
                cwd: tempDir,
                templatesDir,
                targetDir,
                tsconfigSearchRoot: targetDir,
                // resolveTsConfigPath joins with process.cwd(); use absolute path like a resolved CLI arg
                tsconfigPath: tsPath,
            }),
        ).rejects.toThrow(/does not contain compilerOptions/)
    })

    it("accepts explicit tsconfig path when valid", async () => {
        const templatesDir = await writeTemplatesDir()
        await fs.writeJson(path.join(tempDir, "package.json"), { name: "x" })
        const custom = path.join(tempDir, "custom-ts.json")
        await fs.writeJson(custom, {
            compilerOptions: { module: "ESNext" },
        })
        const targetDir = path.join(tempDir, "nested", "app")
        // No tsconfig in parents — rely on explicit path only
        await expect(
            preflightInit({
                cwd: tempDir,
                templatesDir,
                targetDir,
                tsconfigSearchRoot: targetDir,
                tsconfigPath: custom,
            }),
        ).resolves.toBeUndefined()
    })

    it("resolves relative explicit tsconfigPath against process.cwd() (CLI behavior)", async () => {
        const templatesDir = await writeTemplatesDir()
        await fs.writeJson(path.join(tempDir, "package.json"), { name: "x" })
        await fs.writeJson(path.join(tempDir, "rel-ts.json"), {
            compilerOptions: { module: "NodeNext" },
        })
        const targetDir = path.join(tempDir, "app")

        const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tempDir)
        try {
            await expect(
                preflightInit({
                    cwd: tempDir,
                    templatesDir,
                    targetDir,
                    tsconfigSearchRoot: targetDir,
                    tsconfigPath: "rel-ts.json",
                }),
            ).resolves.toBeUndefined()
        } finally {
            cwdSpy.mockRestore()
        }
    })

    it("accepts package.json with comments (JSONC)", async () => {
        const templatesDir = await writeTemplatesDir()
        await fs.writeFile(
            path.join(tempDir, "package.json"),
            `{
  "name": "x"
  // comment
}`,
            "utf8",
        )
        await fs.writeJson(path.join(tempDir, "tsconfig.json"), {
            compilerOptions: { target: "ES2020" },
        })
        const targetDir = path.join(tempDir, "app")

        await expect(
            preflightInit({
                cwd: tempDir,
                templatesDir,
                targetDir,
                tsconfigSearchRoot: targetDir,
                tsconfigPath: undefined,
            }),
        ).resolves.toBeUndefined()
    })
})
