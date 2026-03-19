# `env/vite` preset

## What it provides

Vite-based implementation of the env provider contract.

## Selector

`env/vite`

## Files

- `module.ts`
- `provider.ts`

## DI bindings

Loads `EnvViteModule` from `./env/vite/module`.

## Dependencies

- `env` (`types.ts`)

## When to use

Use this preset when your app runtime is Vite and you want `import.meta.env` based env access.

## Usage

```sh
npx @undermuz/inversify-generator add-preset-module env/vite
```

## Examples

```ts
import { EnvProvider, type IEnvProvider } from "./env/types";

const env = di.get<IEnvProvider>(EnvProvider);
const apiUrl = env.getOrThrow("API_URL");
```

## Related presets

- `env`

