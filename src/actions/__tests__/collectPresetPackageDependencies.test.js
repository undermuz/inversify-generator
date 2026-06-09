import { describe, expect, it } from "vitest"
import { collectPresetPackageDependencies } from "../../helpers/collectPresetPackageDependencies.js"

describe("collectPresetPackageDependencies", () => {
    it("merges packageDependencies from all presets in graph order", () => {
        const nodes = new Map([
            [
                "logger/logtape",
                {
                    manifest: {
                        packageDependencies: {
                            "@logtape/logtape": "^2.0.4",
                        },
                    },
                },
            ],
            [
                "i18n/i18n-js",
                {
                    manifest: {
                        packageDependencies: {
                            "i18n-js": "^4.5.1",
                            valtio: "^2.1.5",
                        },
                    },
                },
            ],
        ])

        const result = collectPresetPackageDependencies(nodes, [
            "logger/logtape",
            "i18n/i18n-js",
        ])

        expect(result).toEqual({
            "@logtape/logtape": "^2.0.4",
            "i18n-js": "^4.5.1",
            valtio: "^2.1.5",
        })
    })

    it("throws when packageDependencies entry is invalid", () => {
        const nodes = new Map([
            [
                "broken",
                {
                    manifest: {
                        packageDependencies: ["inversify"],
                    },
                },
            ],
        ])

        expect(() =>
            collectPresetPackageDependencies(nodes, ["broken"]),
        ).not.toThrow()

        nodes.get("broken").manifest.packageDependencies = {
            inversify: 123,
        }

        expect(() =>
            collectPresetPackageDependencies(nodes, ["broken"]),
        ).toThrow("invalid packageDependencies entry")
    })
})
