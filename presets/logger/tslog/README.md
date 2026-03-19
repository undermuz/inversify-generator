# `logger/tslog` preset

## What it provides

Logger implementation based on `tslog`.

## Selector

`logger/tslog`

## Files

- `tslog.factory.ts`
- `tslog.module.ts`

## DI bindings

Loads `TsLogModule` from `./logger/tslog/tslog.module`.

## Dependencies

- `logger` (`types.ts`)
- `types` (`logger.ts`)

## Usage

```sh
npx @undermuz/inversify-generator add-preset-module logger/tslog
```

## Examples

```ts
const loggerFactory = di.get("Factory<Logger>");
const logger = loggerFactory("Scheduler");

logger.warn("delayed task");
```

