import path from 'path';
import fs from 'fs-extra';
import { addPresetModule } from '../addPresetModule.js';

describe('addPresetModule', () => {
  let tempDir;
  let diPath;

  beforeEach(async () => {
    tempDir = path.join(process.cwd(), 'temp-test-' + Math.random());
    await fs.ensureDir(tempDir);
    diPath = path.join(tempDir, 'di');
    await fs.ensureDir(diPath);
    // Copy a basic container.ts
    await fs.writeFile(path.join(diPath, 'container.ts'), `import { Container } from "inversify";

/* MODULES */
import { MyProviderModule } from "./my-provider/module";

export const createDiContainer = () => {
    const di: Container = new Container();

    di.load(MyProviderModule);

    return di;
};`);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should copy preset and update container if module.ts exists', async () => {
    const result = await addPresetModule(diPath, 'env');

    expect(result.name).toBe('env');
    expect(result.path).toBe(path.join(diPath, 'env'));

    // Check files copied
    expect(await fs.pathExists(path.join(diPath, 'env', 'module.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(diPath, 'env', 'types.ts'))).toBe(true);

    // Check container updated
    const containerContent = await fs.readFile(path.join(diPath, 'container.ts'), 'utf-8');
    expect(containerContent).toContain('import { EnvModule } from "./env/module";');
    expect(containerContent).toContain('di.load(EnvModule);');
  });

  it('should not copy __tests__ folders from preset', async () => {
    const result = await addPresetModule(diPath, 'utils');

    expect(result.name).toBe('utils');
    expect(result.path).toBe(path.join(diPath, 'utils'));

    // Copy should include the main code...
    expect(await fs.pathExists(path.join(diPath, 'utils', 'event-bus', 'provider.ts'))).toBe(true);
    // ...but internal test suites must be skipped
    expect(await fs.pathExists(path.join(diPath, 'utils', 'event-bus', '__tests__'))).toBe(false);
  });

  it('should throw error if preset does not exist', async () => {
    await expect(addPresetModule(diPath, 'nonexistent')).rejects.toThrow('not found in templates');
  });

  it('should throw error if module already exists in di', async () => {
    // First copy env preset
    await addPresetModule(diPath, 'env');
    // Now try to add again
    await expect(addPresetModule(diPath, 'env')).rejects.toThrow('already exists');
  });
});