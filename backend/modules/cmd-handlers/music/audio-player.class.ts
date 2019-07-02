import Ds from 'discord.js';
import Container from 'typedi';
import { Nullable } from 'ts-typedefs';

import { LoggingService } from '@modules/logging.service';

import { VoiceMgr     } from './voice-mgr.class';
import { AudioTrack   } from './audio-track.class';
import { ConfigService } from '@modules/config.service';

export const enum TrackEndReason {
    TrackInterrupt = 'Track was replaced with other stream.'
}

export class AudioPlayer {
    private static readonly log   = Container.get(LoggingService);

    private readonly voiceMgr: VoiceMgr;
    private curDispatcher?:    Nullable<Ds.StreamDispatcher>;
    /** Value in range [0, 1] */
    private volume:       number;
    private bitrate:      number;
    private packetPasses: number;

    constructor(client: Ds.Client) {
        this.voiceMgr     = new VoiceMgr(client);
        const {music}     = Container.get(ConfigService);
        this.volume       = music.defaultVolume;
        this.bitrate      = music.defaultBitrate;
        this.packetPasses = music.defaultPacketPasses;
    }

    /**
     * Attempts to create youtube stream and pipe it to discord.
     * End previous stream if it was active.
     * 
     * Pre: client has `SPEAK` permissions.
     * 
     * @param ytUrl Youtube video url to play audio from.
     * 
     * 
     * @returns `.vidInfo` that contains metadata about played youtube video
     * `.streamEnd` promise that resolves once the playing has completed.
     */
    async streamAudioTrackOrFail(track: AudioTrack) {
        const prevConn = this.voiceMgr.getConnection();
        const connection = await this.voiceMgr
            .connectToChannelOrFail(track.getVoiceChannel());

        if (this.isStreaming()) this.endStreaming();
        const dispatcher = track.streamOrFail(connection, { 
            volume:  this.volume,  
            bitrate: this.bitrate, 
            passes:  this.packetPasses
        });

        this.curDispatcher = dispatcher
            .once('end', reason => {
                AudioPlayer.log.info(`Dispather ended playing with reason (${reason})`);
                if (this.curDispatcher === dispatcher) {
                    this.curDispatcher = null;
                }
            })
            .on('speaking', isSpeaking => AudioPlayer.log.info(isSpeaking, `Dispatcher speaking`))
            .on('debug', info => AudioPlayer.log.warning(info, 'Dispatcher debug'));
        return { 
            newConnection: prevConn === this.voiceMgr.getConnection() 
                ? null : this.voiceMgr.getConnection(),
            dispatcher 
        };
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
        this.packetPasses = amount;
    }
    /** Returns current packet passes amount */
    getPacketPasses() { return this.packetPasses; }

    /** 
     * Sets player's bitrate. If there is a track currenly streaming, its bitrate gets updated. 
     * 
     * @param bitrate New bitrate value in `kbps`.
     */
    setBitrate(bitrate: number) {
        this.bitrate = bitrate;
        if (this.curDispatcher != null) {
            this.curDispatcher.setBitrate(bitrate);
        }
    }
    /** Returns current player's bitrate */
    getBitrate() {
        return this.bitrate;
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
        this.volume = volume;
        if (this.curDispatcher != null) {
            this.curDispatcher.setVolumeLogarithmic(volume);
        }
    }

    /**
     * Returns current player's volume.
     */
    getVolume() {
        return this.volume;
    }
    
}

