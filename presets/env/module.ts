import { ContainerModule } from "inversify"

import { EnvProvider, type IEnvProvider } from "./types"

import { EnvVite } from "./vite/provider"

export const EnvModule = new ContainerModule((ctx) => {
    ctx.bind<IEnvProvider>(EnvProvider).to(EnvVite).inSingletonScope()
})
