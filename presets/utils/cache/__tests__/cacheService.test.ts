import "reflect-metadata"
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { Container } from "inversify"

import { CacheProvider } from "../types"
import { CacheService } from "../provider"
import type { ICacheConfig, ICacheProvider } from "../types"
import type { ILocalStorage } from "../../local-storage/types"
import { LocalStorageProvider } from "../../local-storage/types"

function createLocalStorageStub() {
    const store: Record<string, string> = {}

    return {
        initialize: vi.fn(async () => {}),
        getKeys: vi.fn(async () => Object.keys(store)),
        getItem: vi.fn(async (key: string) => (key in store ? store[key] : null)),
        setItem: vi.fn(async (key: string, value: string) => {
            store[key] = value
        }),
        removeItem: vi.fn(async (key: string) => {
            delete store[key]
        }),
        // test helper
        __store: store,
    } as unknown as ILocalStorage & { __store: Record<string, string> }
}

describe("CacheService", () => {
    let localStorage: ReturnType<typeof createLocalStorageStub>
    let container: Container
    let cache: ICacheProvider

    const prefix = "v1:"

    beforeEach(() => {
        localStorage = createLocalStorageStub()
        container = new Container()

        container
            .bind(LocalStorageProvider)
            .toConstantValue(localStorage as any)

        container.bind(CacheProvider).to(CacheService).inSingletonScope()
        cache = container.get(CacheProvider) as ICacheProvider
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("set/get/has work until TTL expires; then value is deleted", async () => {
        const now = 10_000
        vi.spyOn(Date, "now").mockReturnValue(now)

        const config: ICacheConfig = { prefix, ttl: 1000 }
        await cache.initialize(config)

        await cache.set("k", "v", 100)
        expect(await cache.has("k")).toBe(true)
        expect(await cache.get<string>("k")).toBe("v")
        expect(await localStorage.getItem(`${prefix}k`)).not.toBeNull()

        vi.spyOn(Date, "now").mockReturnValue(now + 101)
        expect(await cache.get<string>("k")).toBeUndefined()
        expect(await cache.has("k")).toBe(false)
        expect(await localStorage.getItem(`${prefix}k`)).toBeNull()
    })

    it("delete removes item from both internal maps and localStorage", async () => {
        const now = 20_000
        vi.spyOn(Date, "now").mockReturnValue(now)

        const config: ICacheConfig = { prefix, ttl: 1000 }
        await cache.initialize(config)

        await cache.set("k", "v", 1000)
        expect(await cache.has("k")).toBe(true)

        await cache.delete("k")
        expect(await cache.has("k")).toBe(false)
        expect(await localStorage.getItem(`${prefix}k`)).toBeNull()
    })

    it("clear deletes all cached items", async () => {
        const now = 30_000
        vi.spyOn(Date, "now").mockReturnValue(now)

        const config: ICacheConfig = { prefix, ttl: 1000 }
        await cache.initialize(config)

        await cache.set("a", "1", 1000)
        await cache.set("b", "2", 1000)

        expect(await cache.has("a")).toBe(true)
        expect(await cache.has("b")).toBe(true)

        await cache.clear()

        expect(await cache.has("a")).toBe(false)
        expect(await cache.has("b")).toBe(false)
        expect(localStorage.__store[`${prefix}a`]).toBeUndefined()
        expect(localStorage.__store[`${prefix}b`]).toBeUndefined()
    })

    it("initialize loads valid entries and deletes expired ones from localStorage", async () => {
        const now = 40_000
        vi.spyOn(Date, "now").mockReturnValue(now)

        // Manually populate localStorage with both valid and expired entries.
        await localStorage.setItem(
            `${prefix}a`,
            JSON.stringify({ value: "A", expiresAt: now + 5000 }),
        )
        await localStorage.setItem(
            `${prefix}b`,
            JSON.stringify({ value: "B", expiresAt: now - 1 }),
        )
        await localStorage.setItem(
            `other:c`,
            JSON.stringify({ value: "C", expiresAt: now + 5000 }),
        )

        const config: ICacheConfig = { prefix, ttl: 1000 }
        await cache.initialize(config)

        expect(await cache.get<string>("a")).toBe("A")
        expect(await cache.get<string>("b")).toBeUndefined()
        // ensure wrong prefix ignored
        expect(await cache.has("c")).toBe(false)

        // expired one should be deleted from storage
        expect(await localStorage.getItem(`${prefix}b`)).toBeNull()
    })
})

