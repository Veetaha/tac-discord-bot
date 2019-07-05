import Canvas from 'canvas';
import { Service } from "typedi";

export const enum ImgId {
    MemberWelcomeBg = 'assets/img/member-welcome-bg.png'
}

@Service()
export class AssetService {
    readonly images = new Map<ImgId, Canvas.Image>();

    async getImage(imgId: ImgId) {
        const cachedImage = this.images.get(imgId);
        if (cachedImage != null) return cachedImage;
        
        const image = await Canvas.loadImage(imgId);
        this.images.set(imgId, image);
        return image;
    }
}