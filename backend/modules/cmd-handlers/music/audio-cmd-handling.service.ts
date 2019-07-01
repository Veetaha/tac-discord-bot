import Joi from 'typesafe-joi';
import { Service  } from "typedi";

import { CmdEndpoint     } from "@modules/discord/meta/cmd-endpoint.decorator";
import { CmdHandlerFnCtx } from "@modules/discord/interfaces";
import { DsClientService } from '@modules/ds-client.service';
import { ConfigService   } from '@modules/config.service';

import { AudioQueue, Events as AQEvents } from './audio-queue.class';
import { Nullable } from 'ts-typedefs';
import { RichEmbed } from 'discord.js';

// TODO
@Service()
export class AudioCmdHandlingService {
    private readonly audioQueue: AudioQueue;

    constructor(dsClient: DsClientService, config: ConfigService) {
        this.audioQueue = new AudioQueue(dsClient.client, config.maxAudioQueueSize)
            .on(AQEvents.TrackScheduled, ({track, index}) => track.msg.channel.send(new RichEmbed({
                description: `Track ${track.getTitleMd()} was scheduled to be ${'`'}#${index}${'`'} in the queue.`
            })))
            .on(AQEvents.TrackStart, track => track.msg.channel.send(new RichEmbed({ 
                description: `Now playing ${track.getTitleMd()}`
            })))
            .on(AQEvents.TrackEnd, track => track.msg.channel.send(new RichEmbed({ 
                description: `Track ${track.getTitleMd()} stopped playing has finished.`
            })))
            .on(AQEvents.TrackInterrupt, track => track.msg.channel.send(new RichEmbed({
                description: `Track ${track.getTitleMd()} was skipped.`
            })))
            .on(AQEvents.ConnectedToVoiceChannel, ({channel, track}) =>
                track.msg.channel.send(`Connected to voice channel **"${channel.name}"**.`)
            );
    }
    
    @CmdEndpoint({
        cmd: ['music', 'm'],
        description: "Play music.",
        params: { 
            minRequiredAmount: 0,
            definition: [
            { 
                name: 'youtube_url',
                description: 'Connects to your voice channel and plays music that you request.',
                schema: Joi.string().uri().regex(/^https:\/\/www\.youtube\.com/)
            }
        ] 
        }
    })
    async onMusic({msg, params: [ytUrl]}: CmdHandlerFnCtx<[Nullable<string>]>) {
        if (ytUrl == null) {
            const embed = new RichEmbed({
                title: `Current music queue`
            });
            let i = 0;
            this.audioQueue.forEachTrackInQueue((audioTrack) => {
                embed.addField(`#${i}`, audioTrack.getTitleMd());
                ++i;
            });
            await msg.channel.send(embed);
            return;
        }
        await this.audioQueue.streamOrEnqueueYtVidOrderOrFail({
            ytUrl, msg
        });   
    }

    @CmdEndpoint({
        cmd: ['volume', 'v'],
        description: 'Sets or displays current volume ',
        params: {
            minRequiredAmount: 0,
            definition: [{ 
                name: 'volume_precentage', schema: Joi.number().min(0).max(100) ,
                description: 'Volume percentage number from 0 to 1.'
            }]
        }
    })
    async onVolume({msg, params: [volume]}: CmdHandlerFnCtx<[Nullable<number>]>) {
        if (volume == null) {
            await msg.reply(
                `Current music volume is ${'`'}${
                this.audioQueue.getVolumeLogarithmic() * 100}${'`'}`
            );
            return;
        }
        this.audioQueue.setVolumeLogarithmic(volume / 100);
        await msg.reply(`Current music volume was set to ${'`'}${volume}${'`'}`);
    }


    @CmdEndpoint({
        cmd: ['pause-music', 'pm'],
        description: 'Pauses currently playing audio track.'
    })
    async onPauseMusic({msg}: CmdHandlerFnCtx) {
        this.audioQueue.pauseCurrentTrackOrFail();
        await msg.reply(new RichEmbed({
            description: `Track ${this.audioQueue.getCurrentTrack()!.getTitleMd()} was set on pause.`
        }));
    }

    @CmdEndpoint({
        cmd: ['resume-music', 'rm'],
        description: 'Resumes current audio track'
    })
    async onResumeMusic({msg}: CmdHandlerFnCtx) {
        this.audioQueue.resumeCurrentTrackOrFail();
        await msg.reply(new RichEmbed({
            description: `Track ${this.audioQueue.getCurrentTrack()!.getTitleMd()} was resumed.`
        }));
    }

    @CmdEndpoint({
        cmd: ['skip-music', 'sm'],
        description: 'Skips currently played audio track'
    })
    async onSkipMusic({}: CmdHandlerFnCtx) {
        await this.audioQueue.skipCurrentTrackOrFail();
    }

}