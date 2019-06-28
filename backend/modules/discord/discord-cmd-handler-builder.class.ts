import _ from "lodash";
import Discord from 'discord.js';
import Container from "typedi";
import { Class, Obj } from "ts-typedefs";

import { LoggingService } from "@services/logging.service";
import { DebugService   } from "@services/debug.service";

import { getCmdEndpointMetadata } from "./discord-cmd-endpoint.metadata";
import { DiscordCmdEndpointHandler } from "./dicord-cmd-endpoint-handler.class";
import { DiscordMsgHandlerFn, DiscordCmdHandlerFn }  from "./discord-handler.interfaces";
import { DiscordCmdEndpointMetadata, DiscordCmdEndpointMetadataItem } 
from "./discord-cmd-endpoint-metadata.interface";



export interface DiscordCmdHandlerBuilderParams {
    /** 
     * Defines the string that command message must be prefixed with in order
     * to disambiguate them from regular user messages.
     * E.g. `!`, `--`, `/` 
     */
    cmdPrefix: string;

    /**
     * All the command handing services that should be used in the builded
     * message handler.
     * 
     * Pre: all cmdHandlers must be decorated with `@Service()` and have at least 
     * one of their method decorated with `@DiscordCmdEndpoint({ ... })`
     */
    cmdHandlers: Iterable<Class<Obj>>;

    /**
     * 
     */
    onUnknownCmd: DiscordCmdHandlerFn;
}
export class DiscordCmdHandlerBuilder {
    private static readonly debug = Container.get(DebugService);
    private static readonly log = Container.get(LoggingService);

    private readonly cmdToHandlerMap = new Map<string, DiscordCmdEndpointHandler>();

    private readonly cmdPrefix: string;
    private readonly unknownCmdHandlerFn: DiscordCmdHandlerFn;

    constructor({ onUnknownCmd, cmdPrefix, cmdHandlers}: DiscordCmdHandlerBuilderParams) {
        this.cmdPrefix = cmdPrefix;
        this.unknownCmdHandlerFn = onUnknownCmd;
        for (const cmdHandlerServiceClass of cmdHandlers) {
            const metadataArr = getCmdEndpointMetadata(cmdHandlerServiceClass.prototype);
            DiscordCmdHandlerBuilder.debug.assert(metadataArr);
            this.addHandlersToMapForMetadata(metadataArr!, Container.get(cmdHandlerServiceClass));
        }
    }
    private addHandlersToMapForMetadata(
        metadataArr: DiscordCmdEndpointMetadata, 
        handlersContext: Obj
    ) {
        for (const metadata of metadataArr) {
            metadata.handlerFn = metadata.handlerFn.bind(handlersContext);
            this.addHandlerToMapForMetadataItem(metadata);
        }
    }
    private addHandlerToMapForMetadataItem(metadata: DiscordCmdEndpointMetadataItem) {
        const endpointHandler = new DiscordCmdEndpointHandler(metadata);
        metadata.cmd.forEach(cmd => this.cmdToHandlerMap.set(cmd.toLowerCase(), endpointHandler));
    }

    buildMessageHandler(): DiscordMsgHandlerFn {
        return msg => void this.tryInvokeCmdHandlerForMessage(msg)
            .catch(async err => {
                DiscordCmdHandlerBuilder.log.error(err.message, "error while handling message");
                await msg.reply(`Error: ${err.message}`);
            });
    }   
    private async tryInvokeCmdHandlerForMessage(msg: Discord.Message){
        if (msg.author.bot) return;
        const msgContent = msg.content.trim();
        if (!msgContent.startsWith(this.cmdPrefix)) return;

        const {cmd, params} = this.getCmdAndParamsFromMsgContent(msgContent);
        const ctx = {msg, cmd, params};
        const handler = this.cmdToHandlerMap.get(cmd);
        return handler == null 
            ? this.unknownCmdHandlerFn(ctx)
            : handler.tryHandleMsgOrFail(ctx);       
    }    
    private getCmdAndParamsFromMsgContent(msgContent: string) {
        const unprefixedMsg = msgContent.slice(this.cmdPrefix.length);
        let cmdEndIndex = unprefixedMsg.search(/[^\w\d_-]/i);
        if (cmdEndIndex < 0) {
            cmdEndIndex = unprefixedMsg.length;
        }
        const params = unprefixedMsg.slice(cmdEndIndex).trimStart();
        return {
            cmd:    unprefixedMsg.slice(0, cmdEndIndex),
            params: params === '' ? [] : params.split(/\s+/)
        };
    }
}