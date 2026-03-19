import "reflect-metadata"
import { beforeEach, describe, expect, it, vi } from "vitest"

import EventObserver from "../provider"

type Events = {
    ping: [number]
}

function createTestLogger() {
    return {
        trace: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    }
}

function createLoggerFactory(logger: any) {
    return () => logger
}

function createObserver(logger: ReturnType<typeof createTestLogger>) {
    return new EventObserver<Events>(createLoggerFactory(logger) as any)
}

describe("EventObserver", () => {
    let logger: ReturnType<typeof createTestLogger>
    let parent: EventObserver<Events>
    let child: EventObserver<Events>

    beforeEach(() => {
        logger = createTestLogger()
        parent = createObserver(logger)
        child = createObserver(logger)
    })

    it("works without connect: same instance receives its own emit", () => {
        const handler = vi.fn()

        parent.on("ping", handler as any)
        parent.emit("ping", 1)

        expect(handler).toHaveBeenCalledTimes(1)
        expect(handler).toHaveBeenCalledWith(1)
    })

    it("works with connect: child receives events from connected parent", () => {
        child.connect(parent as any)

        const handler = vi.fn()
        child.on("ping", handler as any)

        parent.emit("ping", 2)
        expect(handler).toHaveBeenCalledTimes(1)
        expect(handler).toHaveBeenCalledWith(2)

        child.destroy()
        parent.emit("ping", 3)
        expect(handler).toHaveBeenCalledTimes(1)
    })

    it("child.destroy does not remove parent's own subscriptions", () => {
        const parentHandler = vi.fn()
        const childHandler = vi.fn()

        parent.on("ping", parentHandler as any)

        child.connect(parent as any)
        child.on("ping", childHandler as any)

        parent.emit("ping", 1)
        expect(parentHandler).toHaveBeenCalledTimes(1)
        expect(childHandler).toHaveBeenCalledTimes(1)

        child.destroy()
        parent.emit("ping", 2)

        expect(parentHandler).toHaveBeenCalledTimes(2)
        expect(childHandler).toHaveBeenCalledTimes(1)
    })

    it("one child can connect to multiple parents and unsubscribe from all", () => {
        const parent1 = createObserver(logger)
        const parent2 = createObserver(logger)

        child.connect(parent1 as any)
        child.connect(parent2 as any)

        const handler = vi.fn()
        child.on("ping", handler as any)

        parent1.emit("ping", 1)
        parent2.emit("ping", 2)

        expect(handler).toHaveBeenCalledTimes(2)
        expect(handler).toHaveBeenNthCalledWith(1, 1)
        expect(handler).toHaveBeenNthCalledWith(2, 2)

        child.destroy()

        parent1.emit("ping", 3)
        parent2.emit("ping", 4)
        expect(handler).toHaveBeenCalledTimes(2)
    })
})

