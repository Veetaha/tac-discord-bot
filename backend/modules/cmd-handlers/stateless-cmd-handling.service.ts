import Joi from 'typesafe-joi';
import Ds from 'discord.js';
import { Service } from "typedi";

import { CmdEndpoint     } from "@modules/discord/meta/cmd-endpoint.decorator";
import { CmdHandlerFnCtx } from "@modules/discord/interfaces";
import { ThePonyApiService } from "@modules/the-pony-api/the-pony-api.service";
import { MetadataStorage } from '@modules/discord/meta/metadata-storage.class';
import { CmdHandlingService } from '@modules/discord/cmd-handling.service';

@Service()
export class TacStatelessCmdHandlingService {

    constructor(
        private readonly thePonyApi: ThePonyApiService,
        private readonly metadataStorage: MetadataStorage,
        private readonly cmdHandling:  CmdHandlingService,
    ) {}

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


    @CmdEndpoint({
        cmd: ['help', 'h'],
        description: 'Displays command help box'
    })
    async onHelp({msg}: CmdHandlerFnCtx) {
        const opts: Ds.RichEmbedOptions = {
            title: 'Bot commands refference',
            footer: { text: 'All rights are not reserved.' },
            description: this.metadataStorage
                .getHandlers()
                .reduce((str, handler) => {
                    const cmd = `${'`'}${this.cmdHandling.cmdPrefix}${handler.cmd.values().next().value}${'`'}`;
                    const top = `${str}${cmd} ${handler.getUsageTemplate()}\n`;
                    const aliases = `**Aliases:** ${'`'}${[...handler.cmd.values()].join('` `')}${'`'}\n`;
                    const params = handler.params == null 
                        ? '' 
                        : `**Parameters:**:\n${handler.params.definition.reduce((pstr, param) => 
                                `${pstr}* *${param.name}*: ${param.description}\n`
                            ,'')}`;
                    return `${top}${aliases}${params}`;
                },
                    ''
                )
        };
        const embed = new Ds.RichEmbed(opts);
        await msg.channel.send(embed);
    }
}