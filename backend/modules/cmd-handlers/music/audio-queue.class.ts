import Ds, { VoiceChannel } from 'discord.js';
import Container from 'typedi';
import { Queue } from 'typescript-collections';
import { EventEmitter } from 'events';

import { MaybeAsyncRoutine } from '@modules/interfaces';
import { LoggingService } from '@modules/logging.service';
import { DebugService } from '@modules/debug.service';

import { YtVidOrder } from './interfaces';
import { AudioTrack } from './audio-track.class';
import { AudioPlayer, TrackEndReason } from './audio-player.class';
import { 
    NoAudioIsStreamingError, AudioIsAlreadyPausedError, 
    AudioIsNotPausedError, AudioQueueOverflowError 
} from './errors';

export const enum Events {
    /** Emitted when track was enqueued but not instantly played. */
    TrackScheduled = 'trackscheduled', 
    /** Emitted when track streaming has finished with no interrupts. */
    TrackEnd = 'trackend',
    /** Emitted when track was manually finshed. */
    TrackInterrupt = 'trackinterrupt',
    /** Emitted when track strats playing. */
    TrackStart = 'trackstart',
    /** Emitted when bot established new voice connection. */
    ConnectedToVoiceChannel = 'connectedtovoicechannel'
}
export interface TrackScheduledEvent {
    /** Index in queue */
    index: number;
    track: AudioTrack;
}

export interface ConnectedToVoiceChannelEvent {
    channel: VoiceChannel;
    track: AudioTrack;
}

export interface AudioQueue {
    on(eventType: Events.TrackScheduled, handlerFn: MaybeAsyncRoutine<[TrackScheduledEvent]>): this;
    on(eventType: Events.ConnectedToVoiceChannel, handlerFn: MaybeAsyncRoutine<[ConnectedToVoiceChannelEvent]>): this;
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
        try {
            await this.streamCurrentTrackOrFail();
        } catch (err) {
            this.queue.dequeue(); 
            throw err;
        }
    }
    private async enqueueYtVidOrderOrFail(order: YtVidOrder) {
        if (this.queue.size() >= this.maxQueueSize) {
            throw new AudioQueueOverflowError(
                `Audio queue is full, you cannot enqueue more than ${
                 '`'}${this.maxQueueSize}${'`'} tracks.`
            );
        }
        const track = await AudioTrack.createFromYtVidOrderOrFail(order);
        this.queue.enqueue(track);
        const event: TrackScheduledEvent = { track, index: this.queue.size() - 1 };
        this.emit(Events.TrackScheduled, event);
    }
    private async streamCurrentTrackOrFail() {
        const track = this.getCurrentTrack()!;
        const {
            newConnection,
            dispatcher
        } = await this.audioPlayer.streamAudioTrackOrFail(track);
        if (newConnection != null) {
            const event: ConnectedToVoiceChannelEvent = {   
                channel: newConnection.channel, track
            };
            this.emit(Events.ConnectedToVoiceChannel, event);
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
    getVolumeLogarithmic() {
        return this.audioPlayer.getVolumeLogarithmic();
    }

    async skipCurrentTrackOrFail() {
        this.ensurePlayerIsStreamingOrFail();
        this.audioPlayer.endStreaming();
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

    forEachTrackInQueue(...params: Parameters<Queue<AudioTrack>['forEach']> ) {
        return this.queue.forEach(...params);
    }

}