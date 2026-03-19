# `utils/local-storage` preset

## What it provides

Abstract local-storage contract and provider token.

## Selector

`utils/local-storage`

## Files

- `types.ts`

## DI bindings

No module bindings are added by this preset.

## Dependencies

- `types` (`initializable.ts`)

## Usage

```sh
npx @undermuz/inversify-generator add-preset-module utils/local-storage
```

## Examples

```ts
import { LocalStorageProvider, type ILocalStorage } from "./utils/local-storage/types";

const storage = di.get<ILocalStorage>(LocalStorageProvider);
await storage.initialize({ prefix: "app:" });
await storage.setItem("token", "abc");
const token = await storage.getItem("token");
await storage.removeItem("token");
const keys = await storage.getKeys();
```

## Related presets

- `utils/local-storage/browser-local-storage`

