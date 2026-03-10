import fs from "fs-extra";

export async function copyFiles(from, to) {
    await fs.copy(from, to, {
        overwrite: false,
        errorOnExist: false,
    });
}
