import Colors from 'colors/safe'; // import it only this way (https://github.com/Microsoft/TypeScript/issues/29687)
import { Service } from "typedi";
import Moment from 'moment';
import NodeUtil from 'util';

export const enum LogType {
    Time = 'Time', Info = 'Info', Error = 'Error', Warning = 'Warning'
}

/**
 * Default (development) logging server interface and implementation.
 */
@Service()
export class LoggingService {
    /**
     * Logs `msg` to the console/file/external api or any other service.
     * By default logs message to the console colored according to `logType`
     * 
     * @param logType The type of logging `msg` belongs to.
     * @param msg     Message that contains payload to be logged.
     */
    protected writeLog(logType: LogType, msg: string) {
        const colorize = this.getColorizer(logType);
        const prefix = Colors.bold(colorize(this.createMsgPrefix(logType)));
        console.log(`${prefix}${colorize(msg)}`);
    }
    /**
     * Retuns message prefix (current time with log type info by default).
     * @param logType Traget log message type this prefix es created for.
     */
    protected createMsgPrefix(logType: LogType) {
        return `${Moment().format("k:mm:ss (D.MM)")} | ${logType.toUpperCase()}: `;
    }

    private getColorizer(logType: LogType) {
        return {
            [LogType.Time]:    Colors.cyan, 
            [LogType.Info]:    Colors.blue, 
            [LogType.Error]:   Colors.red, 
            [LogType.Warning]: Colors.yellow
        }[logType];
    }

    /** 
     * Starts timer in order to measure some code performance. 
     * Returns a function that stops timer and logs given message with duration info.
     */
    time = (callSignature: string) => {
        const startTime = Date.now();
        this.writeLog(LogType.Time, `Time =>: ${callSignature}`);
        return () => {
            const elapsed = Moment.duration(Date.now() - startTime).format(
                `m [minutes], s [seconds], S [milliseconds]`
            );
            this.writeLog(LogType.Time, `Time <=: ${callSignature} runtime: ${elapsed}`);
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
    info = (payload: unknown, description = '') => {
        this.writeLog(LogType.Info, this.createLogMsg(payload, description));
    }
    
    /**
     * Autobound method.
     * Same as info(), but has warning style formatting.
     * 
     * @param payload       Vanilla object, which state needs to be logged.
     * @param description   Additional info message to be logged before `payload`.
     */
    warning = (payload: unknown, description = '') => {
        this.writeLog(LogType.Warning, this.createLogMsg(payload, description));
    }

    /**
     * Autobound method.
     * The same as info(), but if `!(payload instanceof Error)` logs additional
     * stacktrace, otherwise uses provided `Error` stacktrace of `payload`.
     * Makes program to hault execution when invoking this function with debugger.
     * 
     * @param payload     `Error` or vanilla object, which state needs to be logged.
     * @param description Additional info message to be logged before `payload`.
     */
    error = (payload: unknown, description = '') => {
        debugger;
        let msg = this.createLogMsg(payload, description);
        if (!(payload instanceof Error)) {
            msg += `\n View stacktrace: ${new Error().stack || '<stacktrace is not supported>'}`;
        }
        this.writeLog(LogType.Error, msg);
    }
    private createLogMsg(payload: unknown, description: string) {
        return `${description}${NodeUtil.inspect(payload)}`;
    }

    /**
     * Shorthand for creation error callbacks like `err => this.log.error(err, description)`
     * @param description Description to be logged alongside given error value.
     */
    createErrback(description: string) {
        return (err: unknown) => this.error(err, description);
    }
}
