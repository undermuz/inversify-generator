import path from "path"
import { JsoncFileHelper } from "../helpers/JsoncFileHelper.js"

export async function updatePackageJson(root) {
    const pkgPath = path.join(root, "package.json")

    let { text } = await JsoncFileHelper.readFile(pkgPath)
    const modifyFormat = JsoncFileHelper.modificationOptionsFromText(text)

    text = JsoncFileHelper.applyModification(
        text,
        ["dependencies", "inversify"],
        "^7.11.0",
        modifyFormat,
    )
    text = JsoncFileHelper.applyModification(
        text,
        ["dependencies", "reflect-metadata"],
        "^0.2.2",
        modifyFormat,
    )

    await JsoncFileHelper.writeFile(pkgPath, text)
    console.log(`📄 Updated package.json at ${pkgPath}`)
}
