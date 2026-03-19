# `types` preset

## What it provides

Shared foundational TypeScript interfaces used by other presets.

## Selector

`types`

## Files

- `initializable.ts`
- `logger.ts`

## DI bindings

No module bindings are added by this preset.

## Dependencies

None.

## When to use

Use this preset when you need shared types directly, or when composing your own custom presets/modules.

## Usage

```sh
npx @undermuz/inversify-generator add-preset-module types
```

## Examples

```ts
import type { Initializable } from "./types/initializable";
import type { ILogger } from "./types/logger";

type BootTask = Initializable<void, []>;
```

