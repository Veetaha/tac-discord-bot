import Ds from 'discord.js';
import Joi from 'typesafe-joi';
import { Nullable } from 'ts-typedefs';
import { Service  } from "typedi";

import { CmdEndpoint     } from "@modules/discord/meta/cmd-endpoint.decorator";
import { CmdHandlerFnCtx } from "@modules/discord/interfaces";
import { DsClientService } from '@modules/ds-client.service';
import { ConfigService   } from '@modules/config.service';

import { AudioQueue, Events as AQEvents } from './audio-queue.class';
import { AudioTrack } from './audio-track.class';

// TODO
@Service()
export class AudioCmdHandlingService {
    private readonly audioQueue: AudioQueue;
    private createOrderFooter(track: AudioTrack) {
        return {
            text: `ordered by ${track.msg.member.displayName}, duration: ${track.getDuration()}`,
            icon_url: track.msg.member.user.displayAvatarURL
        };
    }

    constructor(private readonly config: ConfigService, dsClient: DsClientService) {
        this.audioQueue = new AudioQueue(dsClient.client, config.music.maxQueueSize)
            .on(AQEvents.TrackScheduled, ({track, index}) => track.msg.channel.send(new Ds.RichEmbed({
                description: 
                    `Track ${track.toMd()} was scheduled to be ` +
                    `${'`'}#${index}${'`'} in the queue.`,
                thumbnail: { url: track.getThumbnailUrl() },
                footer: this.createOrderFooter(track)
            })))

            .on(AQEvents.TrackStart, track => track.msg.channel.send(new Ds.RichEmbed({ 
                description: 
                    `Now playing ${track.toMd()} \n(original bitrate ` +
                    `${'`'}${track.getOriginalBitrateOrFail()} kbps${'`'}, ` +  
                    `current: ${'`'}${this.audioQueue.getBitrate()} kbps${'`'})`,
                thumbnail: { url: track.getThumbnailUrl() },
                footer: this.createOrderFooter(track)
            })))

            .on(AQEvents.TrackEnd, track => track.msg.channel.send(new Ds.RichEmbed({ 
                description: `Track ${track.toMd()} has finished.`
            })))

            .on(AQEvents.TrackInterrupt, track => track.msg.channel.send(new Ds.RichEmbed({
                description: `Track ${track.toMd()} was skipped.`
            })))
            
            .on(AQEvents.ConnectedToVoiceChannel, ({channel, track}) =>
                track.msg.channel.send(`Connected to voice channel **"${channel.name}"**.`)
            );
    }
    
    @CmdEndpoint({
        cmd: ['music', 'm'],
        cooldownTime: 1000 * 5, // 5 seconds
        description: "Play music.",
        params: { 
            minRequiredAmount: 0,
            definition: [
            { 
                name: 'youtube_url',
                description: 'Connects to your voice channel and plays music that you request.',
                schema: Joi.string().uri()
            }
        ] 
        }
    })
    async onMusic({msg, params: [ytUrl]}: CmdHandlerFnCtx<[Nullable<string>]>) {
        if (ytUrl == null) {
            await this.sendAudioQueueInfo(msg);
            return;
        }
        await this.audioQueue.streamOrEnqueueYtVidOrderOrFail({
            ytUrl, msg
        });   
    }
    private async sendAudioQueueInfo(msg: Ds.Message) {
        if (this.audioQueue.isEmpty()) {
            return msg.channel.send(new Ds.RichEmbed({
                title: "Audio queue is empty.",
                description: 
                    "There are no tracks active or scheduled. Be first to order your " +
                    "favourite music!",
                color: this.config.music.emptyQueueEmbedColor
            }));
        }
        const messages: Promise<any>[] = [];
        let i = 0;
        this.audioQueue.forEachTrackInQueue(audioTrack => {
            messages.push(msg.channel.send(i === 0 
                ? this.createActiveMusicEmbed(audioTrack)
                : this.createScheduledMusicEmbed(audioTrack, i)
            ));
            ++i;
        });
        return Promise.all(messages);
    }

