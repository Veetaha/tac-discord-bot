import Joi from 'typesafe-joi';
import { Nullable } from "ts-typedefs";
import { Service } from 'typedi';

import { CmdEndpoint } from "@modules/discord-cmd/meta/cmd-endpoint.decorator";
import { CmdHandlerFnCtx } from "@modules/discord-cmd/cmd.interfaces";

import { AudioPlayerService } from '../audio-player.service';

@Service()
export class VolumeCmdService {
    constructor(private readonly audioPlayer: AudioPlayerService) {}

    @CmdEndpoint({
        cmd: ['volume', 'v'],
        description: 'Sets or displays current volume.',
        params: {
            minRequiredAmount: 0,
            definition: [{ 
                name: 'volume_precentage', schema: Joi.number().min(0).max(100) ,
                description: 'Volume percentage number (min: `0` max: `100`)'
            }]
        }
    })
    async onVolume({msg, params: [volume]}: CmdHandlerFnCtx<[Nullable<number>]>) {
        if (volume == null) {
            await msg.reply(
                `Current music volume is ${'`'}${
                this.audioPlayer.getVolume() * 100}${'`'}`
            );
            return;
        }
        this.audioPlayer.setVolume(volume / 100);
        await msg.reply(`Current music volume was set to ${'`'}${volume}${'`'}`);
    }
}