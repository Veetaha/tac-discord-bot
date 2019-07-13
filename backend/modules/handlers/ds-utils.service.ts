import Ds from 'discord.js';
import * as IterTools from 'iter-tools';
import { Service } from "typedi";

import { ConfigService } from '@modules/config/config.service';
import { StringService } from '@modules/utils/string.service';

export type TextSendableChannel = Ds.TextChannel | Ds.DMChannel | Ds.GroupDMChannel;

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
    getGuildWritableTextChannelOrFail(guild: Ds.Guild, channelName: string) {
        const channel = guild.channels.find(suspect => suspect.name === channelName);
        if (channel.type !== 'text') {
            throw new Error(`Channel "${channelName}" is not a text channel.`);
        }
        if (!channel.permissionsFor(guild.me)!.has('SEND_MESSAGES')) {
            throw new Error(`Channel ${channelName} is not openned for me to send messages.`);
        }
        return channel as Ds.TextChannel;
    }


}