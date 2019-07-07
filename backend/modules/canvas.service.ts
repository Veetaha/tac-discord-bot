import Canvas from 'canvas';
import { Service } from 'typedi';

@Service()
export class CanvasService {

    /**
     * Returns approximate fontsize in pixels (1px accuracy) that the given `text`
     * with the given `fontFace` should have in order to fit into a box with `maxWidth`.
     * Returned font size will never let `text` to overflow `maxWidth` even by the
     * approximation error, this method chooses to return less font size that bigger.
     * 
     * @param text     String of text to get font size for.
     * @param fontFace Font family used to display the text.
     * @param maxWidth Maximum width that the returned font size when applied to 
     *                 `text` should hit or approach (with some accuracy error), 
     *                 but never overflow.
     */
    getFontSizeToFit(text: string, fontFace: string, maxWidth: number) {
        const ctx = Canvas.createCanvas(1, 1).getContext('2d');
        const sampleSize = 100; // more may cause overflow, but may provide better accuracy
        ctx.font = `${sampleSize}px ${fontFace}`;
        const sampleWidth = ctx.measureText(text).width;
        return Math.floor(sampleSize * (maxWidth / sampleWidth));
    }
}