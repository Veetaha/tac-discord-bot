import ds from 'discord.js';
import { Service } from "typedi";

import { UserError      } from './discord-cmd/errors/user-error.class';
import { LoggingService } from './logging/logging.service';
import { ConfigService  } from './config/config.service';

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
    async tryReplyWithError(msg: ds.Message, err: unknown): Promise<void> {
        await this.replyWithErrorOrFail(msg, err).catch(this.log.error);
    }

    private async replyWithErrorOrFail(msg: ds.Message, err: unknown): Promise<void> {
        if (err instanceof UserError) {
            return void await msg.reply(err.createDiscordReply());
        }
        const errReport = this.stringifyInternalError(err);
        this.log.warning(err, "replied with internal error");
        await msg.reply(`Internal error: ${errReport}`);
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
            !this.config.isDevelopmentMode        ?
            err.message :
            err.stack   ?
            err.stack   :
            `err.stack is not available, err.message fallback: ${err.message}`
        );
    }


}
