import type { IMiddlewareService } from "../middleware/types"

export const RequestProvider = Symbol.for("RequestProvider")

export type BaseRequest<P = unknown, R = unknown> = {
    payload: P
    response?: R
}

export type IRequestService<R extends BaseRequest = BaseRequest> =
    IMiddlewareService<R, R["response"]>

