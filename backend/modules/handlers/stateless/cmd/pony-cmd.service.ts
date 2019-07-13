import Ds from 'discord.js';
import Joi from 'typesafe-joi';
import { Service } from "typedi";

import { DerpibooruService } from "@modules/derpibooru/derpibooru.service";
import { CmdEndpoint } from "@modules/discord-cmd/meta/cmd-endpoint.decorator";
import { CmdHandlerFnCtx } from "@modules/discord-cmd/cmd.interfaces";
import { LoggingService } from '@modules/logging/logging.service';

@Service()
export class PonyCmdService {
    constructor(
        private readonly derpibooruApi: DerpibooruService,
        private readonly log:           LoggingService
    ) {}

    private readonly  footer = { 
        text: 'Powered by derpibooru.org (dinky.js), cracked by Veetaha.' 
    };

    @CmdEndpoint({
        cmd:         ['pony'],
        description: `Replies with a random pony image.`,
        cooldownTime: 1000 * 3, // 3 seconds,
        params: {
            definition: [{
                name:        "tags",
                description: "Tags to filter random pony by.",
                schema:      Joi.array().items(Joi.string().regex(/^[^,]+$/))
            }]
        }
    })
    // TODO: escape returned video/image tags for markdown
    async onPony({msg, params: tags}: CmdHandlerFnCtx<string[]>){
        const media = await this.derpibooruApi.tryFetchRandomPonyMedia(tags);
        if (media == null) {
            return msg.channel.send(this.createNotFoundReply(tags));
        }
        this.log.info(`Got media full representation: ${media.representations.full}`);
        const defaultEmbed = new Ds.RichEmbed({
            title:       `Random pony for **${msg.member.displayName}**`,
            description: `**Tags:** *${'```'}${media.tags}${'```'}*`,
            footer:      this.footer,
            url:         `https://derpibooru.org/images/${media.id}`
        });
        const url = `https:${media.representations.full}`;
        return media.mimeType.startsWith('image')
            ? msg.channel.send(defaultEmbed.setImage(url))
            : msg.channel.send(defaultEmbed).then(() => msg.channel.send(url));
    }
    private createNotFoundReply(tags: string[]) {
        return new Ds.RichEmbed({
            title:       `Pony was not found.`,
            description: `Failed to fetch pony with tags ${'`'}[${tags.join(', ')}]${'`'}.`,
            footer: this.footer
        });
    }

}