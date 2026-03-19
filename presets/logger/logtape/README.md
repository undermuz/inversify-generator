# `logger/logtape` preset

## What it provides

Logger implementation based on `@logtape/logtape`.

## Selector

`logger/logtape`

## Files

- `logtape.factory.ts`
- `logtape.module.ts`

## DI bindings

Loads `LogTapeModule` from `./logger/logtape/logtape.module`.

## Dependencies

- `logger` (`types.ts`)
- `types` (`logger.ts`)

## Usage

```sh
npx @undermuz/inversify-generator add-preset-module logger/logtape
```

## Examples

```ts
const loggerFactory = di.get("Factory<Logger>");
const logger = loggerFactory("Worker");

logger.info("job accepted");
```

