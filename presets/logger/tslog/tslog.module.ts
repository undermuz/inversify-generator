import { ContainerModule, Factory } from "inversify"

import { tslogFactory } from "./tslog.factory"

import type { ILogger } from "../../types/logger"
import { ILoggerSettings } from "../logger.types"

export const TsLogModule = new ContainerModule(({ bind }) => {
    bind<Factory<ILogger>>("Factory<Logger>").toFactory(
        (ctx) => (name: string, settings?: ILoggerSettings) => {
            const commonSettings =
                ctx.get<ILoggerSettings>("LoggerCommonSettings", {
                    optional: true,
                }) ?? {}

            return tslogFactory(name, {
                ...commonSettings,
                ...settings,
            })
        },
    )
})
