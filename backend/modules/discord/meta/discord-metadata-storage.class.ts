import Container, { Service } from "typedi";
import _ from 'lodash';
import { Class } from "ts-typedefs";

import { DiscordCmdHandler, DiscordCmdHandlerFn } from "../dicord-cmd-handler.class";
import { DiscordCmdParamsMetadata } from "./discord-cmd-params-metadata.class";
import { DiscordCmdMetadataApi } from "../discord.interfaces";
 
/**
 * Represents a singleton repository to store metadata about global application
 * command handling services.
 */
@Service()
export class DiscordMetadataStorage {
    private readonly cmdToHandlerMap = new Map<string, DiscordCmdHandler>();

    /**
     * Stores metadata about the given `handlerFn` in metadata store.
     *  
     * @param handlerServiceClass Class which prototype contains `hanlderFn`.
     * @param handlerFn Method that implements command handling business logic.
     * @param inEndpointMetadata Additional parameters that describe command handling logic.
     */
    registerHandler<THandlerCtx>(
        handlerServiceClass: Class<THandlerCtx>,
        handlerFn:           DiscordCmdHandlerFn<THandlerCtx>, 
        inEndpointMetadata:  DiscordCmdMetadataApi
    ) {
        // FIXME: workaround because class decorators get evaluated
        // after the evaluation of method decorators and we can't
        // manually call `Service()(handlerServiceClass)`
        // because typescript hasn't yet associated type metadata with this class
        process.nextTick(() => {
            const cmds = inEndpointMetadata.cmd.map(
                DiscordMetadataStorage.toCaseInsensitiveCmd
            );
            const handler = new DiscordCmdHandler({
                ...inEndpointMetadata,
                cmd:       new Set(cmds),
                handlerFn: handlerFn.bind(Container.get(handlerServiceClass)),
                params:    inEndpointMetadata.params == null 
                    ? null 
                    : new DiscordCmdParamsMetadata(inEndpointMetadata.params)
            });
            cmds.forEach(cmd => this.cmdToHandlerMap.set(cmd, handler));        
        });
    }

    /** 
     * Returns endpoint handler for the given command from stored metadata. 
     * 
     * @param cmd Bare command string without prefix to get handler for. 
     *            All commands are case-insensitive.
     */
    getHandlerForCmd(cmd: string) {
        return this.cmdToHandlerMap.get(DiscordMetadataStorage.toCaseInsensitiveCmd(cmd));
    }

    private static toCaseInsensitiveCmd(cmd: string) {
        return cmd.toLowerCase();
    }
}
