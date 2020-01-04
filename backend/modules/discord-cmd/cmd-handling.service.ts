import ds from 'discord.js';
import { Service } from "typedi";

import { LoggingService } from "@modules/logging/logging.service";
import { ErrorService   } from "@modules/error.service";

import { UserError       } from "./errors/user-error.class";
import { MetadataStorage } from "./meta/metadata-storage.class";
import { CmdParamsParser } from './cmd-params-parser.class';
import { UnknownCmdError } from '@modules/handlers/stateless/stateless.errors';
import { AppFreezeGuard  } from '@modules/config/app-freeze-guard.decorator';


export interface InitParams {
    /** 
     * Defines the string that command message must be prefixed with in order
     * to disambiguate them from regular user messages.
     * E.g. `!`, `--`, `/` 
     */
    cmdPrefix: string;
}

export const enum HandlingResult {
    // Message was handled:
    Success,
    UserError, 
    InternalError,
    // Message not handled:
    Skipped
}


@Service()
export class CmdHandlingService {
    cmdPrefix!: string;

    constructor(
        private readonly log:      LoggingService,
        private readonly metadata: MetadataStorage,
        private readonly errs:     ErrorService
    ) {}

    init({cmdPrefix}: InitParams) {
        this.cmdPrefix = cmdPrefix;
        return this;
    }
    /**
     * Attempts to handle command sent by a guild member. 
     * Returns `true` if command was [un]successfully handled, `false` if message
     * didn't contain any command-like syntax.
     * This methods doesn't throw.
     * 
     * @param msg Discord message received from `Ds.Client`.
     */
    @AppFreezeGuard
    async tryHandleCmd(msg: ds.Message){
        return this.tryInvokeCmdHandlerOrFail(msg)
            .catch(async err => {
                if (err instanceof UserError) {
                    await msg.reply(err.createDiscordReply());
                    return HandlingResult.UserError;
                }
                const errReport = this.errs.stringifyInternalError(err);
                this.log.warning(err, "error while handling message");
                await msg.reply(`Internal error: ${errReport}`);
                return HandlingResult.InternalError;
            });
    }   
    private async tryInvokeCmdHandlerOrFail(msg: ds.Message){
        const msgContent = msg.content.trim();
        if (msg.author.bot || !msgContent.startsWith(this.cmdPrefix)) {
            return HandlingResult.Skipped;
        }
        const {cmd, params} = this.getCmdAndParamsOrFail(msgContent);
        const ctx = {msg, cmd, params};
        const handler = this.metadata.getHandlerForCmd(cmd);

        if (handler == null) throw new UnknownCmdError(cmd);

        await handler.handleMsgOrFail(ctx);
        return HandlingResult.Success;
    }    
    private getCmdAndParamsOrFail(trimmedMsgContent: string) {
        const unprefixedMsg = trimmedMsgContent.slice(this.cmdPrefix.length);
        let cmdEndIndex = unprefixedMsg.search(/\s/);
        if (cmdEndIndex < 0) {
            cmdEndIndex = unprefixedMsg.length;
        }
        return {
            cmd: unprefixedMsg.slice(0, cmdEndIndex),
            params: [...CmdParamsParser.parseParamsOrFail(
                unprefixedMsg.slice(cmdEndIndex + 1), '\\', '"'
            )]
        };
    }
}
