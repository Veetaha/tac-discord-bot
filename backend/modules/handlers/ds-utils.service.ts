import ds from 'discord.js';
import * as IterTools from 'iter-tools';
import { Service } from "typedi";

import { ConfigService } from '@modules/config/config.service';
import { StringService } from '@modules/utils/string.service';
import { unwrapNotNil } from 'ts-not-nil';

export type TextSendableChannel = ds.TextChannel | ds.DMChannel | ds.NewsChannel;

@Service()
export class DsUtilsService {
    constructor(
        private readonly config:  ConfigService,
        private readonly strings: StringService
    ) {}

    /**
     * Sends given `content` to `channel` splitted into several messages if
     * `content`'s length exceeds Discord's maximum message length limit.
     *
     * @param channel Discord channel to send message to.
     * @param content Message content to send.
     */
    async sendMsgInChunksToFit(channel: TextSendableChannel, content: string) {
        return Promise.all(IterTools.map(
            chunk => channel.send(chunk),
            this.strings.splitIntoChunks(content, this.config.maxDsMessageLength)
        ));
    }

    /**
     * Retreives `guild`s text channel with `channelName` and returns it, but
     * ensures that the bot may `.send()` messages to it.
     *
     * @param guild       Target guild to get channel from.
     * @param channelName Name of the channel to search.
     */
    getGuildWritableTextChannelOrFail(guild: ds.Guild, channelName: string) {
        const channel = guild.channels.cache.find(suspect => suspect.name === channelName);
        if (!channel) {
            throw new Error(`channel ${channelName} was not found`);
        }

        if (channel.type !== 'text') {
            throw new Error(`Channel "${channelName}" is not a text channel.`);
        }
        if (!channel.permissionsFor(unwrapNotNil(guild.me))!.has('SEND_MESSAGES')) {
            throw new Error(`Channel ${channelName} is not openned for me to send messages.`);
        }
        return channel as ds.TextChannel;
    }


}
