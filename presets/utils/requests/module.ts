import { ContainerModule } from "inversify"

import { RequestService } from "./provider"
import { RequestProvider, type IRequestService } from "./types"

export const RequestModule = new ContainerModule((ctx) => {
    ctx.bind<IRequestService>(RequestProvider).to(RequestService).inSingletonScope()
})

