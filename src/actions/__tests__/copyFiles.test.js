import path from 'path';
import fs from 'fs-extra';
import { copyFiles } from '../copyFiles.js';

describe('copyFiles', () => {
  let tempDir;
  let srcDir;
  let destDir;

  beforeEach(async () => {
    tempDir = path.join(process.cwd(), 'temp-test-' + Math.random());
    await fs.ensureDir(tempDir);
    srcDir = path.join(tempDir, 'src');
    destDir = path.join(tempDir, 'dest');
    await fs.ensureDir(srcDir);
    await fs.writeFile(path.join(srcDir, 'file1.txt'), 'content1');
    await fs.ensureDir(path.join(srcDir, 'subdir'));
    await fs.writeFile(path.join(srcDir, 'subdir', 'file2.txt'), 'content2');
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should copy all files from src to dest', async () => {
    await copyFiles(srcDir, destDir);

    expect(await fs.pathExists(path.join(destDir, 'file1.txt'))).toBe(true);
    expect(await fs.readFile(path.join(destDir, 'file1.txt'), 'utf-8')).toBe('content1');
    expect(await fs.pathExists(path.join(destDir, 'subdir', 'file2.txt'))).toBe(true);
    expect(await fs.readFile(path.join(destDir, 'subdir', 'file2.txt'), 'utf-8')).toBe('content2');
  });
});