import { clamp, createCanvasList, getPixelHex, lerp, log } from "./common.js";
export class AvatarRenderer {
    skinPath;
    skin;
    resolution;
    noGrass = false;
    constructor(skin) {
        if (typeof skin === "string") {
            this.skinPath = skin;
        }
        else if (skin instanceof Image) {
            this.skinPath = skin.src;
            this.skin = skin;
        }
        else {
            throw new Error("Invalid skin argument");
        }
        this.resolution = 512;
    }
    async createAvatarCanvas() {
        return new Promise((resolve, reject) => {
            if (this.skin) {
                if (this.skin.complete) {
                    resolve(this.createAvatarCanvasFromSkin(this.skin));
                    return;
                }
            }
            else {
                this.skin = new Image();
                this.skin.onload = () => {
                    resolve(this.createAvatarCanvasFromSkin(this.skin));
                };
                this.skin.onerror = err => {
                    var canvas = document.createElement("canvas");
                    canvas.width = canvas.height = 64;
                    var ctx = canvas.getContext("2d");
                    ctx.fillStyle = "#f0f";
                    ctx.fillRect(0, 0, 64, 64);
                    ctx.fillStyle = "#000";
                    ctx.fillRect(0, 0, 32, 32);
                    ctx.fillRect(32, 32, 32, 32);
                    // @ts-ignore
                    resolve(this.createAvatarCanvasFromSkin(canvas));
                };
                this.skin.src = this.skinPath;
            }
        });
    }
    createAvatarCanvasFromSkin(skin) {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = this.resolution;
        const ctx = canvas.getContext("2d");
        this.drawAvatar(ctx, skin);
        return canvas;
    }
    drawAvatar(ctx, skin) {
        const skinCanvas = document.createElement("canvas");
        const skinCtx = skinCanvas.getContext("2d");
        skinCtx.canvas.width = skin.width;
        skinCtx.canvas.height = skin.height;
        skinCtx.drawImage(skin, 0, 0);
        const grassData = skinCtx.getImageData(60, 0, 4, 1).data;
        let isGrass = false;
        if (!this.noGrass) {
            if (getPixelHex(grassData, 3) == 0xff3acb28 &&
                getPixelHex(grassData, 2) == 0xfff9ca8b &&
                getPixelHex(grassData, 1) == 0xffff859b) {
                isGrass = true;
                log("AvatarRenderer", `Applying grass modification for skin ${skin.src}...`);
            }
        }
        const canvasList = createCanvasList(3).map(c => {
            c.width = c.height = 8;
            return c;
        });
        const [inner, outer, outerBack] = canvasList;
        const [iCtx, oCtx, oBackCtx] = canvasList.map(c => c.getContext("2d"));
        const size = Math.min(ctx.canvas.width, ctx.canvas.height);
        const grassExtend = size / 8 * 5;
        ctx.canvas.width = size;
        ctx.canvas.height = size + (isGrass ? grassExtend : 0);
        iCtx.drawImage(skin, -8, -8);
        oCtx.drawImage(skin, -40, -8);
        oBackCtx.drawImage(skin, -56, -8);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.imageSmoothingEnabled = false;
        ctx.translate(size / 2, size / 2);
        if (isGrass) {
            ctx.translate(0, grassExtend);
        }
        const t = ctx.getTransform();
        if (isGrass) {
            const stemCanvasList = createCanvasList(4);
            const [stemCanvas, leadConnCanvas, lLeafCanvas, rLeafCanvas] = stemCanvasList;
            stemCanvas.width = 1;
            stemCanvas.height = 4;
            leadConnCanvas.width = 2;
            leadConnCanvas.height = 1;
            lLeafCanvas.width = lLeafCanvas.height = 3;
            rLeafCanvas.width = rLeafCanvas.height = 3;
            const [stemCtx, leafConnCtx, lLeafCtx, rLeafCtx] = stemCanvasList.map(c => c.getContext("2d"));
            stemCtx.drawImage(skin, -62, -42);
            leafConnCtx.drawImage(skin, -60, -40);
            lLeafCtx.drawImage(skin, -58, -32);
            rLeafCtx.drawImage(skin, -58, -36);
            const px = size / 8;
            const stemOffsetY = 3.2;
            const leafAngle = 45;
            const leafHeightMult = clamp(Math.sin(Math.PI * 2 / 360 * clamp(leafAngle, 0, 90)), 0, 1);
            const leafWidthMult = 0.75;
            const skewAmount = lerp(0.4, 0, leafHeightMult);
            ctx.drawImage(stemCanvas, -px / 2, -size / 2 - px * stemOffsetY, px, px * 4);
            ctx.drawImage(leadConnCanvas, -px, -size / 2 - px * (stemOffsetY + leafHeightMult / 2), px * 2, px * leafHeightMult);
            ctx.translate(-px, -size / 2 - px * stemOffsetY);
            ctx.transform(1, skewAmount, 0, 1, 0, 0);
            ctx.drawImage(lLeafCanvas, -px * 3 * leafWidthMult, -px * (leafHeightMult * 3 / 2), px * 3 * leafWidthMult, px * 3 * leafHeightMult);
            ctx.setTransform(t);
            ctx.translate(px, -size / 2 - px * stemOffsetY);
            ctx.transform(1, -skewAmount, 0, 1, 0, 0);
            ctx.drawImage(rLeafCanvas, 0, -px * (leafHeightMult * 3 / 2), px * 3 * leafWidthMult, px * 3 * leafHeightMult);
            ctx.setTransform(t);
        }
        ctx.scale(0.98, 0.98);
        ctx.drawImage(outerBack, -size / 2, -size / 2, size, size);
        ctx.setTransform(t);
        ctx.scale(0.9, 0.9);
        ctx.drawImage(inner, -size / 2, -size / 2, size, size);
        ctx.setTransform(t);
        ctx.drawImage(outer, -size / 2, -size / 2, size, size);
    }
}
//# sourceMappingURL=avatarRenderer.js.map