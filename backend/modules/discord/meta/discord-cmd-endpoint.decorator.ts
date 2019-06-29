import _ from 'lodash';
import Container from 'typedi';
import { MethodDecorator, Class } from 'ts-typedefs';

import { DiscordMetadataStorage } from './discord-metadata-storage.class';
import { DiscordCmdMetadataApi, DiscordCmdHandlerFnCtx } 
from '../discord.interfaces';

const metadataStorage = Container.get(DiscordMetadataStorage);

/** 
 * Registers metadata for the decorated method to be a command handler function.
 * You may use this decorator only once per method.
 */
export function DiscordCmdEndpoint(params: DiscordCmdMetadataApi): 
MethodDecorator<[DiscordCmdHandlerFnCtx<any>]> {
    return (proto, _methodName, descriptor) => metadataStorage.registerHandler(
        proto.constructor as Class<typeof proto>,
        descriptor.value!,
        params
    );
}
