# AGENTS.md - Inversify Generator Project Guide

Custom agents and workflows for working efficiently with the `@undermuz/inversify-generator` project.

## Project Overview

**@undermuz/inversify-generator** is a lightweight CLI tool that automatically sets up InversifyJS dependency injection in any JavaScript or Nx-based project. It provides:

- **Preset System**: Modular, composable DI modules organized by feature (env, logger, utils, react, etc.)
- **CLI Commands**: Add preset modules to projects, manage DI containers automatically
- **Type Safety**: Full TypeScript support with proper interfaces and type definitions
- **Dependency Resolution**: Automatic recursive dependency handling when adding presets

## Core Concepts

### Presets
A preset is a reusable DI module bundle located in `presets/<group>/<name>/` with:
- `preset.json` - manifest declaring files, module wiring, dependencies
- `module.ts` - InversifyJS ContainerModule export
- `provider.ts` - implementation (injectable class or factory)
- `types.ts` - TypeScript interfaces and symbols
- `README.md` - documentation with usage examples

**Selector Format**: `group/name` (e.g., `utils/cache`, `logger/logtape`, `env/vite`)

### Available Presets

**Base/Config Presets:**
- `env` - environment contract (abstract)
- `env/vite` - Vite-based implementation
- `react` - React DI context and hooks
- `types` - shared TypeScript interfaces

**Logger Presets:**
- `logger` - shared logger contracts
- `logger/loglevel` - loglevel-based implementation
- `logger/logtape` - @logtape/logtape implementation
- `logger/tslog` - tslog implementation

**I18n Presets:**
- `i18n` - i18n service contract (abstract)
- `i18n/i18n-js` - i18n-js implementation with persisted locale state

**Utils Presets:**
- `utils/common` - common helpers (catchError, invariant)
- `utils/local-storage` - abstract contract
- `utils/local-storage/browser-local-storage` - browser implementation
- `utils/cache` - cache service with TTL
- `utils/event-bus` - typed event observer service
- `utils/timers` - timeout/interval wrapper
- `utils/middleware` - generic middleware pipeline
- `utils/requests` - request pipeline (uses middleware)
- `utils/promise-manager` - promise manager with cancellation support

## CLI Commands

```sh
# Add a preset to a project
npx @undermuz/inversify-generator add-preset-module <selector> [--project=path]

# Examples:
npx @undermuz/inversify-generator add-preset-module env
npx @undermuz/inversify-generator add-preset-module logger/logtape
npx @undermuz/inversify-generator add-preset-module utils/cache
npx @undermuz/inversify-generator add-preset-module utils/event-bus
```

## Development Tasks

### Adding a New Preset

1. **Create directory structure**:
   ```
   presets/group-name/preset-name/
   ├── preset.json
   ├── module.ts
   ├── provider.ts
   ├── types.ts
   └── README.md
   ```

2. **Write the implementation** (module, provider, types)

3. **Create preset.json manifest**:
   ```json
   {
     "files": ["module.ts", "provider.ts", "types.ts"],
     "module": {
       "file": "module.ts",
       "export": "YourModuleName"
     },
     "dependencies": [
       { "preset": "other/dependency", "files": ["file.ts"] }
     ]
   }
   ```

4. **Generate dependency manifest**:
   ```sh
   npm run preset:deps group-name/preset-name --write
   ```

5. **Update presets/README.md** with preset documentation

6. **Add tests** in `src/actions/__tests__/addPresetModule.test.js`

### Testing

```sh
npm test                    # Run all tests
npm test -- addPresetModule # Test specific feature
```

### Updating Documentation

After changes:
1. Update individual preset READMEs in `presets/<selector>/README.md`
2. Update main catalog in `presets/README.md`
3. Update project README in `README.md` if needed

## Project Structure

```
.
├── bin/
│   └── cli.js                          # CLI entry point
├── src/
│   ├── index.js                        # Main CLI logic
│   ├── actions/                        # Core implementation
│   │   ├── addModule.js
│   │   ├── addPresetModule.js
│   │   ├── copyFiles.js
│   │   ├── updatePackageJson.js
│   │   ├── updateTsConfig.js
│   │   └── __tests__/                  # Action tests
│   ├── helpers/
│   │   ├── JsoncFileHelper.js
│   │   └── resolveTsConfigPath.js
│   └── preflight/
│       ├── initPreflight.js
│       └── __tests__/
├── presets/                            # Preset library
│   ├── env/
│   ├── i18n/
│   │   └── i18n-js/
│   ├── react/
│   ├── types/
│   ├── logger/
│   │   ├── loglevel/
│   │   ├── logtape/
│   │   └── tslog/
│   ├── utils/
│   │   ├── common/
│   │   ├── cache/
│   │   ├── event-bus/
│   │   ├── timers/
│   │   ├── middleware/
│   │   ├── requests/
│   │   ├── promise-manager/
│   │   └── local-storage/
│   └── README.md                       # Preset catalog
├── scripts/
│   └── generate-preset-manifest.mjs    # Dependency analyzer
├── templates/                          # Project templates
│   └── di/
│       ├── container.ts
│       └── my-provider/
└── package.json
```

## Key Files

- **src/actions/addPresetModule.js** - Main logic for adding presets (copies files, updates container, resolves dependencies)
- **scripts/generate-preset-manifest.mjs** - Analyzes preset imports to auto-detect dependencies
- **presets/README.md** - Master documentation of all available presets
- **src/index.js** - CLI entry point with command definitions

## Common Workflows

### Debug preset dependencies
```sh
npm run preset:deps utils/cache
```
Shows: selector, detected dependencies

### Write preset dependencies back to manifest
```sh
npm run preset:deps utils/cache --write
```

### Test adding a preset
```sh
npm test -- addPresetModule
```

### Run all tests
```sh
npm test
```

## Tips & Best Practices

1. **Keep presets focused** - Each preset should have a single responsibility
2. **Minimal dependencies** - Avoid circular deps; use dependency tree structure
3. **Document examples** - Add usage examples to preset READMEs
4. **Type safety** - Export `Symbols` for DI tokens, use interfaces for contracts
5. **Test coverage** - Add jest tests when adding new presets
6. **Update manifests** - Always run `generate-preset-manifest.mjs` after changes

## Troubleshooting

**"Manifest not found"** → Check `preset.json` exists in preset directory
**"Preset has no files list"** → Add `files` array to preset.json
**Dependency not detected** → Ensure imports are relative (`./`, `../`)
**Circular dependency** → Review import chains, use leaf presets with no deps

---

For more information, see [presets/README.md](presets/README.md) and individual preset READMEs.
