# @undermuz/inversify-generator

A lightweight CLI tool that automatically sets up **InversifyJS** in any Js or Nx-based project.
It installs required dependencies, generates di structure, and configures a ready-to-use di setup.

👉 Learn more about the underlying DI framework at [inversify.io](https://inversify.io/).

[![npm](https://img.shields.io/npm/v/@undermuz/inversify-generator.svg)](https://www.npmjs.com/package/@undermuz/inversify-generator)
[![GitHub](https://img.shields.io/badge/GitHub-undermuz%2Finversify--generator-blue)](https://github.com/undermuz/inversify-generator)

---

## 🚀 Features

- Adds InversifyJS to any js project
- Generates a complete di structure
- Provides preset modules for common use cases (env, react)
- Updates `package.json` with required dependencies
- Works in Nx and non-Nx environments
- Zero configuration required

---

## 🛠 Usage

All commands accept `-p, --project <path>`.

For `add-module` and `add-preset-module`, when `--project` is omitted the CLI searches from the current directory for a source file that imports `inversify` and contains `new Container()`. The directory of that file is used as the project path. If nothing is found, it falls back to `src`.

| Command | `--project` omitted | `--project` provided |
| --- | --- | --- |
| `init` | uses `src` | uses the given path |
| `add-module` | auto-detect, else `src` | uses the given path |
| `add-preset-module` | auto-detect, else `src` | uses the given path |

### Initialize InversifyJS

Run the generator inside your project:

```sh
# Simple react project
npx @undermuz/inversify-generator@latest init

# NX-like project
npx @undermuz/inversify-generator@latest init --project=./apps/web-app/src
```

By default (`--project=src`), it installs files into:

```
<cwd>/src/
  container.ts
  my-provider/
<cwd>/package.json
```

To specify a custom path:

```sh
npx @undermuz/inversify-generator init --project=apps/web-app/src

<cwd>/apps/web-app/src/
  container.ts
  my-provider/
<cwd>/package.json
```

### Add a new module

After initialization, you can add new modules using:

```sh
npx @undermuz/inversify-generator add-module <name>

<cwd>/src/<name>
```

Examples:

```sh
# Add a "settings" module (default --project=src)
npx @undermuz/inversify-generator add-module settings

# Add a "session" module
npx @undermuz/inversify-generator add-module session

# Specify custom project path (module directory will be created inside apps/web-app/src/)
npx @undermuz/inversify-generator add-module dashboard --project=apps/web-app/src
```

The command will:

- Create a new directory for the module inside the project `--project` directory
- Generate `types.ts`
- Generate `provider.ts` with provider
- Generate `module.ts` with container module
- Automatically update the main `container.ts` to include the new module

### Add a preset module

After initialization, you can add predefined preset modules using:

```sh
npx @undermuz/inversify-generator add-preset-module <selector>

<cwd>/src/<selector>
```

`<selector>` supports nested preset paths (for example `utils/cache`, `logger/logtape`).
Selectors that do not have their own `preset.json` are treated as preset groups and cannot be added directly.

Examples:

```sh
# Add the "env" preset module
npx @undermuz/inversify-generator add-preset-module env

# Add the "react" preset module
npx @undermuz/inversify-generator add-preset-module react

# Add nested utility preset
npx @undermuz/inversify-generator add-preset-module utils/cache

# Choose concrete logger implementation
npx @undermuz/inversify-generator add-preset-module logger/logtape

# Specify custom project path
npx @undermuz/inversify-generator add-preset-module env --project=apps/web-app/src
```

The command will:

- Copy preset files from `presets/<name>` into the project `--project` directory
- Resolve and copy transitive preset dependencies from `preset.json`
- Add required npm packages from `preset.json -> packageDependencies` to `package.json`
- If the preset contains `module.ts`, automatically update the main `container.ts` to include the new module

---

## 📁 What gets generated

### Initial structure

```
src/
  container.ts
  my-provider/
    types.ts
    module.ts
    provider.ts
```

### Adding new modules

When you add a new module using `add-module`, the following files are created:

```
src/
  my-new-module/
    types.ts
    module.ts
    provider.ts
  container.ts    # (automatically updated)
```

### Adding preset modules

When you add a preset module using `add-preset-module`, files are copied according to preset manifests:

```
src/
  <PRESET_SELECTOR>/   # copied from presets/<PRESET_SELECTOR>
    <FILES_FROM_MANIFEST>
  <DEPENDENCY_SELECTOR>/
    <DEPENDENCY_FILES_FROM_MANIFEST>
  container.ts         # updated for presets with a declared module
```

### Preset manifest dependencies

Each standalone preset has `preset.json` with:
- `files`: what to copy
- `module` (optional): what to import/load into `container.ts`
- `dependencies` (optional): dependent preset selectors and optional file subsets
- `packageDependencies` (optional): npm packages to add to the project `package.json`

To auto-suggest preset and npm dependencies from imports:

```sh
# preview dependencies
npm run preset:deps -- utils/cache

# write dependencies to presets/<selector>/preset.json
npm run preset:deps -- utils/cache --write
```

---

## 📚 Dependencies added automatically

- reflect-metadata
- inversify

---

## 💡 Examples

After running the generator and adding modules, you can use the container in your application code.  Typical workflow:

```ts
// src/container.ts (generated)
import { Container } from "inversify";
import { someModule } from "./some-module/module";

export const container = new Container();
container.load(someModule);
```

```ts
// src/some-module/types.ts
export const TYPES = {
  SomeService: Symbol.for("SomeService"),
};
```

```ts
// src/some-module/provider.ts
import { injectable } from "inversify";
import { createSomeService } from "./service";

@injectable()
export class SomeService {
  constructor() {}
  sayHi() { console.log("hello from injected service"); }
}
```

```ts
// src/index.ts
import "reflect-metadata"; // required by inversify
import { container } from "./container";
import { TYPES } from "./some-module/types";
import { SomeService } from "./some-module/provider";

const service = container.get<SomeService>(TYPES.SomeService);
service.sayHi();
```

### React example

If you generated the `react` preset (or manually set up the bindings), you can expose the container via a provider and consume it in components:


```tsx
// src/App.tsx
import React from "react";
import { useDi } from "./react/hooks/useDi";
import { TYPES } from "./some-module/types";
import { SomeService } from "./some-module/provider";

import { DiProvider } from "./react/di.provider";

function Page() {
  const container = useDi();
  const service = container.get<SomeService>(TYPES.SomeService);

  React.useEffect(() => {
    service.sayHi();
  }, [service]);

  return <div>Check the console for a greeting</div>;
}

function App() {
  return (
    <DiProvider>
      <Page />
    </DiProvider>
  );
}

export default App;
```

> The examples above show basic binding and retrieval; for more advanced patterns check the [Inversify docs](https://inversify.io/).

---

## 🧩 Requirements

- Node.js 18+
- npm or yarn

---

## 🧪 Testing

Run the test suite:

```sh
npm test
```

Tests cover the core actions: copying files, updating package.json, generating modules, and configuring TypeScript. Uses Vitest for fast, ESM-compatible testing.

---

## 📦 Installation (local development)

Clone the repository and link it globally:

```sh
npm install
npm link
```

Now the CLI is available system-wide:

```sh
inversify-generator
```

---

## 📄 License

MIT
