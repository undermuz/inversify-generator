# `react` preset

## What it provides

React integration helpers for DI container access in components and hooks.

## Selector

`react`

## Files

- `di.context.ts`
- `di.provider.ts`
- `hooks/useConstant.ts`
- `hooks/useDiContainer.ts`
- `hooks/useDi.ts`
- `hooks/useT.ts`

## DI bindings

No module bindings are added by this preset.

## Dependencies

None.

## When to use

Use this preset in React applications where you need context-based access to your Inversify container.

## Usage

```sh
npx @undermuz/inversify-generator add-preset-module react
```

## Examples

```tsx
import { Suspense } from "react"

import { DiProvider } from "./react/di.provider"
import { useDi } from "./react/hooks/useDi"
import { useT } from "./react/hooks/useT"
import { I18nProvider } from "./i18n/types"

function Feature() {
    const gpsLocator = useDi<IGpsProvider>(GpsProvider)
    const ipLocator = useDi<IIpLocatorProvider>(IpLocatorProvider)

    const geocoder = useDi<IGeocoderProvider>(GeocoderProvider)
    const location = useDi<ILocationProvider>(LocationProvider)
    const t = useT(I18nProvider)

    return <span>{t("greeting")}</span>
}

export function App() {
    return (
        <Suspense fallback={<Bootstrap />}>
            <DiProvider>
                <Router />
            </DiProvider>
        </Suspense>
    )
}
```

## Notes

The manifest currently references `di.provider.ts`, while the file in this folder is `di.provider.tsx`.

