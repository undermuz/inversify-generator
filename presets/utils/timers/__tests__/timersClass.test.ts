import "reflect-metadata"
import { describe, expect, it, vi } from "vitest"

import { TimersClass } from "../provider"

describe("TimersClass", () => {
    it("timeout executes once and clears itself from internal map", () => {
        vi.useFakeTimers()

        const timers = new TimersClass<string>()
        const cb = vi.fn()

        const id = timers.timeout(cb, 100)

        expect(timers.has(id)).toBe(true)
        vi.advanceTimersByTime(99)
        expect(cb).toHaveBeenCalledTimes(0)

        vi.advanceTimersByTime(1)
        expect(cb).toHaveBeenCalledTimes(1)

        // callback clears itself via `clearTimeout(id)`
        expect(timers.has(id)).toBe(false)

        vi.useRealTimers()
    })

    it("clearTimeout cancels a named timeout", () => {
        vi.useFakeTimers()

        const timers = new TimersClass<string>()
        const cb = vi.fn()

        timers.timeout("job-1", cb, 100)
        expect(timers.has("job-1")).toBe(true)

        timers.clearTimeout("job-1")
        expect(timers.has("job-1")).toBe(false)

        vi.advanceTimersByTime(200)
        expect(cb).toHaveBeenCalledTimes(0)

        vi.useRealTimers()
    })

    it("interval calls repeatedly and clearInterval stops further calls", () => {
        vi.useFakeTimers()

        const timers = new TimersClass<string>()
        const cb = vi.fn()

        timers.interval("tick", cb, { interval: 50 })

        vi.advanceTimersByTime(160) // expected: 50,100,150
        expect(cb).toHaveBeenCalledTimes(3)

        timers.clearInterval("tick")
        vi.advanceTimersByTime(200) // would have produced more ticks
        expect(cb).toHaveBeenCalledTimes(3)

        vi.useRealTimers()
    })

    it("interval immediate triggers microtask call immediately", async () => {
        vi.useFakeTimers()

        const timers = new TimersClass<string>()
        const cb = vi.fn()

        timers.interval("immediate", cb, { interval: 50, immediate: true })

        // immediate callback is queued in a resolved promise microtask
        await Promise.resolve()
        expect(cb).toHaveBeenCalledTimes(1)

        vi.advanceTimersByTime(50)
        expect(cb).toHaveBeenCalledTimes(2)

        vi.useRealTimers()
    })
})

