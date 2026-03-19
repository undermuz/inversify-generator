import { LogLevelNames, LogLevelNumbers } from "loglevel"
import type { NamedLogger } from "./loglevel.types"

const configs: Record<string, boolean> = {}

export const loggerDebugPlugin = (logger: NamedLogger) => {
    const name = logger.name || ""

    if (!configs[name]) {
        const originalFactory = logger.methodFactory
        const consoleDebug = console.debug.bind(console)

        logger.methodFactory = function methodFactory(
            methodName: LogLevelNames,
            logLevel: LogLevelNumbers,
            loggerName: string | symbol,
        ) {
            if (methodName === "debug") {
                return consoleDebug
            }

            return originalFactory(methodName, logLevel, loggerName)
        }

        configs[name] = true
    }

    return logger
}
