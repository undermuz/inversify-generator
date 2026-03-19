# `utils/cache` preset

## What it provides

Cache service with TTL and optional persistence through local-storage abstraction.

## Selector

`utils/cache`

## Files

- `module.ts`
- `provider.ts`
- `types.ts`

## DI bindings

Loads `CacheModule` from `./utils/cache/module`.

## Dependencies

- `utils/local-storage` (`types.ts`)
- `types` (`initializable.ts`)

## Notes

This preset depends on the abstract local-storage contract only.  
Choose concrete implementation separately if needed.

## Usage

```sh
npx @undermuz/inversify-generator add-preset-module utils/cache

# choose a concrete local-storage implementation
npx @undermuz/inversify-generator add-preset-module utils/local-storage/browser-local-storage
```

## Examples

```ts
import { CacheProvider, type ICacheProvider } from "./utils/cache/types";

const cache = di.get<ICacheProvider>(CacheProvider);
await cache.initialize({ prefix: "cache:", ttl: 60_000 });
await cache.set("user:1", { id: 1 });
const user = await cache.get("user:1");
```

