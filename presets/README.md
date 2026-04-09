# Presets Catalog

This directory contains all preset manifests used by `add-preset-module`.

Each standalone preset is any folder with `preset.json`.

## How presets work

- Selector format: `group/name` (for example `utils/cache`, `logger/logtape`)
- Command: `npx @undermuz/inversify-generator add-preset-module <selector>`
- Files copied: only those listed in `preset.json -> files`
- Module wiring: performed only when `preset.json` has `module.file` + `module.export`
- Dependencies: resolved from `preset.json -> dependencies` recursively

## Per-preset READMEs

- `env` -> `presets/env/README.md`
- `env/vite` -> `presets/env/vite/README.md`
- `react` -> `presets/react/README.md`
- `types` -> `presets/types/README.md`
- `logger` -> `presets/logger/README.md`
- `logger/loglevel` -> `presets/logger/loglevel/README.md`
- `logger/logtape` -> `presets/logger/logtape/README.md`
- `logger/tslog` -> `presets/logger/tslog/README.md`
- `utils/common` -> `presets/utils/common/README.md`
- `utils/local-storage` -> `presets/utils/local-storage/README.md`
- `utils/local-storage/browser-local-storage` -> `presets/utils/local-storage/browser-local-storage/README.md`
- `utils/cache` -> `presets/utils/cache/README.md`
- `utils/event-bus` -> `presets/utils/event-bus/README.md`
- `utils/timers` -> `presets/utils/timers/README.md`
- `utils/middleware` -> `presets/utils/middleware/README.md`
- `utils/promise-manager` -> `presets/utils/promise-manager/README.md`
- `utils/requests` -> `presets/utils/requests/README.md`

---

## Base Presets

### `env`

- Description: base environment provider contract.
- Path: `presets/env`
- Files:
  - `types.ts`
- Module wiring: no
- Notes:
  - This is an abstract env contract preset.
  - It does not select runtime implementation automatically.

### `env/vite`

- Description: Vite-based environment implementation.
- Path: `presets/env/vite`
- Files:
  - `module.ts`
  - `provider.ts`
- Module wiring:
  - `EnvViteModule` from `./env/vite/module`
- Dependencies:
  - `env` (`types.ts`)

### `react`

- Description: React DI context/provider and helper hooks.
- Path: `presets/react`
- Files:
  - `di.context.ts`
  - `di.provider.ts`
  - `hooks/useConstant.ts`
  - `hooks/useDiContainer.ts`
  - `hooks/useDi.ts`
- Module wiring: no

### `types`

- Description: shared core TypeScript interfaces.
- Path: `presets/types`
- Files:
  - `initializable.ts`
  - `logger.ts`
- Module wiring: no

---

## Logger Presets

### `logger`

- Description: shared logger contracts and settings types.
- Path: `presets/logger`
- Files:
  - `types.ts`
- Module wiring: no

### `logger/loglevel`

- Description: logger implementation based on `loglevel`.
- Path: `presets/logger/loglevel`
- Files:
  - `loglevel.debug.ts`
  - `loglevel.factory.ts`
  - `loglevel.filter.ts`
  - `loglevel.module.ts`
  - `loglevel.saver.ts`
  - `loglevel.types.ts`
- Module wiring:
  - `LogLevelModule` from `./logger/loglevel/loglevel.module`
- Dependencies:
  - `logger` (`types.ts`)
  - `types` (`logger.ts`)

### `logger/logtape`

- Description: logger implementation based on `@logtape/logtape`.
- Path: `presets/logger/logtape`
- Files:
  - `logtape.factory.ts`
  - `logtape.module.ts`
- Module wiring:
  - `LogTapeModule` from `./logger/logtape/logtape.module`
- Dependencies:
  - `logger` (`types.ts`)
  - `types` (`logger.ts`)

### `logger/tslog`

- Description: logger implementation based on `tslog`.
- Path: `presets/logger/tslog`
- Files:
  - `tslog.factory.ts`
  - `tslog.module.ts`
- Module wiring:
  - `TsLogModule` from `./logger/tslog/tslog.module`
- Dependencies:
  - `logger` (`types.ts`)
  - `types` (`logger.ts`)

---

## Utils Presets

### `utils/common`

- Description: common utility helpers.
- Path: `presets/utils/common`
- Files:
  - `catchError.ts`
- Module wiring: no
- Dependencies:
  - `types` (`logger.ts`)

### `utils/local-storage`

- Description: abstract local-storage contract.
- Path: `presets/utils/local-storage`
- Files:
  - `types.ts`
- Module wiring: no
- Dependencies:
  - `types` (`initializable.ts`)

### `utils/local-storage/browser-local-storage`

- Description: browser `localStorage` implementation.
- Path: `presets/utils/local-storage/browser-local-storage`
- Files:
  - `module.ts`
  - `provider.ts`
- Module wiring:
  - `BrowserLocalStorageModule` from `./utils/local-storage/browser-local-storage/module`
- Dependencies:
  - `utils/local-storage` (`types.ts`)

### `utils/cache`

- Description: cache service with TTL and persistence hooks.
- Path: `presets/utils/cache`
- Files:
  - `module.ts`
  - `provider.ts`
  - `types.ts`
- Module wiring:
  - `CacheModule` from `./utils/cache/module`
- Dependencies:
  - `utils/local-storage` (`types.ts`)
  - `types` (`initializable.ts`)
- Notes:
  - Depends on abstract local-storage contract.
  - Runtime implementation (for example browser) must be chosen separately.

### `utils/event-bus`

- Description: typed event observer/event-bus service.
- Path: `presets/utils/event-bus`
- Files:
  - `module.ts`
  - `provider.ts`
  - `types.ts`
- Module wiring:
  - `EventBusModule` from `./utils/event-bus/module`
- Dependencies:
  - `utils/common` (`catchError.ts`)
  - `logger` (`types.ts`)
  - `types` (`logger.ts`)

### `utils/timers`

- Description: timeout/interval service wrapper.
- Path: `presets/utils/timers`
- Files:
  - `module.ts`
  - `provider.ts`
  - `types.ts`
- Module wiring:
  - `TimersModule` from `./utils/timers/module`
- Dependencies: none

### `utils/middleware`

- Description: generic middleware pipeline service.
- Path: `presets/utils/middleware`
- Files:
  - `module.ts`
  - `provider.ts`
  - `types.ts`
- Module wiring:
  - `MiddlewareModule` from `./utils/middleware/module`
- Dependencies: none

### `utils/promise-manager`

- Description: typed promise manager service with cancellation support.
- Path: `presets/utils/promise-manager`
- Files:
  - `module.ts`
  - `provider.ts`
  - `types.ts`
- Module wiring:
  - `PromiseManagerModule` from `./utils/promise-manager/module`
- Dependencies: none

### `utils/requests`

- Description: request pipeline service built on middleware.
- Path: `presets/utils/requests`
- Files:
  - `module.ts`
  - `provider.ts`
  - `types.ts`
- Module wiring:
  - `RequestModule` from `./utils/requests/module`
- Dependencies:
  - `utils/middleware` (`provider.ts`, `types.ts`)

---

## Examples

```sh
# base env contract only
npx @undermuz/inversify-generator add-preset-module env

# env runtime implementation
npx @undermuz/inversify-generator add-preset-module env/vite

# cache + local-storage contract
npx @undermuz/inversify-generator add-preset-module utils/cache

# choose logger implementation
npx @undermuz/inversify-generator add-preset-module logger/logtape
```

