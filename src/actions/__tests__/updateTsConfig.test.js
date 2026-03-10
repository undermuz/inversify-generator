import path from "path"
import fs from "fs-extra"
import { updateTsConfig } from "../updateTsConfig.js"

describe("updateTsConfig", () => {
    let tempDir

    beforeEach(async () => {
        tempDir = path.join(process.cwd(), "temp-test-" + Math.random())
        await fs.ensureDir(tempDir)
    })

    afterEach(async () => {
        await fs.remove(tempDir)
    })

    it("should update existing tsconfig.json in same folder", async () => {
        const tsconfigPath = path.join(tempDir, "tsconfig.json")
        await fs.writeJson(tsconfigPath, {
            compilerOptions: {
                target: "ES2020",
            },
        })

        const result = await updateTsConfig(tempDir, null)

        expect(result).toBe(tsconfigPath)
        const config = await fs.readJson(tsconfigPath)
        expect(config.compilerOptions.emitDecoratorMetadata).toBe(true)
        expect(config.compilerOptions.experimentalDecorators).toBe(true)
    })

    it("should use specified tsconfigPath", async () => {
        const customPath = path.join(tempDir, "custom.json")
        await fs.writeJson(customPath, {
            compilerOptions: {},
        })

        const result = await updateTsConfig(tempDir, customPath)

        expect(result).toBe(customPath)
        const config = await fs.readJson(customPath)
        expect(config.compilerOptions.emitDecoratorMetadata).toBe(true)
    })

    it("should search parent directories up to cwd", async () => {
        // create nested directory
        const child = path.join(tempDir, "child", "deep")
        await fs.ensureDir(child)
        const tsconfigPath = path.join(tempDir, "tsconfig.app.json")
        await fs.writeJson(tsconfigPath, {
            compilerOptions: {
                module: "ESNext",
            },
        })

        const result = await updateTsConfig(child, null)
        expect(result).toBe(tsconfigPath)
        const config = await fs.readJson(tsconfigPath)
        expect(config.compilerOptions.emitDecoratorMetadata).toBe(true)
    })

    it("prefers tsconfig.app.json over a plain tsconfig without options in same folder", async () => {
        const child = path.join(tempDir, "nested")
        await fs.ensureDir(child)

        // in nested folder, create two configs
        const bad = path.join(child, "tsconfig.json")
        await fs.writeJson(bad, {})
        const good = path.join(child, "tsconfig.app.json")
        await fs.writeJson(good, { compilerOptions: { strict: true } })

        // also add root config
        const root = path.join(tempDir, "tsconfig.json")
        await fs.writeJson(root, { compilerOptions: { target: "ES5" } })

        const result = await updateTsConfig(child, null)
        expect(result).toBe(good)
        const config = await fs.readJson(good)
        expect(config.compilerOptions.emitDecoratorMetadata).toBe(true)
    })

    it("should throw error if no tsconfig found", async () => {
        await expect(updateTsConfig(tempDir, null)).rejects.toThrow(
            "No tsconfig*.json file with compilerOptions found",
        )
    })

    it("when nested folder has tsconfig.app.json with options and tsconfig.json without, choose tsconfig.app.json", async () => {
        const child = path.join(tempDir, "level1", "level2")
        await fs.ensureDir(child)

        // nested folder has both configs
        const bad = path.join(child, "tsconfig.json")
        await fs.writeJson(bad, {})
        const good = path.join(child, "tsconfig.app.json")
        await fs.writeJson(good, { compilerOptions: { foo: true } })

        // root contains a valid tsconfig.json too
        const rootPath = path.join(tempDir, "tsconfig.json")
        await fs.writeJson(rootPath, { compilerOptions: { bar: true } })

        const result = await updateTsConfig(child, null)
        expect(result).toBe(good)
        const config = await fs.readJson(good)
        expect(config.compilerOptions.emitDecoratorMetadata).toBe(true)
    })

    it("should throw error if specified tsconfig has no compilerOptions", async () => {
        const tsconfigPath = path.join(tempDir, "tsconfig.json")
        await fs.writeJson(tsconfigPath, {})

        await expect(updateTsConfig(tempDir, tsconfigPath)).rejects.toThrow(
            "does not contain compilerOptions",
        )
    })
})
