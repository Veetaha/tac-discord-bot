declare module 'gifencoder' {
    import { Readable } from "stream";
    import Canvas from 'canvas';

    export interface GifEncoderOtps {
        highWaterMark?: number;
    }

    export const enum GifRepeatMode {
        RepeatInfinitely = 0,
        NoRepeat = -1
    }

    class GifEncoder {
        constructor(width: number, height: number, opts?: GifEncoderOtps);
        /**
         * Writes GIF file header
         */
        start(): void;
        /**
         * Adds final trailer to the GIF stream, if you don't call the finish method
         * the GIF stream will not be valid.
         */
        finish(): void;


        /**
         * Sets the number of times the set of GIF frames should be played.
         * -1 = play once
         * 0 = repeat indefinitely
         * Default is -1
         * Must be invoked before the first image is added
         */
        setRepeat(value: GifRepeatMode | number): void;

        /** value in ms */
        setDelay(value: number): void;

        /**
         * Sets quality of color quantization (conversion of images to the maximum 256
         * colors allowed by the GIF specification). Lower values (minimum = 1)
         * produce better colors, but slow processing significantly. 10 is the
         * default, and produces good color mapping at reasonable speeds. Values
         * greater than 20 do not yield significant improvements in speed.
         */
        setQuality(value: number): void;

        /**
         * Adds next GIF frame. The frame is not written immediately, but is
         * actually deferred until the next frame is received so that timing
         * data can be inserted.  Invoking finish() flushes all frames.
         */
        addFrame(canvasCtx2D: Canvas.CanvasRenderingContext2D): void;
        createReadStream(): Readable;
        
    }
    export default GifEncoder;
}