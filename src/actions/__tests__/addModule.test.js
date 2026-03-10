import path from 'path';
import fs from 'fs-extra';
import { addModule } from '../addModule.js';

describe('addModule', () => {
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

  it('should create a new module and update container', async () => {
    const result = await addModule(diPath, 'test-module');

    expect(result.name).toBe('test-module');
    expect(result.path).toBe(path.join(diPath, 'test-module'));

    // Check files created
    expect(await fs.pathExists(path.join(diPath, 'test-module', 'module.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(diPath, 'test-module', 'provider.ts'))).toBe(true);
    expect(await fs.pathExists(path.join(diPath, 'test-module', 'types.ts'))).toBe(true);

    // Check container updated
    const containerContent = await fs.readFile(path.join(diPath, 'container.ts'), 'utf-8');
    expect(containerContent).toContain('import { TestModuleModule } from "./test-module/module";');
    expect(containerContent).toContain('di.load(TestModuleModule);');
  });

  it('should throw error if module already exists', async () => {
    await fs.ensureDir(path.join(diPath, 'existing-module'));
    await expect(addModule(diPath, 'existing-module')).rejects.toThrow('already exists');
  });

  it('should normalize invalid characters in name', async () => {
    const result = await addModule(diPath, 'invalid@name');
    expect(result.name).toBe('invalidname');
  });
});