# `utils/timers` preset

## What it provides

Timer utility service (timeouts/intervals) with named handles and cleanup helpers.

## Selector

`utils/timers`

## Files

- `module.ts`
- `provider.ts`
- `types.ts`

## DI bindings

Loads `TimersModule` from `./utils/timers/module`.

## Dependencies

None.

## Usage

```sh
npx @undermuz/inversify-generator add-preset-module utils/timers
```

## Examples

```ts
import { TimersProvider, type ITimersProvider } from "./utils/timers/types";

const timers = di.get<ITimersProvider>(TimersProvider);

// timeout(callback, ms) -> returns generated string id
const autoTimeoutId = timers.timeout(() => reload(), 1_000);

// timeout(name, callback, ms) -> returns same name
const namedTimeoutId = timers.timeout("refresh", () => reload(), 1_000);

// interval(callback, ms)
const autoIntervalId = timers.interval(() => heartbeat(), 5_000);

// interval(name, callback, ms)
const namedIntervalId = timers.interval("poll", () => fetchData(), 3_000);

// interval(name, callback, { interval, immediate })
timers.interval("warmup", () => warmup(), { interval: 10_000, immediate: true });

// has(idOrName)
if (timers.has("refresh")) {
  console.log("refresh timer is active");
}

// clearTimeout / clearInterval by id or name
timers.clearTimeout(namedTimeoutId);
timers.clearInterval("poll");

// clearTimeout / clearInterval by array
timers.clearTimeout([autoTimeoutId, "refresh"]);
timers.clearInterval([autoIntervalId, "warmup"]);

// clear(name) -> clears both timeout and interval with that name/id
timers.clear("refresh");

// clear([names]) -> clears many
timers.clear(["poll", "warmup"]);

// clear() -> clears all timers/intervals managed by provider
timers.clear();
```

