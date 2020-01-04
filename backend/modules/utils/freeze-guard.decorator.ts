import { MethodDecorator } from "ts-typedefs";
import { Container } from "typedi";

import { LoggingService } from "@modules/logging/logging.service";
import { DebugService   } from "@modules/debug.service";

/**
 * Aborts program if promise returned by decorated method is not resolved
 * within `thresh` milliseconds.
 * @param thresh Maximum time that the promise returned by decorated method
 *               may take to resolve.
 */
export function FreezeGuard(thresh: number): MethodDecorator<any[], Promise<any>> { 
    return (_protoOrCls, methodName, descr) => {
        const method = descr.value!;
        let i = 0;
        descr.value = function(...params) {
            const log           = Container.get(LoggingService);
            const debug         = Container.get(DebugService);
            const callSignature = `${methodName}() #${++i}`;
            const displayTime   = log.time(callSignature);
            const retPromise    = method.apply(this, params);
            const nodeTimer     = setTimeout(
                () => debug.shutdown(`${callSignature} failed to resolve in ${thresh} ms.`), 
                thresh
            );
            return retPromise.finally(() => {
                clearTimeout(nodeTimer);
                displayTime();
            });
        };
        return descr;
    };
}