    private createActiveMusicEmbed(track: AudioTrack) {
        return new Ds.RichEmbed({
            title: `ACTIVE`,
            description: track.toMd(),
            color:     this.config.music.activeTrackEmbedColor,
            thumbnail: { url: track.getThumbnailUrl() },
            footer:    this.createOrderFooter(track)
        });
    }

    private createScheduledMusicEmbed(track: AudioTrack, queueIndex: number) {
        return new Ds.RichEmbed({
            title: `#${queueIndex}`,
            description: track.toMd(),
            footer: this.createOrderFooter(track)
        });
    }

    @CmdEndpoint({
        cmd: ['volume', 'v'],
        description: 'Sets or displays current volume.',
        params: {
            minRequiredAmount: 0,
            definition: [{ 
                name: 'volume_precentage', schema: Joi.number().min(0).max(100) ,
                description: 'Volume percentage number from 0 to 100.'
            }]
        }
    })
    async onVolume({msg, params: [volume]}: CmdHandlerFnCtx<[Nullable<number>]>) {
        if (volume == null) {
            await msg.reply(
                `Current music volume is ${'`'}${
                this.audioQueue.getVolume() * 100}${'`'}`
            );
            return;
        }
        this.audioQueue.setVolume(volume / 100);
        await msg.reply(`Current music volume was set to ${'`'}${volume}${'`'}`);
    }


    @CmdEndpoint({
        cmd: ['pause-music', 'pm'],
        description: 'Pauses currently playing audio track.'
    })
    async onPauseMusic({msg}: CmdHandlerFnCtx) {
        this.audioQueue.pauseCurrentTrackOrFail();
        await msg.reply(new Ds.RichEmbed({
            description: `Track ${this.audioQueue.getCurrentTrack()!.toMd()} was set on pause.`
        }));
    }

    @CmdEndpoint({
        cmd: ['resume-music', 'rm'],
        description: 'Resumes current audio track.'
    })
    async onResumeMusic({msg}: CmdHandlerFnCtx) {
        this.audioQueue.resumeCurrentTrackOrFail();
        await msg.reply(new Ds.RichEmbed({
            description: `Track ${this.audioQueue.getCurrentTrack()!.toMd()} was resumed.`
        }));
    }

    @CmdEndpoint({
        cmd: ['skip-music', 'sm'],
        description: 'Skips currently played audio track.'
    })
    async onSkipMusic() {
        await this.audioQueue.skipCurrentTrackOrFail();
    }

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
                'New bitrate value to set in kilobytes per second (min: `8`, max: `192000`)',
                schema: Joi.number().integer().min(8).max(192)
            }]
        }
    })
    async onBitrate({msg, params:[bitrate]}: CmdHandlerFnCtx<[Nullable<number>]>) {
        if (bitrate == null) {
            const currentTrack = this.audioQueue.getCurrentTrack();
            return msg.reply(
                `Current audio bitrate setting is at ${'`'}${this.audioQueue.getBitrate()} kbps${'`'}.\n` +
                (currentTrack == null ? '' : 
                `Current track original bitrate: ${'`'}${currentTrack.getOriginalBitrateOrFail()} kbps${'`'}.`)
            );
        }
        this.audioQueue.setBitrate(bitrate);
        return msg.reply(`Current audio bitrate was set to ${'`'}${bitrate} kbps${'`'}`);
    }

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
                `Current packet passes amount setting is ${'`'}${this.audioQueue.getPacketPasses()}${'`'}.`
            );
        }
        this.audioQueue.setPacketPasses(passes);
        return msg.reply(
            `Current audio packet passes amount was set to ${'`'}${passes}${'`'}.\n` +
            `It will be applied as soon as the next track gets to be played.`
        );
    }

}