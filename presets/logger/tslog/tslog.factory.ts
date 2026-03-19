import { Logger, type ILogObj } from "tslog"

import type { ILogger } from "../../types/logger"
import type { ILoggerSettings } from "../logger.types"

export const tslogFactory = (
    name: string,
    settings?: ILoggerSettings,
): ILogger => {
    const logger: Logger<ILogObj> = new Logger({
        name,
        ...settings,
    })

    return logger
}
