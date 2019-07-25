declare module 'gif-frames' {
    import * as Mir from 'multi-integer-range';
    import { Stream } from "stream";

    import { ImgFormat } from 'save-pixels';
    export { ImgFormat } from 'save-pixels';

    export interface GifFramesOpts {
        url: string;
        frames: 'all' | Mir.Initializer;
        outputType?: ImgFormat;
        /**
         * Number to use for saved image quality
         * This can only be used with a "jpeg" image
         * It range between 1 (low quality) and 100 (high quality) inclusively
         */
        quality?: number;
        cumulative?: boolean;
    }

    export interface FrameData {
        /**
         * Returns one of:
         * A drawn canvas DOM element, if options.outputType is 'canvas'
         * A data stream which can be piped to file output, otherwise
         */
        getImage(): Stream;
        /**
         * The index corresponding to the frame's position in the original GIF 
         * (not necessarily the same as the frame's position in the result array)
         */
        frameIndex: number;

        /**
         * It is an Object with metadata of the frame.
         */
        frameInfo: FrameInfo;

    }
    export interface FrameInfo {
        x: number;	                // Image Left Position
        y: number;	                // Image Top Position
        width:	number;             // Image Width
        height:	number;             // Image Height
        has_local_palette: boolean; // Image local palette presentation flag
        palette_offset: number;     // Image palette offset
        palette_size: number;       // Image palette size
        data_offset: number;        // Image data offset
        data_length: number;        // Image data length
        transparent_index: number;  // Transparent Color Index
        interlaced:	boolean;        // Interlace Flag
        delay: number;              // Delay Time (1/100ths of a second)
        disposal: number;           // Disposal method
    }


    function gifFrames(opts: GifFramesOpts): Promise<FrameData[]>;

    export default gifFrames;
}