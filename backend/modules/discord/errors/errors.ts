import { UserError } from './user-error.class';

/**
 * This file contains definition of user errors.
 * All of the following classes may override `.createDiscordReply()`
 * method in order to customize existing general error handling reply.
 */

export class CmdCooldownError extends UserError {
    constructor(description: string) {
        super({title: 'Command cooldown error.', description});
    }
}

export class CmdParamsParsingError extends UserError {
    constructor(description: string) {
        super({title: 'Command parameters parsing error.', description});
    }
}

export class CmdInvalidParamsError extends UserError {
    constructor(description: string) {
        super({title: 'Invalid command parameters error.', description});
    }
}

export class CmdAccessError extends UserError {
    constructor(description: string) {
        super({title: 'Command access error.', description});
    }
}

export class BotPermissionsError extends UserError {
    constructor(description: string) {
        super({title: 'Bot permissions error.', description});
    }
}

export class NotInVoiceChannelError extends UserError {
    constructor(description: string) {
        super({title: 'Not in a voice channel error.', description});
    }
}