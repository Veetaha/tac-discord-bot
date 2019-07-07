import Ds from 'discord.js';
import { Service } from "typedi";

import { UserError      } from './discord-cmd/errors/user-error.class';
import { LoggingService } from './logging.service';
import { ConfigService  } from './config.service';

@Service()
export class ErrorService {
    constructor(
        private readonly log:    LoggingService,
        private readonly config: ConfigService
    ) {}

    /**
     * Replies to the `msg` with the given error `err`.
     * @param msg Message to reply to.
     * @param err Error that needs to be sent.
     */
    async tryReplyWithError(msg: Ds.Message, err: unknown) {
        return this.replyWithErrorOrFail(msg, err).catch(this.log.error);
    }

    private async replyWithErrorOrFail(msg: Ds.Message, err: unknown) {
        if (err instanceof UserError) {
            return msg.reply(err.createDiscordReply());
        }
        const errReport = this.stringifyInternalError(err);
        this.log.warning(err, "replied with internal error");
        return msg.reply(`Internal error: ${errReport}`);
    }

    /** 
     * Stringifies given `err` that may have any type in order to generate
     * readable internall error message.
     * 
     * @param err Object or value that was thrown to stringify.
     */
    stringifyInternalError(err: unknown) {
        return (
            !(err instanceof Error)               ? 
            `Non-error object was thrown: ${err}` : 
            this.config.isDevelopmentMode         ? 
            err.stack                             : 
            err.message
        );
    }


}