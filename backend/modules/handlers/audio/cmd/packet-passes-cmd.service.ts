import Joi from 'typesafe-joi';
import { Service } from "typedi";
import { Nullable } from "ts-typedefs";

import { CmdEndpoint } from "@modules/discord-cmd/meta/cmd-endpoint.decorator";
import { CmdHandlerFnCtx } from "@modules/discord-cmd/cmd.interfaces";
import { AudioPlayerService } from '../audio-player.service';


@Service()
export class PacketPassesCmdService {
    constructor(private readonly audioPlayer: AudioPlayerService) {}

    @CmdEndpoint({
        cmd: ['packet-passes', 'pp'],
        description: 
            "Sets amount of passes to take when sending packets of audio data. " +
            "**AHTUNG!** Bot's bandwidth usage will be increased by the factor of this value.",
        params: {
            minRequiredAmount: 0,
            definition: [{
                name: 'amount',
                description: 
                'New packet passes amount to set (min: `1`, max: `5`)',
                schema: Joi.number().integer().min(1).max(5)
            }]
        }
    })
    onPacketPasses({msg, params: [passes]}: CmdHandlerFnCtx<[Nullable<number>]>){
        if (passes == null) {
            return msg.reply(
                `Current packet passes amount setting is ${
                '`'}${this.audioPlayer.getPacketPasses()}${'`'}.`
            );
        }
        this.audioPlayer.setPacketPasses(passes);
        return msg.reply(
            `Current audio packet passes amount was set to ${'`'}${passes}${'`'}.\n` +
            `It will be applied as soon as the next track gets to be played.`
        );
    }
}