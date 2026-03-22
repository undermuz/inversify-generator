import { JsoncFileHelper } from "../helpers/JsoncFileHelper.js"
import { resolveTsConfigPath } from "../helpers/resolveTsConfigPath.js"

export { resolveTsConfigPath } from "../helpers/resolveTsConfigPath.js"

async function writeCompilerOptionsDecoratorFlags(filePath) {
    let { text, data } = await JsoncFileHelper.readFile(filePath)

    if (!data.compilerOptions) {
        throw new Error(
            `The tsconfig file does not contain compilerOptions: ${filePath}`,
        )
    }

    const modifyFormat = JsoncFileHelper.modificationOptionsFromText(text)

    text = JsoncFileHelper.applyModification(
        text,
        ["compilerOptions", "emitDecoratorMetadata"],
        true,
        modifyFormat,
    )

    text = JsoncFileHelper.applyModification(
        text,
        ["compilerOptions", "experimentalDecorators"],
        true,
        modifyFormat,
    )

    text = JsoncFileHelper.applyModification(
        text,
        ["compilerOptions", "strictPropertyInitialization"],
        false,
        modifyFormat,
    )

    await JsoncFileHelper.writeFile(filePath, text)
}

export async function updateTsConfig(root, tsconfigPath) {
    const configPath = await resolveTsConfigPath(root, tsconfigPath, {
        quiet: false,
    })

    await writeCompilerOptionsDecoratorFlags(configPath)

    console.log(`📄 Updated tsconfig file: ${configPath}`)

    return configPath
}
