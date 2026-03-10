import fs from "fs-extra";
import path from "path";

export async function updatePackageJson(root) {
    const pkgPath = path.join(root, "package.json");
    const pkg = await fs.readJson(pkgPath);

    pkg.dependencies = {
        ...pkg.dependencies,
        inversify: "^7.11.0",
        "reflect-metadata": "^0.2.2",
    };

    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
}
