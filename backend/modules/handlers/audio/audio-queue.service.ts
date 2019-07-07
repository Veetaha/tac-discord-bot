import { Service } from 'typedi';
import { Queue } from 'typescript-collections';
import { EventEmitter } from 'events';

import { MaybeAsyncRoutine } from '@modules/interfaces';
import { DebugService     } from '@modules/debug.service';
import { ErrorService     } from '@modules/error.service';

import { YtVidOrder } from './audio.interfaces';
import { AudioTrack } from './audio-track.class';
import { AudioPlayerService, TrackEndReason, Events as APEvents } from './audio-player.service';
import { 
    NoAudioIsStreamingError, AudioIsAlreadyPausedError, 
    AudioIsNotPausedError, AudioQueueOverflowError 
} from './audio.errors';
import { ConfigService } from '@modules/config.service';

export const enum Events {
    /** Emitted when track was enqueued but not instantly played. */
    TrackScheduled = 'trackScheduled', 
    /** Emitted when track streaming has finished with no interrupts. */
    TrackEnd = 'trackEnd',
    /** Emitted when track was manually finshed. */
    TrackInterrupt = 'trackInterrupt',
    /** Emitted when track strats playing. */
    TrackStart = 'trackStart',
    /** Emitted when bot established new voice connection. */
    ConnectedToVoiceChannel = 'connectedToVoiceChannel'
}
export interface TrackScheduledEvent {
    /** Index in queue */
    index: number;
    track: AudioTrack;
}

export interface AudioQueueService {
    on(eventType: Events.TrackScheduled, handlerFn: MaybeAsyncRoutine<[TrackScheduledEvent]>): this;
    on(eventType: Events.ConnectedToVoiceChannel, handlerFn: MaybeAsyncRoutine<[AudioTrack]>): this;
    on(eventType: Events.TrackInterrupt, handlerFn: MaybeAsyncRoutine<[AudioTrack]>): this;
    on(eventType: Events.TrackEnd, handlerFn: MaybeAsyncRoutine<[AudioTrack]>): this;
    on(eventType: Events.TrackStart, handlerFn: MaybeAsyncRoutine<[AudioTrack]>): this;
}

@Service()
export class AudioQueueService extends EventEmitter {
    private readonly queue = new Queue<AudioTrack>();

    constructor(
        private readonly config:      ConfigService,
        private readonly debug:       DebugService,
        private readonly errs:        ErrorService,
        private readonly audioPlayer: AudioPlayerService
    ) { super(); }

    getCurrentTrack() { 
        this.debug.assert(() => !this.audioPlayer.isStreaming() || this.queue.peek() != null);
        return this.queue.peek(); 
    }
    isStreaming() { 
        this.debug.assert(() => !this.audioPlayer.isStreaming() || this.queue.peek() != null);
        return this.audioPlayer.isStreaming(); 
    }
    isEmpty() { return this.queue.isEmpty(); }   
    
    async streamOrEnqueueYtVidOrderOrFail(order: YtVidOrder) {
        if (!this.queue.isEmpty()) {
            return this.enqueueYtVidOrderOrFail(order);
        }
        this.queue.enqueue(await AudioTrack.createFromYtVidOrderOrFail(order));
        return this.tryStreamCurrentTrack();
    }
    private async enqueueYtVidOrderOrFail(order: YtVidOrder) {
        if (this.queue.size() >= this.config.music.maxQueueSize) {
            throw new AudioQueueOverflowError(
                `Audio queue is full, you cannot enqueue more than ${
                 '`'}${this.config.music.maxQueueSize}${'`'} tracks.`
            );
        }
        const track = await AudioTrack.createFromYtVidOrderOrFail(order);
        this.queue.enqueue(track);
        this.emitTrackScheduled({ track, index: this.queue.size() - 1 });
    }

    private async tryStreamCurrentTrack(): Promise<unknown> {
        const {msg} = this.getCurrentTrack()!;
        return this.streamCurrentTrackOrFail().catch(err => Promise.all([
            this.errs.tryReplyWithError(msg, err),
            this.tryStreamNextTrack()
        ]));
    }
    private async streamCurrentTrackOrFail() {
        const track = this.getCurrentTrack()!;
        const isNewConnection = await this.audioPlayer
            .streamAudioTrackOrFail(track);
        if (isNewConnection) this.emit(Events.ConnectedToVoiceChannel, track);
        this.audioPlayer
            .once(APEvents.TrackStart, () => void this.emit(Events.TrackStart, track))
            .once(APEvents.TrackEnd, reason => {
                this.emit(reason === TrackEndReason.TrackInterrupt 
                    ? Events.TrackInterrupt 
                    : Events.TrackEnd, 
                    track
                );
                void this.tryStreamNextTrack();
            });
    }
    private async tryStreamNextTrack() {
        this.debug.assertFalsy(() => this.queue.isEmpty());
        this.queue.dequeue();
        if (!this.queue.isEmpty()) {
            return this.tryStreamCurrentTrack();
        }
    }

    forEachTrackInQueue(...params: Parameters<Queue<AudioTrack>['forEach']> ) {
        return this.queue.forEach(...params);
    }

    async skipCurrentTrackOrFail() {
        this.ensurePlayerIsStreamingOrFail();
        this.audioPlayer.endStreaming();
    }

    pauseCurrentTrackOrFail() {
        this.ensurePlayerIsStreamingOrFail();
        if (this.audioPlayer.isPaused()) {
            const trackMd = this.getCurrentTrack()!.toMd();
            throw new AudioIsAlreadyPausedError(`Track ${trackMd} is already on pause.`);
        }
        this.audioPlayer.pause();
    }
    

    resumeCurrentTrackOrFail() {
        this.ensurePlayerIsStreamingOrFail();
        if (!this.audioPlayer.isPaused()) {
            const trackMd = this.getCurrentTrack()!.toMd();
            throw new AudioIsNotPausedError(`Track ${trackMd} was not paused.`);
        }
        this.audioPlayer.resume();
    }

    private ensurePlayerIsStreamingOrFail() {
        if (!this.isStreaming()) {
            throw new NoAudioIsStreamingError('No audio track is currently playing.');
        }
    }

    private emitTrackScheduled(event: TrackScheduledEvent) {
        this.emit(Events.TrackScheduled, event);
    }
}