# `logger` preset

## What it provides

Shared logger contracts/settings types used by concrete logger implementations.

## Selector

`logger`

## Files

- `types.ts`

## DI bindings

No module bindings are added by this preset.

## Dependencies

None.

## When to use

Use this preset as a base when implementing or selecting a concrete logger backend.

## Usage

```sh
npx @undermuz/inversify-generator add-preset-module logger
```

## Examples

```ts
import type { ILoggerFactory } from "./logger/types";

const loggerFactory = di.get<ILoggerFactory>("Factory<Logger>");
const logger = loggerFactory("App");
logger.info("Application started");
```

## Related presets

- `logger/loglevel`
- `logger/logtape`
- `logger/tslog`

