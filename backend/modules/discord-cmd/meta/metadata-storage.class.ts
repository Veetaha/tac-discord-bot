import Container, { Service } from "typedi";
import { Class } from "ts-typedefs";

import { CmdHandlerWrapper, CmdHandlerFn } from "../cmd-handler-wrapper.class";
import { CmdParamsMetadata } from "./cmd-params-metadata.class";
import { CmdMetadataApi } from "../cmd.interfaces";
import { IteratorService } from "@modules/utils/iterator.service";
 
/**
 * Represents a singleton repository to store metadata about global application
 * command handling services.
 */
@Service()
export class MetadataStorage {
    private readonly cmdToHandlerMap = new Map<string, CmdHandlerWrapper>();
    constructor(private readonly it: IteratorService) {}

    getHandlers() {
        return this.it.uniq(this.cmdToHandlerMap.values());
    }

    /**
     * Stores metadata about the given `handlerFn` in metadata store.
     *  
     * @param handlerServiceClass Class which prototype contains `hanlderFn`.
     * @param handlerFn Method that implements command handling business logic.
     * @param inEndpointMetadata Additional parameters that describe command handling logic.
     */
    registerHandler<THandlerCtx>(
        handlerServiceClass: Class<THandlerCtx>,
        handlerFn:           CmdHandlerFn<THandlerCtx>, 
        inEndpointMetadata:  CmdMetadataApi
    ) {
        const cmds = inEndpointMetadata.cmd.map(
            MetadataStorage.toCaseInsensitiveCmd
        );
        const handler = new CmdHandlerWrapper({
            ...inEndpointMetadata,
            handlerFn: handlerFn.bind(Container.get(handlerServiceClass)),
            params:    inEndpointMetadata.params == null 
                ? null 
                : new CmdParamsMetadata(inEndpointMetadata.params)
        });
        cmds.forEach(cmd => this.cmdToHandlerMap.set(cmd, handler));        
    }

    /** 
     * Returns endpoint handler for the given command from stored metadata. 
     * 
     * @param cmd Bare command string without prefix to get handler for. 
     *            All commands are case-insensitive.
     */
    getHandlerForCmd(cmd: string) {
        return this.cmdToHandlerMap.get(MetadataStorage.toCaseInsensitiveCmd(cmd));
    }

    private static toCaseInsensitiveCmd(cmd: string) {
        return cmd.toLowerCase();
    }
}
