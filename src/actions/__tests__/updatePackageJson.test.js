import path from 'path';
import fs from 'fs-extra';
import { updatePackageJson } from '../updatePackageJson.js';

describe('updatePackageJson', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(process.cwd(), 'temp-test-' + Math.random());
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should add required dependencies to package.json', async () => {
    const pkgPath = path.join(tempDir, 'package.json');
    await fs.writeJson(pkgPath, {
      name: 'test',
      dependencies: {
        existing: '^1.0.0'
      }
    });

    await updatePackageJson(tempDir);

    const pkg = await fs.readJson(pkgPath);
    expect(pkg.dependencies['reflect-metadata']).toBeDefined();
    expect(pkg.dependencies['inversify']).toBeDefined();
    expect(pkg.dependencies.existing).toBe('^1.0.0'); // existing preserved
  });
});