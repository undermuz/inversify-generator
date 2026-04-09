import { ContainerModule } from "inversify"

import { PromiseManager } from "./provider"

export const PromiseManagerModule = new ContainerModule((ctx) => {
    ctx.bind<PromiseManager>(PromiseManager)
        .to(PromiseManager)
        .inTransientScope()
})
