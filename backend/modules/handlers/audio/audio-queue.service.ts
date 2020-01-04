import { Service } from 'typedi';
import { Queue } from 'typescript-collections';
import { EventEmitter } from 'events';

import { MaybeAsyncRoutine, WrapIntoPromise } from '@common/interfaces';
import { AsyncMutex        } from '@common/utils/async-mutex';
import { ConfigService     } from '@modules/config/config.service';
import { DebugService      } from '@modules/debug.service';
import { ErrorService      } from '@modules/error.service';

import { YtVidOrder } from './audio.interfaces';
import { AudioTrack } from './audio-track.class';
import { AudioPlayerService, TrackEndReason, Events as APEvents } from './audio-player.service';
import {
    NoAudioIsStreamingError, AudioIsAlreadyPausedError,
    AudioIsNotPausedError, AudioQueueOverflowError, AudioQueueIsBusyError
} from './audio.errors';
import { Func } from 'ts-typedefs';

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
    private readonly mutex = new AsyncMutex;

    constructor(
        private readonly config:      ConfigService,
        private readonly debug:       DebugService,
        private readonly errs:        ErrorService,
        private readonly audioPlayer: AudioPlayerService
    ) { super();
        this.streamOrEnqueueYtVidOrderOrFail = this.wrapCriticalSection(this.streamOrEnqueueYtVidOrderOrFail);
        this.skipCurrentTrackOrFail = this.wrapCriticalSection(this.skipCurrentTrackOrFail);
    }

    private wrapCriticalSection<TParams extends any[], TRetval> (method: Func<TParams, TRetval>) {
        return function (this: AudioQueueService, ...params: TParams) {
            if (this.mutex.isLocked()) {
                throw new AudioQueueIsBusyError(
                    `Sorry, but some other routine is currently holding async mutex.\n` +
                    `Please, try again later and if mutex won't be released withing 30 seconds ` +
                    `file a bug to @Veetaha`
                );
            }
            return this.mutex.runExclusive(() => method.apply(this, params)) as WrapIntoPromise<TRetval>;
        };
    }
    getCurrentTrack(): AudioTrack | undefined {
        this.debug.assert(() => !this.audioPlayer.isStreaming() || this.queue.peek() != null);
        return this.queue.peek();
    }
    isStreaming(): boolean {
        this.debug.assert(() => !this.audioPlayer.isStreaming() || this.queue.peek() != null);
        return this.audioPlayer.isStreaming();
    }
    isEmpty(): boolean { return this.queue.isEmpty(); }

    async streamOrEnqueueYtVidOrderOrFail(order: YtVidOrder): Promise<void> {
        if (!this.queue.isEmpty()) {
            return this.enqueueYtVidOrderOrFail(order);
        }
        this.queue.enqueue(await AudioTrack.createFromYtVidOrderOrFail(order));
        await this.tryStreamCurrentTrack();
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

    private async tryStreamCurrentTrack(): Promise<void> {
        const {msg} = this.getCurrentTrack()!;
        await this.streamCurrentTrackOrFail().catch(err => Promise.all([
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
    private async tryStreamNextTrack(): Promise<void> {
        this.debug.assertFalsy(() => this.queue.isEmpty());
        this.queue.dequeue();
        if (!this.queue.isEmpty()) {
            await this.tryStreamCurrentTrack();
        }
    }

    forEachTrackInQueue(...params: Parameters<Queue<AudioTrack>['forEach']>): void {
        this.queue.forEach(...params);
    }

    skipCurrentTrackOrFail(): void {
        this.ensurePlayerIsStreamingOrFail();
        this.audioPlayer.endStreaming();
    }

    pauseCurrentTrackOrFail(): void {
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
