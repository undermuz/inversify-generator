# `utils/event-bus` preset

## What it provides

Typed event observer/event-bus service with optional safe logger wrapping.

## Selector

`utils/event-bus`

## Files

- `module.ts`
- `provider.ts`
- `types.ts`

## DI bindings

Loads `EventBusModule` from `./utils/event-bus/module`.

## Dependencies

- `utils/common` (`catchError.ts`)
- `logger` (`types.ts`)
- `types` (`logger.ts`)

## Usage

```sh
npx @undermuz/inversify-generator add-preset-module utils/event-bus

# choose a concrete logger implementation
npx @undermuz/inversify-generator add-preset-module logger/logtape
```

## Examples

```ts
import { EventBusProvider, type IEventObserver } from "./utils/event-bus/types";

type AppEvents = { ready: [] };
const bus = di.get<IEventObserver<AppEvents>>(EventBusProvider);

bus.on("ready", () => logger.info("ready"));
bus.emit("ready");
```

```ts
// autoBindTo example
const component = {
    counter: 0,
    onReady() {
        this.counter += 1;
    },
};

bus.configure({ autoBindTo: component });
bus.on("ready", component.onReady);
bus.emit("ready");
```

```ts
// autoSafeLogger example
const safeLogger = di.get("Factory<Logger>")("EventBusSafe");
bus.configure({ autoSafeLogger: safeLogger });
bus.on("ready", () => {
    throw new Error("boom");
});

// Error is logged via safeLogger, app flow continues
bus.emit("ready");
```

```ts
// connect example (child observer scoped subscriptions)
const systemBus = di.get<IEventObserver<AppEvents>>(EventBusProvider);
const workerBus = di.get<IEventObserver<AppEvents>>(EventBusProvider);

workerBus.connect(systemBus);
workerBus.on("ready", () => logger.info("worker reacts"));

systemBus.emit("ready"); // worker callback is called
workerBus.destroy(); // unsubscribes worker callbacks from systemBus
```

