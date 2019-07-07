import { MethodDecorator } from "ts-typedefs";
import Container from "typedi";

import { LoggingService } from "@modules/logging.service";

const log = Container.get(LoggingService);

export const LogPerformance: MethodDecorator = (protoOrCls, methodName, descr) => {
    const method = descr.value!;
    let i = 0;
    descr.value = function(this: typeof protoOrCls, ...params: Parameters<typeof method>) {
        const callId = `${methodName}() #${++i}`;
        const stopTimer = log.time(callId);
        let retVal: ReturnType<typeof method>;
        try {
            return retVal = method.apply(this, params);
        }
        finally {
            if (retVal instanceof Promise) {
                return retVal.finally(() => stopTimer(`${callId} runtime:`));
            }
            stopTimer(`${callId} runtime:`);
        }
    };
    return descr;
};