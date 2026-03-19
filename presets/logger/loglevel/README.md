# `logger/loglevel` preset

## What it provides

Logger implementation based on `loglevel` with filtering/saving helpers.

## Selector

`logger/loglevel`

## Files

- `loglevel.debug.ts`
- `loglevel.factory.ts`
- `loglevel.filter.ts`
- `loglevel.module.ts`
- `loglevel.saver.ts`
- `loglevel.types.ts`

## DI bindings

Loads `LogLevelModule` from `./logger/loglevel/loglevel.module`.

## Dependencies

- `logger` (`types.ts`)
- `types` (`logger.ts`)

## Usage

```sh
npx @undermuz/inversify-generator add-preset-module logger/loglevel
```

## Examples

```ts
const loggerFactory = di.get("Factory<Logger>");
const logger = loggerFactory("HTTP");

logger.debug("request started");
logger.error("request failed");
```

