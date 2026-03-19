import { injectable } from "inversify"

import type { Middleware } from "../middleware/types"
import type { BaseRequest, IRequestService } from "./types"

import { compose } from "../middleware/provider"

@injectable()
export class RequestService<
    R extends BaseRequest = BaseRequest,
> implements IRequestService<R> {
    private middlewares: Middleware<R>[] = []

    public use(middleware: Middleware<R>): void {
        this.middlewares.push(middleware)
    }

    public async handle<
        _R extends R = R,
        _S extends R["response"] = R["response"],
    >(req: _R): Promise<_S> {
        await compose(this.middlewares)(req)

        const { response } = req

        return response as _S
    }
}
