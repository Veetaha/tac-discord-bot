import _ from 'lodash';
import { MethodDecorator } from 'ts-typedefs';

import { DiscordCmdHandlerFnCtx   } from './discord-handler.interfaces';
import { DiscordCmdEndpointParams } from './dicord-cmd-endpoint-params.interface';
import { pushCmdEndpointMetadata } from './discord-cmd-endpoint.metadata';


/** 
 * Registers metadata for the decorated method to be a command handler function.
 * You may use this decorator only once per method.
 */
export function DiscordCmdEndpoint({ cmd, ...restParams}: DiscordCmdEndpointParams): 
MethodDecorator<[DiscordCmdHandlerFnCtx]> {
    return (proto, methodName) => pushCmdEndpointMetadata(
        { 
            ...restParams,
            handlerFn:    proto[methodName],
            cmd:          new Set(cmd)
        }, 
        proto
    );
}
