import Canvas from 'canvas';
import { Service } from 'typedi';

export interface Circle {
    readonly x: number;
    readonly y: number;
    readonly radius: number;
}
export interface DrawImgInCircleOpts {
    ctx: Canvas.CanvasRenderingContext2D;
    img: Canvas.Image;
    circle: Circle;
}
export interface DrawTextMaxFontOpts {
    ctx: Canvas.CanvasRenderingContext2D;
    text: string;
    fontFace: string;
    width: number;
    x: number;
    y: number;
}


@Service()
export class CanvasService {

    /**
     * Returns approximate fontsize in pixels (1px accuracy) that the given `text`
     * with the given `fontFace` should have in order to fit into a box with `maxWidth`.
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

    drawImgInCircle({ctx, circle, img}: DrawImgInCircleOpts) {
        ctx.save();
        ctx.beginPath();
            ctx.arc(
                circle.x + circle.radius, 
                circle.y + circle.radius, 
                circle.radius,
                0, 
                2 * Math.PI, 
                true
            );
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(img, circle.x, circle.y, 2 * circle.radius, 2 * circle.radius); 
        ctx.restore();
    }

    drawTextMaxFont({ctx, fontFace, text, width, x, y}: DrawTextMaxFontOpts) {
        const fontSize = this.getFontSizeToFit(text, fontFace, width);
        ctx.font = `${fontSize}px ${fontFace}`;
        ctx.fillText(text, x, y); 
    }
}