# `utils/requests` preset

## What it provides

Request-processing service built on middleware pipeline composition.

## Selector

`utils/requests`

## Files

- `module.ts`
- `provider.ts`
- `types.ts`

## DI bindings

Loads `RequestModule` from `./utils/requests/module`.

## Dependencies

- `utils/middleware` (`provider.ts`, `types.ts`)

## Usage

```sh
npx @undermuz/inversify-generator add-preset-module utils/requests
```

## Examples

```ts
import { RequestProvider, type IRequestService } from "./utils/requests/types";

type GetUserRequest = { payload: { id: string }; response?: { id: string } };
const requests = di.get<IRequestService<GetUserRequest>>(RequestProvider);

requests.use(async (req, next) => {
  req.response = { id: req.payload.id };
  await next();
});

const user = await requests.handle({ payload: { id: "1" } });
```

