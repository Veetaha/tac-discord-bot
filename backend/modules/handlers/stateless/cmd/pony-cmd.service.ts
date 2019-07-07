import Ds from 'discord.js';
import Joi from 'typesafe-joi';
import { Service } from "typedi";

import { DerpibooruService } from "@modules/derpibooru/derpibooru.service";
import { CmdEndpoint } from "@modules/discord-cmd/meta/cmd-endpoint.decorator";
import { CmdHandlerFnCtx } from "@modules/discord-cmd/cmd.interfaces";

@Service()
export class PonyCmdService {
    constructor(private readonly derpibooruApi: DerpibooruService) {}

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
        const imgOrVid = await this.derpibooruApi.tryFetchRandomPony(tags);
        if (imgOrVid == null) {
            return msg.reply(this.createNotFoundReply(tags));
        }
        const defaultEmbed = new Ds.RichEmbed({
            title:       `Random pony for **${msg.member.displayName}**`,
            description: `**Tags:** *${'```'}${imgOrVid.tags}${'```'}*`,
            footer:      this.footer,
            url:         `https://derpibooru.org/images/${imgOrVid.id}`
        });
        const url = `https:${imgOrVid.representations.full}`;
        return imgOrVid.mimeType.startsWith('image')
            ? msg.reply(defaultEmbed.setImage(url))
            : msg.reply(defaultEmbed).then(() => msg.channel.send(url));
    }
    private createNotFoundReply(tags: string[]) {
        return new Ds.RichEmbed({
            title:       `Pony was not found.`,
            description: `Failed to fetch pony with tags ${'`'}[${tags.join(', ')}]${'`'}.`,
            footer: this.footer
        });
    }

}