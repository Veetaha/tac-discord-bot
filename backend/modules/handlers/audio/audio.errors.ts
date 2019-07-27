import { UserError } from "@modules/discord-cmd/errors/user-error.class";

export class NoAudioIsStreamingError extends UserError {
    constructor(description: string) {
        super({title: 'No audio is streaming error.', description});
    }
}

export class AudioIsNotPausedError extends UserError {
    constructor(description: string) {
        super({title: 'Audio is not paused error.', description});
    }
}

export class AudioIsAlreadyPausedError extends UserError {
    constructor(description: string) {
        super({title: 'Audio is already not paused error.', description});
    }
}

export class AudioQueueOverflowError extends UserError {
    constructor(description: string) {
        super({title: 'Audio queue overflow error.', description});
    }
}

export class YtVidSearchError extends UserError {
    constructor(description: string) {
        super({title: 'Youtube video search error.', description});
    }
}

export class AudioQueueIsBusyError extends UserError {
    constructor(description: string) {
        super({title: 'Audio queue is busy error.', description});
    }
}