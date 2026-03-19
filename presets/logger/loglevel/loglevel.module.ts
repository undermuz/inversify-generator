import { ContainerModule, Factory } from "inversify"
import type { ILogger } from "../../types/logger"

import { loggerFactory } from "./loglevel.factory"
import { ILoggerSettings } from "../types"

export const LogLevelModule = new ContainerModule(({ bind }) => {
    bind<Factory<ILogger>>("Factory<Logger>").toFactory(
        (ctx) => (name: string, settings?: ILoggerSettings) => {
            const commonSettings =
                ctx.get<ILoggerSettings>("LoggerCommonSettings", {
                    optional: true,
                }) ?? {}

            return loggerFactory(name, [], {
                ...commonSettings,
                ...settings,
            })
        },
    )
})
