import Joi from 'typesafe-joi';
import { Service } from "typedi";
import { Nullable } from "ts-typedefs";

import { CmdEndpoint } from "@modules/discord-cmd/meta/cmd-endpoint.decorator";
import { CmdHandlerFnCtx } from "@modules/discord-cmd/cmd.interfaces";

import { AudioPlayerService } from '../audio-player.service';
import { AudioQueueService } from '../audio-queue.service';

@Service()
export class BitrateCmdService {
    constructor(
        private readonly audioQueue:  AudioQueueService,
        private readonly audioPlayer: AudioPlayerService
    ) {}

    @CmdEndpoint({
        cmd: ['bitrate', 'br'],
        description: 
            'Sets or displays current audio bitrate. New bitrate setting ' +
            'will be displayed with the next track. ' +
            'The bigger bitrate the higher audio quality is, however users '+
            'with bad internet connection may experience packet loss.',
        params: {
            minRequiredAmount: 0,
            definition: [{ 
                name: 'value_kbps',
                description: 
                'New bitrate value to set in kilobytes per second (min: `8`, max: `192`)',
                schema: Joi.number().integer().min(8).max(192)
            }]
        }
    })
    async onBitrate({msg, params:[bitrate]}: CmdHandlerFnCtx<[Nullable<number>]>) {
        if (bitrate == null) {
            const currentTrack = this.audioQueue.getCurrentTrack();
            return msg.reply(
                `Current audio bitrate setting is at ${
                '`'}${this.audioPlayer.getBitrate()} kbps${'`'}.\n` +
                (currentTrack == null ? '' : 
                `Current track original bitrate: ${
                '`'}${currentTrack.getOriginalBitrateOrFail()} kbps${'`'}.`)
            );
        }
        this.audioPlayer.setBitrate(bitrate);
        return msg.reply(`Current audio bitrate was set to ${'`'}${bitrate} kbps${'`'}`);
    }


}