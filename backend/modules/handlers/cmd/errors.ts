import { UserError } from "@modules/discord/errors/user-error.class";

export class UnknownCmdError extends UserError {
    constructor(description: string) {
        super({title: 'Unknown command error.', description});
    }
}

export class EvalPermissionError extends UserError {
    constructor(description: string) {
        super({title: 'Eval permission error.', description});
    }
}

// export class FetchError extends UserError {
//     constructor(description: string) {
//         super({title: 'Fetch error.', description});
//     }
// }