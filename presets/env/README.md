# `env` preset

## What it provides

Base environment contract only (no runtime implementation).

## Selector

`env`

## Files

- `types.ts`

## DI bindings

No module bindings are added by this preset.

## Dependencies

None.

## When to use

Use this preset when you want to define env access interfaces first, then choose implementation separately (for example `env/vite`).

## Usage

```sh
npx @undermuz/inversify-generator add-preset-module env
```

## Examples

```ts
import { EnvProvider, type IEnvProvider } from "./env/types";

const env = di.get<IEnvProvider>(EnvProvider);
const mode = env.get("MODE", "development");
```

## Related presets

- `env/vite`

