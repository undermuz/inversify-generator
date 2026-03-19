# `utils/middleware` preset

## What it provides

Generic middleware pipeline service with `use` and `handle`.

## Selector

`utils/middleware`

## Files

- `module.ts`
- `provider.ts`
- `types.ts`

## DI bindings

Loads `MiddlewareModule` from `./utils/middleware/module`.

## Dependencies

None.

## Usage

```sh
npx @undermuz/inversify-generator add-preset-module utils/middleware
```

## Examples

```ts
import { MiddlewareProvider, type IMiddlewareService } from "./utils/middleware/types";

const pipeline = di.get<IMiddlewareService<any>>(MiddlewareProvider);
pipeline.use(async (req, next) => {
  req.traceId = crypto.randomUUID();
  await next();
});
```

