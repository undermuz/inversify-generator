import path from "path"
import { JsoncFileHelper } from "../helpers/JsoncFileHelper.js"

export const BASE_PACKAGE_DEPENDENCIES = {
    inversify: "^7.11.0",
    "reflect-metadata": "^0.2.2",
}

export async function updatePackageJson(root, additionalDependencies = {}) {
    const pkgPath = path.join(root, "package.json")

    let { text } = await JsoncFileHelper.readFile(pkgPath)
    const modifyFormat = JsoncFileHelper.modificationOptionsFromText(text)

    const dependencies = {
        ...BASE_PACKAGE_DEPENDENCIES,
        ...additionalDependencies,
    }

    for (const [name, version] of Object.entries(dependencies)) {
        text = JsoncFileHelper.applyModification(
            text,
            ["dependencies", name],
            version,
            modifyFormat,
        )
    }

    await JsoncFileHelper.writeFile(pkgPath, text)
    console.log(`📄 Updated package.json at ${pkgPath}`)
}
