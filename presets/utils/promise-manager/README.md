# `utils/promise-manager` preset

## What it provides

Typed promise manager service for handling multiple concurrent promises with support for cancellation via AbortSignal and various strategies (singleton, exclusive, takeLatest).

## Selector

`utils/promise-manager`

## Files

- `module.ts`
- `provider.ts`
- `types.ts`

## DI bindings

Loads `PromiseManagerModule` from `./utils/promise-manager/module`.

## Dependencies

None.

## Usage

```sh
npx @undermuz/inversify-generator add-preset-module utils/promise-manager
```

## Examples

### Basic usage

```ts
import { PromiseManager, type IPromiseManager } from "./utils/promise-manager/types";

type RequestEvents = {
    fetchUser: { id: string; name: string }
    fetchPosts: { posts: any[] }
}

const manager = di.get<IPromiseManager<RequestEvents>>(PromiseManager);

// Create a promise that can be resolved/rejected externally
const item = manager.create("fetchUser", async (signal) => {
    const response = await fetch("/api/user", { signal });
    return response.json();
});

await item.promise; // wait for completion
```

### Exclusive promises (abort previous)

```ts
const manager = di.get<IPromiseManager<RequestEvents>>(PromiseManager);

// Abort any previous request and start new one
const item = manager.createExclusive("fetchPosts", async (signal) => {
    const response = await fetch("/api/posts", { signal });
    return response.json();
});
```

### Take latest pattern

```ts
// Alias for createExclusive - useful for debouncing requests
const item = manager.takeLatest("fetchUser", async (signal) => {
    const response = await fetch("/api/user", { signal });
    return response.json();
});
```

### Manual resolution

```ts
const item = manager.create("fetchUser", async (signal) => {
    // factory can be used or ignored
    return new Promise(() => {}); // never resolves
});

// Resolve manually
manager.resolve("fetchUser", { id: "123", name: "John" });

// Or reject
manager.reject("fetchUser", new Error("Failed"));

// Or abort
manager.abort("fetchUser");
```
