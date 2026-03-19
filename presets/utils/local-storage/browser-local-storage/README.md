# `utils/local-storage/browser-local-storage` preset

## What it provides

Browser implementation of the local-storage contract.

## Selector

`utils/local-storage/browser-local-storage`

## Files

- `module.ts`
- `provider.ts`

## DI bindings

Loads `BrowserLocalStorageModule` from `./utils/local-storage/browser-local-storage/module`.

## Dependencies

- `utils/local-storage` (`types.ts`)

## Usage

```sh
npx @undermuz/inversify-generator add-preset-module utils/local-storage/browser-local-storage
```

## Examples

```ts
import { LocalStorageProvider, type ILocalStorage } from "./utils/local-storage/types";

const storage = di.get<ILocalStorage>(LocalStorageProvider);
await storage.setItem("token", "abc");
const token = await storage.getItem("token");
await storage.removeItem("token");
const keys = await storage.getKeys();
```

