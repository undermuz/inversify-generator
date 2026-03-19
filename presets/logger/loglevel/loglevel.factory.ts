import log from "loglevel"

import clc, { color as c } from "console-log-colors"
import prefix from "loglevel-plugin-prefix"

import { loggerDebugPlugin } from "./loglevel.debug"
import { loggerFilterPlugin } from "./loglevel.filter"
import { LoggerNamedSettings } from "./loglevel.types"
import { NamedLogger } from "./loglevel.types"

const isSupported = clc.isSupported()

if (isSupported) console.log(c.blue("Console colors are supported"))
else console.log("Console colors are NOT supported")

const defaultNameTransform = (name: string) => c.green(`(${name})`)

export const loggerFactory = (
    name: string,
    plugins: Array<
        (l: NamedLogger, opts?: Record<string, boolean>) => NamedLogger
    > = [],
    settings?: LoggerNamedSettings,
) => {
    if (!isSupported) {
        console.warn(
            "Console colors are not supported in this environment. Disabling colors.",
        )

        clc.disable()
    }

    let logger = log.getLogger(name) as NamedLogger

    if (settings?.level) logger.setLevel(settings.level)

    const nameTransform = settings?.nameTransform || defaultNameTransform

    const colors = {
        TRACE: c.magenta,
        DEBUG: c.dim.gray,
        INFO: c.blueBright,
        WARN: c.yellow,
        ERROR: c.red,
    }

    // const labels = {
    //     TRACE: 'TRC',
    //     DEBUG: 'DBG',
    //     INFO: 'INF',
    //     WARN: 'WRN',
    //     ERROR: 'ERR',
    // }

    prefix.reg(log)

    logger = loggerDebugPlugin(logger)

    if (settings?.filter) logger = loggerFilterPlugin(logger, settings?.filter)

    logger = prefix.apply(logger, {
        format(_level, _name, ts) {
            const level = _level.toUpperCase() as keyof typeof colors

            const clr = colors[level]

            const name = nameTransform(`${_name}`)

            return `${clr(`[${ts}]`)} | ${name}`
        },
    })

    for (const plugin of plugins) {
        logger = plugin(logger)
    }

    logger.rebuild()

    return logger
}
