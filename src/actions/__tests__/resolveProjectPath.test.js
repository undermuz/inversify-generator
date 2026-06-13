import path from "path"
import fs from "fs-extra"
import {
    findInversifyContainerFiles,
    isInversifyContainerSource,
    resolveProjectPath,
} from "../../helpers/resolveProjectPath.js"

describe("resolveProjectPath", () => {
    let tempDir

    beforeEach(async () => {
        tempDir = path.join(process.cwd(), "temp-test-" + Math.random())
        await fs.ensureDir(tempDir)
    })

    afterEach(async () => {
        await fs.remove(tempDir)
    })

    it("detects inversify container sources", () => {
        expect(
            isInversifyContainerSource(`
                import { Container } from "inversify";
                export const di = new Container();
            `),
        ).toBe(true)

        expect(
            isInversifyContainerSource(`
                import { Container } from "inversify";
                export const di = Container();
            `),
        ).toBe(false)
    })

    it("uses explicit project path when provided", async () => {
        const result = await resolveProjectPath("apps/web/src", {
            searchRoot: tempDir,
        })

        expect(result).toEqual({
            absolutePath: path.resolve(tempDir, "apps/web/src"),
            detected: false,
            containerFile: null,
            usedFallback: false,
        })
    })

    it("detects project directory from container.ts", async () => {
        const projectDir = path.join(tempDir, "src")
        await fs.ensureDir(projectDir)
        await fs.writeFile(
            path.join(projectDir, "container.ts"),
            `import { Container } from "inversify";
export const createDiContainer = () => new Container();`,
        )

        const result = await resolveProjectPath(undefined, {
            searchRoot: tempDir,
        })

        expect(result.detected).toBe(true)
        expect(result.absolutePath).toBe(projectDir)
        expect(result.containerFile).toBe(path.join(projectDir, "container.ts"))
    })

    it("prefers container.ts over deeper custom files", async () => {
        const projectDir = path.join(tempDir, "src")
        await fs.ensureDir(path.join(projectDir, "nested"))
        await fs.writeFile(
            path.join(projectDir, "nested", "bootstrap.ts"),
            `import { Container } from "inversify";
export const di = new Container();`,
        )
        await fs.writeFile(
            path.join(projectDir, "container.ts"),
            `import { Container } from "inversify";
export const di = new Container();`,
        )

        const result = await resolveProjectPath(undefined, {
            searchRoot: tempDir,
        })

        expect(result.absolutePath).toBe(projectDir)
        expect(result.containerFile).toBe(path.join(projectDir, "container.ts"))
    })

    it("falls back to src when no container is found", async () => {
        const result = await resolveProjectPath(undefined, {
            searchRoot: tempDir,
        })

        expect(result.detected).toBe(false)
        expect(result.usedFallback).toBe(true)
        expect(result.absolutePath).toBe(path.join(tempDir, "src"))
    })

    it("throws when multiple equally ranked containers are found", async () => {
        const first = path.join(tempDir, "src/a")
        const second = path.join(tempDir, "src/b")
        await fs.ensureDir(first)
        await fs.ensureDir(second)

        const source = `import { Container } from "inversify";
export const di = new Container();`

        await fs.writeFile(path.join(first, "container.ts"), source)
        await fs.writeFile(path.join(second, "container.ts"), source)

        await expect(
            resolveProjectPath(undefined, { searchRoot: tempDir }),
        ).rejects.toThrow("Multiple Inversify container files found")
    })

    it("findInversifyContainerFiles skips node_modules", async () => {
        await fs.ensureDir(path.join(tempDir, "node_modules/pkg"))
        await fs.writeFile(
            path.join(tempDir, "node_modules/pkg/container.ts"),
            `import { Container } from "inversify";
export const di = new Container();`,
        )

        const matches = await findInversifyContainerFiles(tempDir)

        expect(matches).toEqual([])
    })
})
