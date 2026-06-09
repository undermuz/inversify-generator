# `utils/common` preset

## What it provides

Shared utility helpers used by other utility presets.

## Selector

`utils/common`

## Files

- `catchError.ts`
- `invariant.ts`

## DI bindings

No module bindings are added by this preset.

## Dependencies

- `types` (`logger.ts`)

## Usage

```sh
npx @undermuz/inversify-generator add-preset-module utils/common
```

## Examples

```ts
import { catchError } from "./utils/common/catchError";
import invariant from "./utils/common/invariant";

const safe = catchError(asyncTask, logger, "[task]");
await safe();

invariant(user !== null, "user is required");
```

