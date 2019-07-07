import Colors from 'colors/safe'; // import it only this way (https://github.com/Microsoft/TypeScript/issues/29687)
import { Service } from "typedi";
import Moment from 'moment';

@Service()
export class LoggingService {

    private logCurrentTime() {
        return process.stdout.write(Colors.bold(Colors.gray(
            `${new Date().toUTCString()} │ `
        )));
    }

    /** 
     * Starts timer in order to measure some code performance. 
     * Returns a function that stops timer and logs given message with duration info.
     */
    time = (callSignature: string) => {
        const startTime = Date.now();
        this.logCurrentTime();
        console.log(Colors.cyan(`Time begin: ${callSignature}`));
        return () => {
            const elapsed = Moment.duration(Date.now() - startTime).format(
                `m [minutes], s [seconds], S [milliseconds]`
            );
            this.logCurrentTime();
            console.log(Colors.cyan(`Time end: ${callSignature} runtime: ${elapsed}`));
        };
    }

    /**
     * Autobound method.
     * Logs current time with, optional description and detailed view on `payload` object.
     * If you have no object to view you may forward a single string message as a `payload`.
     * 
     * @param payload       Object, which state needs to be logged.
     * @param description   Additional info message to be logged before `payload`.
     */
    info = (payload: unknown, description?: string) => {
        this.logCurrentTime();
        console.log(Colors.blue(`Info: ${description || ''} `));
        console.dir(payload);
    }

    /**
     * Autobound method.
     * The same as info(), but if `!(payload instanceof Error)` logs additional
     * stacktrace, otherwise uses provided `Error` stacktrace of `payload`.
     * Makes program to hault execution when invoking this function with debugger.
     * 
     * @param payload       `Error` or vanilla object, which state needs to be logged.
     * @param description   Additional info message to be logged before `payload`.
     */
    error = (payload: unknown, description?: string) => {
        debugger;
        this.logCurrentTime();
        console.log(Colors.red(`Error: ${description || ''} `));
        if (payload instanceof Error) {
            console.error(payload);
        } else {
            console.dir(payload);
            console.error(new Error('View stacktrace'));
        }
    }

    /**
     * Autobound method.
     * Same as info(), but has warning style formatting.
     * 
     * @param payload       Vanilla object, which state needs to be logged.
     * @param description   Additional info message to be logged before `payload`.
     */
    warning = (payload: unknown, description?: string) => {
        this.logCurrentTime();
        console.log(Colors.yellow(`Warning: ${description || ''} `));
        console.dir(payload);
    }
}