import path from 'path';
import fs from 'fs-extra';
import { updateTsConfig } from '../updateTsConfig.js';

describe('updateTsConfig', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join(process.cwd(), 'temp-test-' + Math.random());
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should update existing tsconfig.json', async () => {
    const tsconfigPath = path.join(tempDir, 'tsconfig.json');
    await fs.writeJson(tsconfigPath, {
      compilerOptions: {
        target: 'ES2020'
      }
    });

    const result = await updateTsConfig(tempDir, null);

    expect(result).toBe(tsconfigPath);
    const config = await fs.readJson(tsconfigPath);
    expect(config.compilerOptions.emitDecoratorMetadata).toBe(true);
    expect(config.compilerOptions.experimentalDecorators).toBe(true);
  });

  it('should use specified tsconfigPath', async () => {
    const customPath = path.join(tempDir, 'custom.json');
    await fs.writeJson(customPath, {
      compilerOptions: {}
    });

    const result = await updateTsConfig(tempDir, customPath);

    expect(result).toBe(customPath);
    const config = await fs.readJson(customPath);
    expect(config.compilerOptions.emitDecoratorMetadata).toBe(true);
  });

  it('should throw error if no tsconfig found', async () => {
    await expect(updateTsConfig(tempDir, null)).rejects.toThrow('No tsconfig*.json file with compilerOptions found');
  });

  it('should throw error if specified tsconfig has no compilerOptions', async () => {
    const tsconfigPath = path.join(tempDir, 'tsconfig.json');
    await fs.writeJson(tsconfigPath, {});

    await expect(updateTsConfig(tempDir, tsconfigPath)).rejects.toThrow('does not contain compilerOptions');
  });
});