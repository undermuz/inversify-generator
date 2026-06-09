export function collectPresetPackageDependencies(nodes, orderedSelectors) {
    const merged = {};

    for (const selector of orderedSelectors) {
        const node = nodes.get(selector);
        const deps = node?.manifest?.packageDependencies;

        if (!deps || typeof deps !== "object" || Array.isArray(deps)) {
            continue;
        }

        for (const [name, version] of Object.entries(deps)) {
            if (typeof name !== "string" || typeof version !== "string") {
                throw new Error(
                    `Preset '${selector}' has invalid packageDependencies entry`,
                );
            }

            merged[name] = version;
        }
    }

    return merged;
}
