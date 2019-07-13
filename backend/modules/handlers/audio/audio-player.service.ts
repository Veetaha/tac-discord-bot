import cloneDeep from 'lodash/cloneDeep';
import Ds from 'discord.js';
import { Service } from 'typedi';
import { Nullable, RemoveKeys } from 'ts-typedefs';
import { EventEmitter } from 'events';

import { LoggingService } from '@modules/logging/logging.service';
import { ConfigService } from '@modules/config/config.service';
import { MaybeAsyncRoutine } from '@modules/interfaces';

import { VoiceMgrService } from './voice-mgr.service';
import { AudioTrack } from './audio-track.class';

export const enum TrackEndReason {
    TrackInterrupt = 'Track was replaced with other stream.'
}
export const enum Events {
    TrackStart = 'trackStart', TrackEnd = 'trackEnd'
}
export interface AudioPlayerService {
    once(eventType: Events.TrackStart, handlerFn: MaybeAsyncRoutine<[]>): this;
    once(eventType: Events.TrackEnd, handlerFn: MaybeAsyncRoutine<[TrackEndReason | string]>): this;
}

@Service()
export class AudioPlayerService extends EventEmitter {

    private curDispatcher?: Nullable<Ds.StreamDispatcher>;
    private readonly streamOpts: Required<RemoveKeys<Ds.StreamOptions, 'seek'>>;

    constructor(
        private readonly voiceMgr: VoiceMgrService, 
        private readonly log: LoggingService,
        config: ConfigService
    ) {
        super();
        this.streamOpts = cloneDeep(config.music.defaultStreamOpts);
    }

    /**
     * Attempts to create youtube stream and pipe it to discord.
     * Ceases previous stream if it was active.
     * 
     * Pre: client has `SPEAK` permissions.
     * 
     * @param ytUrl Youtube video url to play audio from.
     * 
     * @returns `true` if new connection to `track.msg.member.voiceChannel` was established,
     *          `false` if reused already existing connection.
     */
    async streamAudioTrackOrFail(track: AudioTrack) {
        if (this.isStreaming()) this.endStreaming();

        const prevConn = this.voiceMgr.getConnection();

        const connection = await this.voiceMgr.connectToChannelOrFail(track.getVoiceChannel());
        
        const dispatcher = track.streamOrFail(connection, this.streamOpts);
        // dispatcher.stream.resume()
        this.curDispatcher = dispatcher
            .once('start', () => this.emit(Events.TrackStart))
            .once('end', reason => {
                this.log.info(`Dispather ended playing with reason (${reason})`);
                if (this.curDispatcher === dispatcher) {
                    this.curDispatcher = null;
                }
                this.emit(Events.TrackEnd, reason);
            })
            .once('error', this.log.error)
            .on('debug', this.log.warning);

        return prevConn !== this.voiceMgr.getConnection();
    }

    /** Tells whether player is currently streaming any audio track. */
    isStreaming() { 
        return this.curDispatcher != null;
    }

    /** Sets current packet passes to take when streaming.
     *  It doesn't affect currently streaming track,
     *  gets applied only for the next audio track. 
     */
    setPacketPasses(amount: number) {
        this.streamOpts.passes = amount;
    }
    /** Returns current packet passes amount */
    getPacketPasses() { return this.streamOpts.passes; }

    /** 
     * Sets player's bitrate. If there is a track currenly streaming, its bitrate gets updated. 
     * 
     * @param bitrate New bitrate value in `kbps`.
     */
    setBitrate(bitrate: number) {
        this.streamOpts.bitrate = bitrate;
        if (this.curDispatcher != null) {
            this.curDispatcher.setBitrate(bitrate);
        }
    }
    /** Returns current player's bitrate */
    getBitrate() {
        return this.streamOpts.bitrate;
    }

    /**
     * Returns the time (in milliseconds) current audio track has been playing.
     * This time excludes pauses.
     * 
     * Pre: `.isStreaming() === true`
     */
    getCurrentStreamingTime() {
        return this.curDispatcher!.time;
    }

    /**
     * Terminates current audio track streaming process.
     * Pre: `.isStreaming() === true`
     */
    endStreaming() {
        this.curDispatcher!.end(TrackEndReason.TrackInterrupt);
    }

    /**
     * Pauses currenly streamed audio track. 
     * Pre: `.isStreaming() === true`
     */
    pause() {
        this.curDispatcher!.pause();
    }

    /**
     * Tells whether current audio track was set on pause or not.
     * Pre: `.isStreaming() === true`
     */
    isPaused() {
        return this.curDispatcher!.paused;
    }

    /**
     * Resumes current streaming process.
     * Pre: `.isPaused() === true`
     */
    resume() {
        this.curDispatcher!.resume();
    }

    /** 
     * Sets player's volume, if there is any track playing its volume gets updated.
     * Pre: `0 <= volume && volume <= 1`
     * @param volume Precentage of volume to set (from 0 to 1). 
     */
    setVolume(volume: number) {
        this.streamOpts.volume = volume;
        if (this.curDispatcher != null) {
            this.curDispatcher.setVolumeLogarithmic(volume);
        }
    }

    /**
     * Returns current player's volume.
     */
    getVolume() {
        return this.streamOpts.volume;
    }
    
}

