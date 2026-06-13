# `i18n` preset

## What it provides

Abstract i18n service contract with locale, direction, and currency state.

## Selector

`i18n`

## Files

- `types.ts`

## DI bindings

No module bindings are added by this preset.

## Dependencies

- `types` (`initializable.ts`, `persist-state.ts`, `stateful.ts`)
- `react` (`di.context.ts`, `hooks/useConstant.ts`, `hooks/useDiContainer.ts`, `hooks/useDi.ts`, `hooks/useT.ts`)

## Package dependencies

- `react`

## When to use

Use this preset when you need the i18n contract only, or when composing a custom implementation.

## Usage

```sh
npx @undermuz/inversify-generator add-preset-module i18n
```

## Examples

```ts
import type { I18nService } from "./i18n/types";
import { I18nProvider } from "./i18n/types";

const i18n = di.get<I18nService>(I18nProvider);
```

```tsx
import { I18nProvider } from "./i18n/types";
import { useT } from "./react/hooks/useT";

const t = useT(I18nProvider);
```
