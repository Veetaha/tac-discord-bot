import { MethodDecorator } from "ts-typedefs";
import Container from "typedi";

import { LoggingService } from "@modules/logging.service";

const log = Container.get(LoggingService);

export const LogPerformance: MethodDecorator = (_protoOrCls, methodName, descr) => {
    const method = descr.value!;
    let i = 0;
    descr.value = function(...params) {
        const stopTimer = log.time(`${methodName}() #${++i}`);
        let retVal;
        try {
            return retVal = method.apply(this, params);
        } finally {
            if (retVal instanceof Promise) return retVal.finally(stopTimer);
            stopTimer();
        }
    };
    return descr;
};