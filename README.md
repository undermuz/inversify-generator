# @undermuz/inversify-generator

A lightweight CLI tool that automatically sets up **InversifyJS** in any Js or Nx-based project.
It installs required dependencies, generates di structure, and configures a ready-to-use di setup.

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

### Initialize InversifyJS

Run the generator inside your project:

```sh
# Simple react project
npx @undermuz/inversify-generator@latest init

# NX-like project
npx @undermuz/inversify-generator@latest init --project=./apps/web-app/src
```

By default, it installs di files into:

```
<cwd>/src
<cwd>/package.json
```

To specify a custom path:

```sh
npx @undermuz/inversify-generator init --project=apps/web-app/src

<cwd>/apps/web-app/src
<cwd>/package.json
```

### Add a new module

After initialization, you can add new modules using:

```sh
npx @undermuz/inversify-generator add-module <name>

<cwd>/src/di/<name>
```

Examples:

```sh
# Add a "settings" module (uses default src)
npx @undermuz/inversify-generator add-module settings

# Add a "session" module
npx @undermuz/inversify-generator add-module session

# Specify custom app path (module directory will be created inside apps/web-app/src/di)
npx @undermuz/inversify-generator add-module dashboard --project=apps/web-app/src
```

The command will:

- Create a new directory for the module inside the app's `di/` directory
- Generate `types.ts`
- Generate `provider.ts` with provider
- Generate `module.ts` with container module
- Automatically update the main `container.ts` to include the new module

### Add a preset module

After initialization, you can add predefined preset modules using:

```sh
npx @undermuz/inversify-generator add-preset-module <name>

<cwd>/src/di/<name>
```

Available presets: `env`, `react`

Examples:

```sh
# Add the "env" preset module
npx @undermuz/inversify-generator add-preset-module env

# Add the "react" preset module
npx @undermuz/inversify-generator add-preset-module react

# Specify custom app path
npx @undermuz/inversify-generator add-preset-module env --project=apps/web-app/src
```

The command will:

- Copy the entire preset directory from `presets/<name>` to the app's `di/` directory
- If the preset contains `module.ts`, automatically update the main `container.ts` to include the new module

---

## 📁 What gets generated

### Initial structure

```
di/
  container.ts
  my-provider/
    types.ts
    module.ts
    provider.ts
```

### Adding new modules

When you add a new module using `add-module`, the following files are created:

```
di/
  my-new-module/
    types.ts
    module.ts
    provider.ts
  container.tsx   # (automatically updated)
```

### Adding preset modules

When you add a preset module using `add-preset-module`, the entire preset directory is copied:

```
di/
  <PRESET_NAME>/     # copied from presets/<PRESET_NAME>
    <PRESET_FILES>
  container.ts       # (automatically updated if module.ts exists in <PRESET_NAME>)
```

---

## 📚 Dependencies added automatically

- reflect-metadata
- inversify

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
