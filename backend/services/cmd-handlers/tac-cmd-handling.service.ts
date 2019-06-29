import Discord from 'discord.js';
import { Service } from "typedi";

import { DiscordCmdEndpoint } from "@modules/discord/meta/discord-cmd-endpoint.decorator";
import { DiscordCmdHandlerFnCtx } from "@modules/discord/discord.interfaces";
import { ThePonyApiService } from "@services/the-pony-api/the-pony-api.service";

@Service()
export class TacCmdHandlingService {

    constructor(private readonly thePonyApi: ThePonyApiService) {}

    @DiscordCmdEndpoint({
        cmd: ['pink'],
        description: `Just replies with "Ponk", used for health check.`
    })
    async onPink({msg}: DiscordCmdHandlerFnCtx) {
        return msg.reply('Ponk');
    }
    
    @DiscordCmdEndpoint({
        cmd: ['pony'],
        description: `Replies with a random pony image.`,
        cooldownTime: 1000 * 15 // 15 seconds
    })
    async onPony({msg}: DiscordCmdHandlerFnCtx){
        const pony = await this.thePonyApi.fetchRanomPonyImgUrl();
        if (pony.tags.length > 5) {
            pony.tags.splice(5);
        }
        return msg.reply(new Discord.RichEmbed({
            title: `Random pony for ${msg.member.displayName}`,
            description: `#${pony.tags.join(` #`)}`,
            image: { 
                url: pony.representations.full
            },
            thumbnail: { 
                url: msg.member.user.avatarURL 
            },
            footer: { 
                text: 'Powered by theponyapi.com (cracked by Veetaha)'
            }
        }));
    } 

}