import path from "path"
import fs from "fs-extra"
import { addPresetModule } from "../addPresetModule.js"

describe("addPresetModule", () => {
    let tempDir
    let diPath
    const diPathExists = (...parts) =>
        fs.pathExists(path.join(diPath, ...parts))

    beforeEach(async () => {
        tempDir = path.join(process.cwd(), "temp-test-" + Math.random())
        await fs.ensureDir(tempDir)
        diPath = path.join(tempDir, "di")
        await fs.ensureDir(diPath)
        // Copy a basic container.ts
        await fs.writeFile(
            path.join(diPath, "container.ts"),
            `import { Container } from "inversify";

/* MODULES */
import { MyProviderModule } from "./my-provider/module";

export const createDiContainer = () => {
    const di: Container = new Container();

    di.load(MyProviderModule);

    return di;
};`,
        )
    })

    afterEach(async () => {
        await fs.remove(tempDir)
    })

    it("should copy base env preset without implementation wiring", async () => {
        const result = await addPresetModule(diPath, "env")

        expect(result.name).toBe("env")
        expect(result.path).toBe(path.join(diPath, "env"))

        // Check files copied
        expect(await diPathExists("env", "types.ts")).toBe(true)
        expect(await diPathExists("env", "vite", "module.ts")).toBe(false)

        // Check container updated
        const containerContent = await fs.readFile(
            path.join(diPath, "container.ts"),
            "utf-8",
        )
        expect(containerContent).not.toContain("EnvViteModule")
    })

    it("should support env implementation preset (env/vite)", async () => {
        const result = await addPresetModule(diPath, "env/vite")

        expect(result.name).toBe("env/vite")
        expect(result.path).toBe(path.join(diPath, "env", "vite"))

        expect(await diPathExists("env", "types.ts")).toBe(true)
        expect(await diPathExists("env", "vite", "module.ts")).toBe(true)
        expect(await diPathExists("env", "vite", "provider.ts")).toBe(true)

        const containerContent = await fs.readFile(
            path.join(diPath, "container.ts"),
            "utf-8",
        )
        expect(containerContent).toContain(
            'import { EnvViteModule } from "./env/vite/module";',
        )
        expect(containerContent).toContain("di.load(EnvViteModule);")
    })

    it("should support nested selector and copy dependencies", async () => {
        const result = await addPresetModule(diPath, "utils/cache")

        expect(result.name).toBe("utils/cache")
        expect(result.path).toBe(path.join(diPath, "utils", "cache"))

        // Main preset files
        expect(await diPathExists("utils", "cache", "module.ts")).toBe(true)
        expect(await diPathExists("utils", "cache", "provider.ts")).toBe(true)

        // Dependencies
        expect(await diPathExists("utils", "local-storage", "types.ts")).toBe(
            true,
        )
        expect(await diPathExists("types", "initializable.ts")).toBe(true)

        // Implementation should not be auto-selected
        expect(
            await diPathExists(
                "utils",
                "local-storage",
                "browser-local-storage",
                "module.ts",
            ),
        ).toBe(false)

        const containerContent = await fs.readFile(
            path.join(diPath, "container.ts"),
            "utf-8",
        )
        expect(containerContent).toContain(
            'import { CacheModule } from "./utils/cache/module";',
        )
        expect(containerContent).not.toContain("BrowserLocalStorageModule")
        expect(containerContent).toContain("di.load(CacheModule);")
    })

    it("should copy event-bus preset with its abstract dependencies", async () => {
        const result = await addPresetModule(diPath, "utils/event-bus")

        expect(result.name).toBe("utils/event-bus")
        expect(result.path).toBe(path.join(diPath, "utils", "event-bus"))

        // Main preset files
        expect(await diPathExists("utils", "event-bus", "provider.ts")).toBe(
            true,
        )
        expect(await diPathExists("utils", "event-bus", "types.ts")).toBe(true)
        expect(await diPathExists("utils", "event-bus", "module.ts")).toBe(true)

        // Dependencies
        expect(await diPathExists("utils", "common", "catchError.ts")).toBe(
            true,
        )
        expect(await diPathExists("logger", "types.ts")).toBe(true)
        expect(await diPathExists("types", "logger.ts")).toBe(true)

        // Tests should never be copied
        expect(await diPathExists("utils", "event-bus", "__tests__")).toBe(
            false,
        )

        // Module wiring should be added from preset metadata
        const containerContent = await fs.readFile(
            path.join(diPath, "container.ts"),
            "utf-8",
        )
        expect(containerContent).toContain(
            'import { EventBusModule } from "./utils/event-bus/module";',
        )
        expect(containerContent).toContain("di.load(EventBusModule);")
    })

    it("should support choosing implementation preset (logger/logtape)", async () => {
        const result = await addPresetModule(diPath, "logger/logtape")

        expect(result.name).toBe("logger/logtape")
        expect(result.path).toBe(path.join(diPath, "logger", "logtape"))

        expect(
            await diPathExists("logger", "logtape", "logtape.module.ts"),
        ).toBe(true)
        expect(await diPathExists("logger", "types.ts")).toBe(true)
        expect(await diPathExists("types", "logger.ts")).toBe(true)

        const containerContent = await fs.readFile(
            path.join(diPath, "container.ts"),
            "utf-8",
        )
        expect(containerContent).toContain(
            'import { LogTapeModule } from "./logger/logtape/logtape.module";',
        )
        expect(containerContent).toContain("di.load(LogTapeModule);")
    })

    it("should throw error if preset does not exist", async () => {
        await expect(addPresetModule(diPath, "nonexistent")).rejects.toThrow(
            "not found in templates",
        )
    })

    it("should throw error if path is not a standalone preset", async () => {
        await expect(addPresetModule(diPath, "utils")).rejects.toThrow(
            "missing preset.json",
        )
    })

    it("should throw error if module already exists in di", async () => {
        // First copy env preset
        await addPresetModule(diPath, "env")
        // Now try to add again
        await expect(addPresetModule(diPath, "env")).rejects.toThrow(
            "already exists",
        )
    })
})
