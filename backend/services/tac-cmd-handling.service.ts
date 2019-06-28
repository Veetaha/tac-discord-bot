import Discord from 'discord.js';
import { Service } from "typedi";

import { DiscordCmdEndpoint } from "../modules/discord/discord-cmd-endpoint.decorator";
import { DiscordCmdHandlerFnCtx } from "../modules/discord/discord-handler.interfaces";
import { ThePonyApiService } from "./the-pony-api/the-pony-api.service";

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
        cooldownTime: 15000
    })
    async onPony({msg}: DiscordCmdHandlerFnCtx){
        const pony = await this.thePonyApi.fetchRanomPonyImgUrl();
        if (pony.tags.length > 5) {
            pony.tags.splice(5);
        }

        return msg.reply(new Discord.RichEmbed()
            .setImage(pony.representations.full)
            .setTitle(`Random pony for ${msg.member.displayName}`)
            .setDescription(pony.tags.map(tag => `#${tag}`))
            .setThumbnail(msg.member.user.avatarURL)
            .setFooter('cracked by Veetaha')
        );
    } 

}