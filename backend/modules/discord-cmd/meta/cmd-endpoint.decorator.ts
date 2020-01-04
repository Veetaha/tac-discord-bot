import { Container } from 'typedi';
import { MethodDecorator, Class } from 'ts-typedefs';

import { MetadataStorage } from './metadata-storage.class';
import { CmdMetadataApi  } from '../cmd.interfaces';

const metadataStorage = Container.get(MetadataStorage);

/** 
 * Registers metadata for the decorated method to be a command handler function.
 * You may use this decorator only once per method.
 */
export function CmdEndpoint(params: CmdMetadataApi): MethodDecorator {
    // FIXME: At this point, class decorators haven't been evaluated, thus
    // TypeScript hasn't associated type metadata with this class yet so
    // manual calling to `Service()(proto.constructor)` doesn't save the day.
    // That's why we have to delay registration for the next spin of event loop
    return (proto, _methodName, descriptor) => process.nextTick(() => 
        metadataStorage.registerHandler(
            proto.constructor as Class<typeof proto>,
            descriptor.value!,
            params
        )
    );
}
