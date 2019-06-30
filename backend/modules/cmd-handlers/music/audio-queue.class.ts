import Ds from 'discord.js';
import Container from 'typedi';
import { Queue } from 'typescript-collections';
import { EventEmitter } from 'events';

import { MaybeAsyncRoutine } from '@modules/interfaces';
import { LoggingService } from '@modules/logging.service';
import { DebugService } from '@modules/debug.service';

import { YtVidOrder } from './interfaces';
import { AudioTrack } from './audio-track.class';
import { AudioPlayer, TrackEndReason } from './audio-player';
import { 
    NoAudioIsStreamingError, AudioIsAlreadyPausedError, 
    AudioIsNotPausedError, AudioQueueOverflowError 
} from './errors';

export const enum Events { 
    TrackEnd = 'trackend',
    TrackStart = 'trackstart',
    TrackInterrupt = 'trackinterrupt',
    ConnectedToVoiceChannel = 'connectedtovoicechannel'
}

export interface AudioQueue {
    on(eventType: Events.ConnectedToVoiceChannel, handlerFn: MaybeAsyncRoutine<[Ds.VoiceChannel]>): this;
    on(eventType: Events.TrackInterrupt, handlerFn: MaybeAsyncRoutine<[AudioTrack]>): this;
    on(eventType: Events.TrackEnd, handlerFn: MaybeAsyncRoutine<[AudioTrack]>): this;
    on(eventType: Events.TrackStart, handlerFn: MaybeAsyncRoutine<[AudioTrack]>): this;
}

export class AudioQueue extends EventEmitter {
    private static readonly debug = Container.get(DebugService);
    private static readonly log   = Container.get(LoggingService);

    private readonly queue = new Queue<AudioTrack>();
    private readonly audioPlayer: AudioPlayer;

    constructor(dsClient: Ds.Client, readonly maxQueueSize: number) {
        super();
        this.audioPlayer = new AudioPlayer(dsClient);
    }
 
    async streamOrEnqueueYtVidOrderOrFail(order: YtVidOrder) {
        if (!this.queue.isEmpty()) {
            return this.enqueueYtVidOrderOrFail(order);
        }
        this.queue.enqueue(await AudioTrack.createFromYtVidOrderOrFail(order));
        await this.streamCurrentTrackOrFail();
    }
    private async enqueueYtVidOrderOrFail(order: YtVidOrder) {
        if (this.queue.size() >= this.maxQueueSize) {
            throw new AudioQueueOverflowError(
                `Audio queue is full, you cannot enqueue more than ${
                 '`'}${this.maxQueueSize}${'`'} tracks.`
            );
        }
        this.queue.enqueue(await AudioTrack.createFromYtVidOrderOrFail(order));
    }
    private async streamCurrentTrackOrFail() {
        const track = this.getCurrentTrack()!;
        const {
            newConnection,
            dispatcher
        } = await this.audioPlayer.streamAudioTrackOrFail(track);
        if (newConnection != null) {
            this.emit(Events.ConnectedToVoiceChannel, newConnection.channel);
        }
        dispatcher.once('start', () => this.emit(Events.TrackStart, track));
        dispatcher.once('end', reason => {
            this.emit(reason === TrackEndReason.TrackInterrupt 
                ? Events.TrackInterrupt 
                : Events.TrackEnd, 
                track
            );
            this.tryStreamNextTrackOrFail().catch(AudioQueue.log.error);
        });
        dispatcher.once('error', () => AudioQueue.log.error);
    }
    private async tryStreamNextTrackOrFail() {
        AudioQueue.debug.assertFalsy(() => this.queue.isEmpty());
        if (this.audioPlayer.isStreaming()) {
            this.audioPlayer.endStreaming();
        }
        this.queue.dequeue();
        if (!this.queue.isEmpty()) {
            return this.streamCurrentTrackOrFail();
        }
    }
    /**
     * See `AudioPlayer.setVolumeLogrithmic()`.
     */
    setVolumeLogarithmic(volume: number) {
        return this.audioPlayer.setVolumeLogarithmic(volume);
    }

    async skipCurrentTrackOrFail() {
        this.ensurePlayerIsStreamingOrFail();
        await this.tryStreamNextTrackOrFail();
    }


    pauseCurrentTrackOrFail() {
        this.ensurePlayerIsStreamingOrFail();
        if (this.audioPlayer.isCurrentTrackOnPause()) {
            const trackTitle = this.getCurrentTrack()!.getTitleMd();
            throw new AudioIsAlreadyPausedError(`Track ${trackTitle} is already on pause.`);
        }
        this.audioPlayer.pauseCurrentTrack();
    }

    resumeCurrentTrackOrFail() {
        this.ensurePlayerIsStreamingOrFail();
        if (!this.audioPlayer.isCurrentTrackOnPause()) {
            const trackTitle = this.getCurrentTrack()!.getTitleMd();
            throw new AudioIsNotPausedError(`Track ${trackTitle} was not paused.`);
        }
        this.audioPlayer.resumeCurrentTrack();
    }

    /**
     * Returns currently streaming track.
     */
    getCurrentTrack() {
        return this.queue.peek();
    }

    private ensurePlayerIsStreamingOrFail() {
        if (!this.audioPlayer.isStreaming()) {
            throw new NoAudioIsStreamingError('No audio track is currently playing.');
        }
    }

}