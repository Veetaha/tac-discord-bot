import { UserError } from "@modules/discord-cmd/errors/user-error.class";

export class UnknownCmdError extends UserError {
    constructor(cmd: string) {
        super({
            title: 'Unknown command error.', 
            description: `Command "${cmd}" was not found.`
        });
    }
}

export class EvalPermissionError extends UserError {
    constructor(description: string) {
        super({title: 'Eval permission error.', description});
    }
}