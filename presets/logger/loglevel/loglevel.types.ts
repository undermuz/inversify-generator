import log from "loglevel"
import type { LogLevels } from "../types"

export type NamedLogger = log.Logger & { name?: string }

export type LoggerNamedSettings = {
    nameTransform?: (name: string) => string
    filter?: (n: string, m: string, a: any[]) => boolean
    level?: LogLevels
}
