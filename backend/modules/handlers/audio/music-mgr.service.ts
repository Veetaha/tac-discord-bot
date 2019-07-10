import Ds from 'discord.js';
import Moment from 'moment';
import { LoggingService } from '@modules/logging.service';

import { Service } from "typedi";

import { AudioTrack } from './audio-track.class';
import { AudioPlayerService } from './audio-player.service';
import { AudioQueueService, Events as AQEvents } from "./audio-queue.service";
@Service()
export class MusicMgrService {

    private sendEmbed(track: AudioTrack, embedOpts: Ds.RichEmbedOptions) {
        return track.msg.channel.send(new Ds.RichEmbed(embedOpts)).catch(this.log.error);
    }

    constructor(
        private readonly audioQueue:  AudioQueueService, 
        private readonly audioPlayer: AudioPlayerService,
        private readonly log:         LoggingService
    ) {
        audioQueue
            .on(AQEvents.TrackScheduled, ({track, index}) => this.sendEmbed(track, {
                description: 
                    `Track ${track.toMd()} was scheduled to be ` +
                    `${'`'}#${index}${'`'} in the queue.`,
                thumbnail: { url: track.getThumbnailUrl() },
                footer: this.createScheduledTrackFooter(track)
            }))

            .on(AQEvents.TrackStart, track => this.sendEmbed(track, { 
                description: 
                    `Now playing ${track.toMd()} \n(original bitrate ` +
                    `${'`'}${track.getOriginalBitrateOrFail()} kbps${'`'}, ` +  
                    `current: ${'`'}${audioPlayer.getBitrate()} kbps${'`'})`,
                thumbnail: { url: track.getThumbnailUrl() },
                footer: this.createActiveTrackFooter()
            }))

            .on(AQEvents.TrackEnd, track => this.sendEmbed(track, { 
                description: `Track ${track.toMd()} has finished.`
            }))

            .on(AQEvents.TrackInterrupt, track => this.sendEmbed(track, {
                description: `Track ${track.toMd()} was skipped.`
            }))
            
            .on(AQEvents.ConnectedToVoiceChannel, track => this.sendEmbed(track, { 
                description: `Connected to voice channel **"${
                    track.msg.member.voiceChannel.name}"**.`
            }));

    }

    /**
     * Creates discord embed footer part for the currently playing track.
     * Pre: `audioPlayer.isStreaming()`
     */
    createActiveTrackFooter() {
        const track = this.audioQueue.getCurrentTrack()!;
        const { member } = track.msg;
        const playedDuration = this.formatDuration(this.audioPlayer.getCurrentStreamingTime());
        const totalTrackDuration = this.formatDuration(track.getDuration());
        return {
            text: `ordered by ${member.displayName} (${playedDuration} / ${totalTrackDuration})`,
            icon_url: member.user.displayAvatarURL
        };
    }


    /**
     * Creates discord embed footer part for the given track.
     * @param track 
     */
    createScheduledTrackFooter(track: AudioTrack) {
        const { member } = track.msg;
        const duration = this.formatDuration(track.getDuration());
        return {
            text: `ordered by ${member.displayName}, duration: ${duration}`,
            icon_url: member.user.displayAvatarURL
        };
    }

    /** Returns duration in a colon separated string format. */
    formatDuration(duration: number) {
        return Moment.duration(duration).format(`d[d] h:mm:ss`, {
            trim: 'large',
            stopTrim: 'm'
        });
    }
}