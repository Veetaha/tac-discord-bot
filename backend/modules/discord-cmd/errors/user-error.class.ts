import Ds from 'discord.js';
import Container from 'typedi';

import { ConfigService } from '@modules/config/config.service';

interface UserErrorParams {
    /** Short name of the kind of this error. */
    readonly title: string;

    /** Detailed explanation of why this error happened. */
    readonly description: string;
}


/**
 * Represents a base class for discord member errors (those that are caused
 * by people, not by application bugs).
 */
export class UserError extends Error implements UserErrorParams {
    private static readonly config = Container.get(ConfigService);

    readonly title!:       string;
    readonly description!: string;

    constructor(params: UserErrorParams) {
        super(`${params.title}: ${params.description}`);
        Object.assign(this, params);
    }

    /**
     * virtual (may be overriden)
     * Creates an error message that will me forwarded to `msg.reply(...)`.
     */
    createDiscordReply() {
        const opts: Ds.MessageEmbedOptions = {
            ...UserError.config.errorRichEmbedDefaultOptions,
            title:       this.title,
            description: this.description
        };
        return new Ds.MessageEmbed(opts);
    }
}
