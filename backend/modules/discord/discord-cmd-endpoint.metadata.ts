import { Obj, Nullable } from "ts-typedefs";
import { DiscordCmdEndpointMetadata, DiscordCmdEndpointMetadataItem } 
from "./discord-cmd-endpoint-metadata.interface";

// private
const metaKey = 'app:discord-cmd-endpoint';

/**
 * Registers metadata array on the given command handler service prototype.
 * 
 * @param metadata Metadata item to push to metadata array.
 * @param proto    Prototype of the target command handler service class.
 */
export function pushCmdEndpointMetadata(
    metadata: DiscordCmdEndpointMetadataItem, 
    proto: Obj
) {
    let metadataArr = getCmdEndpointMetadata(proto);
    if (metadataArr == null) {
        metadataArr = [];
        Reflect.defineMetadata(metaKey, metadataArr, proto);
    }
    metadataArr.push(metadata);
}

/**
 * Retuns an array of metadata that was previously defined on the given prototype
 * of the command handler service.
 * 
 * @returns Valid metadata array or `undefined | null` if no metadata was previously defined.
 * 
 * @param proto Prototype of the target command handler service to get metadata for.
 */
export function getCmdEndpointMetadata(proto: Obj): Nullable<DiscordCmdEndpointMetadata> {
    return Reflect.getOwnMetadata(metaKey, proto);
}

// export function deleteCmdEndpointMetadata(proto: Obj) {
//     Reflect.deleteMetadata(metaKey, proto);
// }