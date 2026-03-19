import type { LogLevelNames, LogLevelNumbers } from "loglevel"
import stripAnsi from "strip-ansi"

import type { NamedLogger } from "./loglevel.types"

const configs: Record<string, boolean> = {}

export const createApplyLoggerSaver = () => (l: NamedLogger) =>
    applyLoggerSaver(l)

export function getSavedLogs(): LogItem[] {
    //@ts-ignore
    return globalThis.__LOGS__.list
}

export type LogItem = {
    lvl: LogLevelNames
    name: string
    args: unknown[]
    ts: number
}

export const applyLoggerSaver = function (logger: NamedLogger) {
    if (!logger || !logger.setLevel) {
        throw new TypeError("Argument is not a logger")
    }

    const originalFactory = logger.methodFactory
    const name = logger.name || ""

    //@ts-ignore
    if (!globalThis.__LOGS__) {
        //@ts-ignore
        globalThis.__LOGS__ = {
            limit: 500,
            list: [],
            timerId: setInterval(
                () => {
                    //@ts-ignore
                    const { list, limit } = globalThis.__LOGS__

                    if (list.length < limit) {
                        return
                    }

                    list.splice(0, list.length - limit)
                },
                1000 * 60 * 1,
            ),
        }
    }

    if (!configs[name]) {
        logger.methodFactory = function methodFactory(
            methodName: LogLevelNames,
            logLevel: LogLevelNumbers,
            loggerName: string | symbol,
        ) {
            const originalMethod = originalFactory(
                methodName,
                logLevel,
                loggerName,
            )

            return function (...args: unknown[]) {
                for (let i = 0; i < args.length; i++) {
                    const arg = args[i]

                    if (arg instanceof Error) {
                        args[i] = arg.message
                    }
                }

                const item: LogItem = {
                    lvl: methodName,
                    name,
                    args: args.map((s) => {
                        if (typeof s === "string") {
                            return stripAnsi(s)
                        }

                        return s
                    }),
                    ts: Date.now(),
                }

                //@ts-ignore
                const { list } = globalThis.__LOGS__

                list.push(item)

                originalMethod(...args)
            }
        }

        configs[name] = true

        // console.log(`[Logger][Plugin: Sender][Applied: ${name}]`)
    }

    return logger
}
