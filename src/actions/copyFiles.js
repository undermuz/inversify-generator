import fs from "fs-extra";
import path from "path";

/**
 * Recursively copy files from `from` to `to` while logging each created file.
 * This replaces the simple fs.copy usage so we can report what was added.
 */
export async function copyFiles(from, to) {
    const entries = await fs.readdir(from);

    await fs.ensureDir(to);

    for (const entry of entries) {
        const src = path.join(from, entry);
        const dst = path.join(to, entry);
        const stat = await fs.stat(src);
        if (stat.isDirectory()) {
            await copyFiles(src, dst);
        } else {
            await fs.copy(src, dst, { overwrite: false, errorOnExist: false });
            console.log(`📄 Created ${dst}`);
        }
    }
}
