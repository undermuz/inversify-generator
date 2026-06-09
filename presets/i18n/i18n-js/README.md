# `i18n/i18n-js` preset

## What it provides

i18n implementation based on `i18n-js` with persisted locale state via local storage.

## Selector

`i18n/i18n-js`

## Files

- `i18n.module.ts`
- `i18n.provider.ts`

## DI bindings

Loads `I18nJsModule` from `./i18n/i18n-js/i18n.module`.

## Dependencies

- `i18n` (`types.ts`)
- `logger` (`types.ts`)
- `types` (`logger.ts`)
- `utils/common` (`invariant.ts`)
- `utils/local-storage` (`types.ts`)

## Runtime dependencies

Install in your project:

```sh
npm install i18n-js valtio
```

## Usage

```sh
npx @undermuz/inversify-generator add-preset-module i18n/i18n-js
npx @undermuz/inversify-generator add-preset-module utils/local-storage/browser-local-storage
npx @undermuz/inversify-generator add-preset-module logger/logtape
```

Bind translations in your app module:

```ts
import { I18nTranslationsProvider } from "./i18n/types";

ctx.bind(I18nTranslationsProvider).toConstantValue({
  en: { greeting: "Hello" },
  ar: { greeting: "مرحبا" },
});
```

## Examples

```ts
import { I18nProvider } from "./i18n/types";
import type { I18nService } from "./i18n/types";

const i18n = di.get<I18nService>(I18nProvider);

await i18n.initialize({ locale: "en-US" });

console.log(i18n.t("greeting"));
console.log(i18n.getLocale());
```
