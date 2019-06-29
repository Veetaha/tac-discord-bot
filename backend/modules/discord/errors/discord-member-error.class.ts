import Discord from 'discord.js';
import Container from 'typedi';
import { ConfigService } from '@services/config.service';

interface DiscordMemberErrorParams {
    /** Short name of the kind of this error. */
    readonly title: string;

    /** Detailed explanation of why this error happened. */
    readonly description: string;
    /**
     * Discord member that caused an error.
     */
    readonly violator: Discord.GuildMember;
}


/**
 * Represents a base class for discord member errors (those that are caused
 * by people, not by bugs)
 */
export class DiscordMemberError extends Error implements DiscordMemberErrorParams {
    private static readonly config = Container.get(ConfigService);

    readonly title!:       string;
    readonly description!: string;
    readonly violator!:    Discord.GuildMember;

    constructor(params: DiscordMemberErrorParams) {
        super(`${params.title}: ${params.description}`);
        Object.assign(this, params);
    }

    /** 
     * virtual (may be overriden) 
     * Creates an error message that will me forwarded to `msg.reply(...)`.
     */
    createDiscordReply() {
        const opts: Discord.RichEmbedOptions =
        {
            ...DiscordMemberError.config.errorRichEmbedDefaultOptions,
            title: this.title,
            description: this.description
        };
        return new Discord.RichEmbed(opts);
    }
}