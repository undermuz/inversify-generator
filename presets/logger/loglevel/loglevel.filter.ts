import { LogLevelNames, LogLevelNumbers } from "loglevel"
import { NamedLogger } from "./loglevel.types"

const configs: Record<string, boolean> = {}

export const loggerFilterPlugin = (
    logger: NamedLogger,
    filter: (name: string, methodName: string, args: unknown[]) => boolean,
) => {
    const name = logger.name || ""

    if (!configs[name]) {
        const originalFactory = logger.methodFactory

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

            return function (...args) {
                const allowed = filter(name, methodName, args)

                if (!allowed) {
                    return
                }

                originalMethod(...args)
            }
        }

        configs[name] = true
    }

    return logger
}
