import Joi from 'typesafe-joi';
import { Service  } from "typedi";

import { CmdEndpoint     } from "@modules/discord/meta/cmd-endpoint.decorator";
import { CmdHandlerFnCtx } from "@modules/discord/interfaces";
import { DsClientService } from '@modules/ds-client.service';
import { ConfigService   } from '@modules/config.service';

import { AudioQueue } from './audio-queue.class';

// TODO
@Service()
export class AudioCmdHandlingService {
    private readonly audioQueue: AudioQueue;

    constructor(dsClient: DsClientService, config: ConfigService) {
        this.audioQueue = new AudioQueue(dsClient.client, config.maxAudioQueueSize);
    }
    
    @CmdEndpoint({
        cmd: ['music', 'm'],
        description: "Play music.",
        params: { 
            definition: [
            { 
                name: 'youtube_url',
                description: 'Connects to your voice channel and plays music that you request.',
                schema: Joi.string().uri().regex(/^https://youtube\.com/)
            }
        ] 
        }
    })
    async onMusic({msg, params: [ytUrl]}: CmdHandlerFnCtx<[string]>) {
        await this.audioQueue.streamOrEnqueueYtVidOrderOrFail({
            ytUrl, customer: msg.member
        });

        // dispatcher.on('start', () => 
        //     msg.channel.send(`Now playing **"${audioTrack.title}"**`)
        // );
        // dispatcher.on('end', reason => 
        //     msg.channel.send(`Stopped playing **"${audioTrack.title}** *(${reason})*"`)
        // );
        // dispatcher.on('error', err => 
        //     msg.channel.send(`Error while playing **"${audioTrack.title}"** *(${err.message})*"`)
        // );
        // if (isNewConnection) {
        //     await msg.channel.send(
        //         `Connected to voice channel **"${msg.member.voiceChannel.name}"**.`
        //     );
        // }
    }


    @CmdEndpoint({
        cmd: ['pause-music', 'pm'],
        description: 'Pauses currently playing audio track.'
    })
    async onPauseMusic({msg}: CmdHandlerFnCtx) {
        this.audioQueue.pauseCurrentTrackOrFail();
        await msg.reply(`Track ${this.audioQueue.getCurrentTrackTitleMd()} was set on pause.`);
    }

    @CmdEndpoint({
        cmd: ['resume-music', 'rm'],
        description: 'Resumes current audio track'
    })
    async onResumeMusic({msg}: CmdHandlerFnCtx) {
        this.audioQueue.resumeCurrentTrackOrFail();
        await msg.reply(`Track ${this.audioQueue.getCurrentTrackTitleMd()} was resumed.`);
    }
}