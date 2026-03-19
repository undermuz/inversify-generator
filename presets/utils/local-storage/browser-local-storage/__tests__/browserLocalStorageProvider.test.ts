import "reflect-metadata"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { BrowserLocalStorageProvider } from "../provider"

type StorageRecord = Record<string, string>

function createLocalStorageStub() {
    const store: StorageRecord = {}

    // `BrowserLocalStorageProvider#getKeys` relies on `Object.keys(localStorage)`,
    // so we make stored keys enumerable properties on the stub object.
    const localStorageStub: any = {
        getItem: vi.fn((key: string) => {
            if (Object.prototype.hasOwnProperty.call(store, key)) {
                return store[key]
            }

            return null
        }),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = String(value)

            Object.defineProperty(localStorageStub, key, {
                value: store[key],
                writable: true,
                enumerable: true,
                configurable: true,
            })
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key]

            // Remove enumerable property too
            delete localStorageStub[key]
        }),
    }

    return localStorageStub as StorageRecord & {
        getItem: (key: string) => string | null
        setItem: (key: string, value: string) => void
        removeItem: (key: string) => void
    }
}

describe("BrowserLocalStorageProvider", () => {
    let localStorageStub: any
    let provider: BrowserLocalStorageProvider

    beforeEach(() => {
        localStorageStub = createLocalStorageStub()
        ;(globalThis as any).localStorage = localStorageStub
        provider = new BrowserLocalStorageProvider()
    })

    it("uses default prefix v1:", async () => {
        const key = "test"
        await provider.setItem(key, "value")

        expect(localStorageStub.setItem).toHaveBeenCalledWith("v1:test", "value")
        expect(await provider.getItem(key)).toBe("value")

        await provider.removeItem(key)
        expect(await provider.getItem(key)).toBeNull()
    })

    it("initialize updates prefix and affects key mapping", async () => {
        await provider.initialize({ prefix: "custom:" })

        await provider.setItem("a", "1")
        expect(await provider.getItem("a")).toBe("1")
        expect(localStorageStub.getItem).toHaveBeenCalledWith("custom:a")

        const keys = await provider.getKeys()
        expect(keys).toEqual(["a"])
    })

    it("getKeys returns only keys for current prefix (without prefix part)", async () => {
        await provider.initialize({ prefix: "p:" })

        await provider.setItem("x", "10")
        await provider.setItem("y", "20")

        // add foreign keys directly
        localStorageStub.setItem("other:z", "999")

        const keys = await provider.getKeys()
        expect(keys.sort()).toEqual(["x", "y"])
    })

    it("getItem returns null for missing keys", async () => {
        await provider.initialize({ prefix: "p:" })
        expect(await provider.getItem("missing")).toBeNull()
    })
})

