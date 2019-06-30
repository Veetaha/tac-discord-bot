import Joi from 'typesafe-joi';
import Ds from 'discord.js';
import { Service } from "typedi";

import { CmdEndpoint     } from "@modules/discord/meta/cmd-endpoint.decorator";
import { CmdHandlerFnCtx } from "@modules/discord/interfaces";
import { ThePonyApiService } from "@modules/the-pony-api/the-pony-api.service";

@Service()
export class TacStatelessCmdHandlingService {

    constructor(private readonly thePonyApi: ThePonyApiService) {}

    @CmdEndpoint({
        cmd:         ['pink'],
        description: `Just replies with "Ponk", used for health check.`
    })
    async onPink({msg}: CmdHandlerFnCtx) {
        return msg.reply('Ponk');
    }
    
    @CmdEndpoint({
        cmd:         ['pony'],
        description: `Replies with a random pony image.`,
        cooldownTime: 1000 * 3, // 3 seconds,
        params: {
            definition: [{
                name:        "tags",
                description: "Tags to get random pony with",
                schema:      Joi.array().items(Joi.string().regex(/^[^,]+$/))
            }]
        }
    })
    async onPony({msg, params: tags}: CmdHandlerFnCtx<string[]>){
        const pony = await this.thePonyApi.fetchRandomPony(tags);
        const footer = { text: 'Powered by theponyapi.com (cracked by Veetaha)' };

        return msg.reply(new Ds.RichEmbed(pony == null 
            ? {
                title:       `Pony was not found.`,
                description: `Failed to fetch pony with tags [${this.stringifyTags(tags)}].`,
                footer
            } : {
                title:       `Random pony for ${msg.member.displayName}`,
                description: `**Tags:** ${this.stringifyTags(pony.tags)}`,
                image:       { url: pony.representations.full },
                thumbnail:   { url: msg.member.user.avatarURL  },
                footer
            }));
    } 
    private stringifyTags(tags: string[]) {
        return `*${'`'}${tags.join('`* *`')}${'`*'}`;
    }

}