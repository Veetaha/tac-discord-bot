import _ from "lodash";
import Discord from 'discord.js';
import { Service } from "typedi";

import { LoggingService } from "@services/logging.service";
import { ConfigService  } from "@services/config.service";


import { DiscordMemberError } from "./errors/discord-member-error.class";
import { DiscordMetadataStorage } from "./meta/discord-metadata-storage.class";
import { DiscordCmdHandlerFn } from "./dicord-cmd-handler.class";

export interface DiscordCmdHandlingManagerParams {
    /** 
     * Defines the string that command message must be prefixed with in order
     * to disambiguate them from regular user messages.
     * E.g. `!`, `--`, `/` 
     */
    cmdPrefix: string;


    /**
     * Handler that is called when bot received unknown command name.
     */
    onUnknownCmd: DiscordCmdHandlerFn;
}


@Service()
export class DiscordCmdHandlingManager {
    cmdPrefix!: string;
    private unknownCmdHandlerFn!: DiscordCmdHandlerFn;

    constructor(
        private readonly config:   ConfigService,
        private readonly log:      LoggingService,
        private readonly metadata: DiscordMetadataStorage
    ) {}

    init({cmdPrefix, onUnknownCmd}: DiscordCmdHandlingManagerParams) {
        this.cmdPrefix = cmdPrefix;
        this.unknownCmdHandlerFn = onUnknownCmd;
        return this;
    }
    /**
     * Attempts to handle command sent by a guild member. 
     * Returns `true` if command was [un]successfully handled, `false` if message
     * didn't contain any command-like syntax.
     * This methods doesn't throw.
     * 
     * @param msg Discord message received from `Discord.Client`.
     */
    async tryHandleCmd(msg: Discord.Message){
        return this.tryInvokeCmdHandlerForMessageOrFail(msg)
            .catch(async err => {
                if (err instanceof DiscordMemberError) {
                    await msg.reply(err.createDiscordReply());
                    return true;
                }
                const errReport = 
                    !(err instanceof Error)  ? 
                    String(err)              : 
                    this.config.isDevelopmentMode ? 
                    err.stack                : 
                    err.message;

                this.log.warning(err, "error while handling message");
                await msg.reply(`Internal error: ${errReport}`);
                return true;
            });
    }   
    private async tryInvokeCmdHandlerForMessageOrFail(msg: Discord.Message){
        const msgContent = msg.content.trim();
        if (msg.author.bot || !msgContent.startsWith(this.cmdPrefix)) {
            return false;
        }
        const {cmd, params} = this.getCmdAndParamsFromMsgContent(msgContent);
        const ctx = {msg, cmd, params};
        const handler = this.metadata.getHandlerForCmd(cmd);
        await (handler == null 
            ? this.unknownCmdHandlerFn(ctx)
            : handler.tryHandleMsgOrFail(ctx));
        return true;       
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