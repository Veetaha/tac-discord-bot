import Ds from 'discord.js';
import Container from 'typedi';
import { Nullable } from 'ts-typedefs';

import { LoggingService } from '@modules/logging.service';

import { VoiceMgr     } from './voice-mgr.class';
import { AudioTrack   } from './audio-track.class';

export const enum TrackEndReason {
    TrackInterrupt = 'Track was replaced with other stream.'
}

export class AudioPlayer {
    private static readonly log   = Container.get(LoggingService);

    private readonly voiceMgr: VoiceMgr;
    private curDispatcher?:    Nullable<Ds.StreamDispatcher>;

    constructor(client: Ds.Client) {
        super();
        this.voiceMgr = new VoiceMgr(client);
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
        const dispatcher = track.streamTo(connection);
        if (this.isStreaming()) this.endStreaming();

        this.curDispatcher = dispatcher;
        dispatcher.on('end', reason => {
            AudioPlayer.log.info(`Dispather ended playing with reason (${reason})`);
            if (this.curDispatcher === dispatcher) {
                this.curDispatcher = null;
            }
        });
        return { 
            newConnection: prevConn === this.voiceMgr.getConnection() 
                ? null : this.voiceMgr.getConnection(),
            dispatcher 
        };
    }

    /**
     * Pre: `.isStreaming() === true`
     */
    endStreaming() {
        this.curDispatcher!.end(TrackEndReason.TrackInterrupt);
    }

    isStreaming() {
        return this.curDispatcher != null;
    }

    /**
     * Pre: `.isStreaming() === true`
     */
    pauseCurrentTrack() {
        this.curDispatcher!.pause();
    }

    /**
     * Pre: `.isStreaming() === true`
     */
    isCurrentTrackOnPause() {
        return this.curDispatcher != null && this.curDispatcher.paused;
    }

    /**
     * Pre: `.isCurrentTrackOnPause() === true`
     */
    resumeCurrentTrack() {
        this.curDispatcher!.resume();
    }

    /**
     * Pre: `.isStreaming() === true`
     * 
     * @param volume Precentage of volume to set (from 0 to 1). 
     */
    setVolumeLogarithmic(volume: number) {
        this.curDispatcher!.setVolumeLogarithmic(volume);
    }


    
}

