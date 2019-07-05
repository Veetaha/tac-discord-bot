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
        let lo = 1;
        let hi = maxWidth;
        while (lo < hi) {
            const mid = Math.floor((lo + hi) / 2);
            ctx.font = `${mid}px ${fontFace}`;
            const midWidth = ctx.measureText(text).width;
            if (maxWidth === midWidth) return mid;
            if (midWidth > maxWidth) hi = mid - 1;
            else lo = mid + 1;
        }
        ctx.font = `${hi}px ${fontFace}`;
        return ctx.measureText(text).width <= maxWidth ? hi : hi - 1;
    }
}