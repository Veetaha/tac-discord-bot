declare module 'save-pixels' {
    import { Readable } from 'stream';
    import Ndarr from 'ndarray';

    export const enum ImgFormat {
        Jpeg   = 'jpeg',
        Gif    = 'gif',
        Png    = 'png',
        Canvas = 'canvas' // only for browser
    }

    export interface SavePixelsOpts {
        /**
         * Number to use for saved image quality
         * This can only be used with a "jpeg" image
         * It range between 1 (low quality) and 100 (high quality) inclusively
         */
        quality: number;
    }

    function savePixels(
        pixels: Ndarr<number>, type: ImgFormat, opts?: SavePixelsOpts
    ): Readable;
    export default savePixels;
}