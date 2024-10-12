import { log, warn, lerp, getPixelHex, getPixel, clamp } from "../common.js";
import * as m4 from "../m4.js";

export type ArrayLengthMutationKeys = 'splice' | 'push' | 'pop' | 'shift' |  'unshift'
export type FixedLengthArray<T, L extends number, TObj = [T, ...Array<T>]> =
    Pick<TObj, Exclude<keyof TObj, ArrayLengthMutationKeys>>
    & {
    readonly length: L
    [ I : number ] : T
    [Symbol.iterator]: () => IterableIterator<T>
};

export type Vertex = [x: number, y: number, z: number, u: number, v: number, nx: number, ny: number, nz: number];
export type VertexElementCount = Vertex["length"];
export type Triangle = [a: Vertex, b: Vertex, c: Vertex] & {
    normal?: m4.Vector3
};
export type Size = [width: number, height: number, depth: number];
export type TexCoord = [u: number, v: number];
export type Cuboid = FixedLengthArray<Triangle, 12> & {
    center?: m4.Vector3
};

export interface CuboidCreateOptions {
    grassUvMod?: boolean
}

export type PoseKeys = "head" | "body" | "bodyInv" | "leftArm" | "rightArm" | "leftLeg" | "rightLeg" |
    "catTail1" | "catTail2";

export type PoseData = Record<PoseKeys, m4.Vector3>;

export const VERTEX_ELEMENT_COUNT = 8;
export const SHADOW_VERTEX_ELEMENT_COUNT = 5;

export class Bone {
    public cuboids: Cuboid[];
    public pivot: m4.Vector3;
    public rotation: m4.Vector3;
    public children: Bone[];
    private recursive?: boolean;

    constructor(cuboids: Cuboid[], pivot?: m4.Vector3, rotation?: m4.Vector3, children?: Bone[]) {
        pivot ??= [0, 0, 0];
        rotation ??= [0, 0, 0];
        children ??= [];

        this.cuboids = cuboids;
        this.pivot = pivot;
        this.rotation = rotation;
        this.children = children;
    }

    public transform(mat: m4.Matrix4x4) {
        const bone = this;
        if (bone.recursive) {
            throw new Error("Recursive bone setting detected!");
        }

        // mat ??= m4.translation(globalTranslate[0], globalTranslate[1], globalTranslate[2]);
        const [px, py, pz] = bone.pivot;
        const [rx, ry, rz] = bone.rotation;
        const cuboids = bone.cuboids;

        let matrix = m4.translate(mat, px, py, pz);
        matrix = m4.xRotate(matrix, rx);
        matrix = m4.yRotate(matrix, ry);
        matrix = m4.zRotate(matrix, rz);

        cuboids.forEach(cb => {
            const maxB = [0, 0, 0];
            const minB = [0, 0, 0];

            cb.forEach(face => {
                face.forEach(vertex => {
                    const v = [vertex[0], vertex[1], vertex[2], 1] as m4.Vector4;
                    let [x, y, z] = m4.multiplyVertex(matrix, v);
                    vertex[0] = x;
                    vertex[1] = y;
                    vertex[2] = z;

                    maxB[0] = Math.max(maxB[0], x);
                    maxB[1] = Math.max(maxB[1], y);
                    maxB[2] = Math.max(maxB[2], z);
                    minB[0] = Math.max(minB[0], x);
                    minB[1] = Math.max(minB[1], y);
                    minB[2] = Math.max(minB[2], z);
                });
            });

            cb.center = [
                (maxB[0] + minB[0]) / 2,
                (maxB[1] + minB[1]) / 2,
                (maxB[2] + minB[2]) / 2
            ];
        });

        bone.recursive = true;
        bone.children.forEach(b => b.transform(matrix));
        bone.recursive = false;
    }
}

export function createSkinVertex(x: number, y: number, z: number, u: number, v: number): Vertex {
    return [x, y, z, u / 64, v / 64, 0, 0, 0];
}

export function createCuboid([x, y, z]: m4.Vector3, [width, height, depth]: Size, [u, v]: TexCoord, dilation?: number, options?: CuboidCreateOptions): Cuboid {
    dilation ??= 0;
    options ??= {
        grassUvMod: false
    };

    const dh = dilation / 2;
    let {grassUvMod} = options;

    const result = [
        // Left
        [
            createSkinVertex(x - dh, y + height + dh, z + depth + dh, u, v + depth),
            createSkinVertex(x - dh, y - dh, z + depth + dh, u, v + depth + height),
            createSkinVertex(x - dh, y + height + dh, z - dh, u + depth, v + depth),
        ],
        [
            createSkinVertex(x - dh, y + height + dh, z - dh, u + depth, v + depth),
            createSkinVertex(x - dh, y - dh, z + depth + dh, u, v + depth + height),
            createSkinVertex(x - dh, y - dh, z - dh, u + depth, v + depth + height),
        ],

        // Front
        [
            createSkinVertex(x - dh, y + height + dh, z - dh, u + depth, v + depth),
            createSkinVertex(x - dh, y - dh, z - dh, u + depth, v + depth + height),
            createSkinVertex(x + width + dh, y + height + dh, z - dh, u + depth + width, v + depth),
        ],
        [
            createSkinVertex(x + width + dh, y + height + dh, z - dh, u + depth + width, v + depth),
            createSkinVertex(x - dh, y - dh, z - dh, u + depth, v + depth + height),
            createSkinVertex(x + width + dh, y - dh, z - dh, u + depth + width, v + depth + height),
        ],

        // Back
        [
            createSkinVertex(x - dh, y + height + dh, z + depth + dh, u + depth * 2 + width * 2, v + depth),
            createSkinVertex(x + width + dh, y + height + dh, z + depth + dh, u + depth * 2 + width, v + depth),
            createSkinVertex(x - dh, y - dh, z + depth + dh, u + depth * 2 + width * 2, v + depth + height),
        ],
        [
            createSkinVertex(x + width + dh, y + height + dh, z + depth + dh, u + depth * 2 + width, v + depth),
            createSkinVertex(x + width + dh, y - dh, z + depth + dh, u + depth * 2 + width, v + depth + height),
            createSkinVertex(x - dh, y - dh, z + depth + dh, u + depth * 2 + width * 2, v + depth + height),
        ],

        // Right
        [
            createSkinVertex(x + width + dh, y + height + dh, z + depth + dh, u + depth + width + depth, v + depth),
            createSkinVertex(x + width + dh, y + height + dh, z - dh, u + depth + width, v + depth),
            createSkinVertex(x + width + dh, y - dh, z + depth + dh, u + depth + width + depth, v + depth + height),
        ],
        [
            createSkinVertex(x + width + dh, y + height + dh, z - dh, u + depth + width, v + depth),
            createSkinVertex(x + width + dh, y - dh, z - dh, u + depth + width, v + depth + height),
            createSkinVertex(x + width + dh, y - dh, z + depth + dh, u + depth + width + depth, v + depth + height),
        ],

        // Top
        [
            createSkinVertex(x - dh, y + height + dh, z + depth + dh, u + (grassUvMod ? 0 : depth), v),
            createSkinVertex(x - dh, y + height + dh, z - dh, u + (grassUvMod ? 0 : depth), v + depth),
            createSkinVertex(x + width + dh, y + height + dh, z + depth + dh, u + (grassUvMod ? 0 : depth) + width, v),
        ],
        [
            createSkinVertex(x - dh, y + height + dh, z - dh, u + (grassUvMod ? 0 : depth), v + depth),
            createSkinVertex(x + width + dh, y + height + dh, z - dh, u + (grassUvMod ? 0 : depth) + width, v + depth),
            createSkinVertex(x + width + dh, y + height + dh, z + depth + dh, u + (grassUvMod ? 0 : depth) + width, v),
        ],

        // Bottom
        [
            createSkinVertex(x - dh, y - dh, z + depth + dh, u + width + depth, v),
            createSkinVertex(x + width + dh, y - dh, z + depth + dh, u + width + depth + width, v),
            createSkinVertex(x - dh, y - dh, z - dh, u + width + depth, v + depth),
        ],
        [
            createSkinVertex(x - dh, y - dh, z - dh, u + width + depth, v + depth),
            createSkinVertex(x + width + dh, y - dh, z + depth + dh, u + width + depth + width, v),
            createSkinVertex(x + width + dh, y - dh, z - dh, u + width + depth + width, v + depth),
        ]
    ] as Cuboid;

    result.center = [
        x + width / 2,
        y + height / 2,
        z + depth / 2
    ];
    return result;
}

export function createCuboidMirrored([x, y, z]: m4.Vector3, [width, height, depth]: Size, [u, v]: TexCoord, dilation?: number, options?: CuboidCreateOptions): Cuboid {
    dilation ??= 0;
    options ??= {
        grassUvMod: false
    };

    const dh = dilation / 2;
    const { grassUvMod } = options;
    const grassModU = u + (grassUvMod ? 0 : depth);

    const result = [
        // Left
        [
            createSkinVertex(x - dh, y + height + dh, z + depth + dh, u + depth + width + depth, v + depth),
            createSkinVertex(x - dh, y - dh, z + depth + dh, u + depth + width + depth, v + depth + height),
            createSkinVertex(x - dh, y + height + dh, z - dh, u + depth + width, v + depth),
        ],
        [
            createSkinVertex(x - dh, y + height + dh, z - dh, u + depth + width, v + depth),
            createSkinVertex(x - dh, y - dh, z + depth + dh, u + depth + width + depth, v + depth + height),
            createSkinVertex(x - dh, y - dh, z - dh, u + depth + width, v + depth + height),
        ],

        // Front
        [
            createSkinVertex(x - dh, y + height + dh, z - dh, u + depth + width, v + depth),
            createSkinVertex(x - dh, y - dh, z - dh, u + depth + width, v + depth + height),
            createSkinVertex(x + width + dh, y + height + dh, z - dh, u + depth, v + depth),
        ],
        [
            createSkinVertex(x + width + dh, y + height + dh, z - dh, u + depth, v + depth),
            createSkinVertex(x - dh, y - dh, z - dh, u + depth + width, v + depth + height),
            createSkinVertex(x + width + dh, y - dh, z - dh, u + depth, v + depth + height),
        ],

        // Back
        [
            createSkinVertex(x - dh, y + height + dh, z + depth + dh, u + depth * 2 + width, v + depth),
            createSkinVertex(x + width + dh, y + height + dh, z + depth + dh, u + depth * 2 + width * 2, v + depth),
            createSkinVertex(x - dh, y - dh, z + depth + dh, u + depth * 2 + width, v + depth + height),
        ],
        [
            createSkinVertex(x + width + dh, y + height + dh, z + depth + dh, u + depth * 2 + width * 2, v + depth),
            createSkinVertex(x + width + dh, y - dh, z + depth + dh, u + depth * 2 + width * 2, v + depth + height),
            createSkinVertex(x - dh, y - dh, z + depth + dh, u + depth * 2 + width, v + depth + height),
        ],

        // Right
        [
            createSkinVertex(x + width + dh, y + height + dh, z + depth + dh, u, v + depth),
            createSkinVertex(x + width + dh, y + height + dh, z - dh, u + depth, v + depth),
            createSkinVertex(x + width + dh, y - dh, z + depth + dh, u, v + depth + height),
        ],
        [
            createSkinVertex(x + width + dh, y + height + dh, z - dh, u + depth, v + depth),
            createSkinVertex(x + width + dh, y - dh, z - dh, u + depth, v + depth + height),
            createSkinVertex(x + width + dh, y - dh, z + depth + dh, u, v + depth + height),
        ],

        // Top
        [
            createSkinVertex(x - dh, y + height + dh, z + depth + dh, grassModU + width, v),
            createSkinVertex(x - dh, y + height + dh, z - dh, grassModU + width, v + depth),
            createSkinVertex(x + width + dh, y + height + dh, z + depth + dh, grassModU, v),
        ],
        [
            createSkinVertex(x - dh, y + height + dh, z - dh, grassModU + width, v + depth),
            createSkinVertex(x + width + dh, y + height + dh, z - dh, grassModU, v + depth),
            createSkinVertex(x + width + dh, y + height + dh, z + depth + dh, grassModU, v),
        ],

        // Bottom
        [
            createSkinVertex(x - dh, y - dh, z + depth + dh, u + width + depth, v),
            createSkinVertex(x + width + dh, y - dh, z + depth + dh, u + width + depth + width, v),
            createSkinVertex(x - dh, y - dh, z - dh, u + width + depth, v + depth),
        ],
        [
            createSkinVertex(x - dh, y - dh, z - dh, u + width + depth, v + depth),
            createSkinVertex(x + width + dh, y - dh, z + depth + dh, u + width + depth + width, v),
            createSkinVertex(x + width + dh, y - dh, z - dh, u + width + depth + width, v + depth),
        ]
    ] as Cuboid;

    result.center = [
        x + width / 2,
        y + height / 2,
        z + depth / 2
    ];
    return result;
}

export enum PoseType {
    Walk,
    LookAtMouseCursor,
    BackLookAtMouseCursor,
}

export interface SkinRendererInit {
    slim: boolean,
    drawShadow: boolean
}

export abstract class SkinRenderer {
    // public uniforms: Record<string, WebGLUniformLocation>;
    // public attributes: Record<string, WebGLAttribLocation>;
    public isSlim: boolean;
    public skinPath: string;
    public skin: HTMLImageElement;
    public noGrass: boolean;
    public noEeveeEars: boolean;
    public noCatEars: boolean;
    public noCatTail: boolean;
    public noAnim: boolean;
    public isGrass: boolean;
    public isEeveeEars: boolean;
    public isCatEars: boolean;
    public isCatTail: boolean;
    public modifyInnerHead: boolean;
    public modifyOuterHead: boolean;
    public seed: number;
    public canvas?: HTMLCanvasElement;
    // public context?: WebGLContext;
    // public program?: WebGLProgram;
    // public texture?: WebGLTexture;
    // public vertexBuffer?: WebGLBuffer;
    public poseType = PoseType.Walk;
    public mousePos: [x: number, y: number] = [0, 0];
    public mousePosO: [x: number, y: number] | null = null;
    public mousePosRaw: [x: number, y: number] = [0, 0];

    constructor(skin: HTMLImageElement | string, slim: boolean) {
        this.isSlim = slim;
        if (typeof skin === "string") {
            this.skinPath = skin;

            const img = new Image();
            img.src = skin;
            this.skin = img;
        } else if (skin instanceof HTMLImageElement) {
            this.skinPath = skin.src;
            this.skin = skin;
        } else {
            throw new Error("Invalid skin argument");
        }

        this.noAnim = false;

        this.noGrass = false;
        this.isGrass = false;

        this.noEeveeEars = false;
        this.isEeveeEars = false;

        // Since: Cat update (v1.1.6)
        this.noCatEars = false;
        this.isCatEars = false;

        this.noCatTail = false;
        this.isCatTail = false;

        this.modifyInnerHead = false;
        this.modifyOuterHead = false;

        const size = 20480;
        this.seed = (Math.random() - 0.5) * 2 * size;
    }

    public parseTexture() {
        const skin = this.skin;
        if (skin.width != 64 && skin.height != 64) {
            warn("SkinParse", `Bad skin dimension! (${skin.width}, ${skin.height}) Expecting 64x64.`);
            return;
        }

        const skinCanvas = document.createElement("canvas");
        const skinCtx = skinCanvas.getContext("2d")!;
        skinCtx.canvas.width = skin.width;
        skinCtx.canvas.height = skin.height;
        skinCtx.drawImage(skin, 0, 0);

        const grassData = skinCtx.getImageData(60, 0, 4, 1).data;
        let isGrass = false;

        let modifyInnerHead = false;
        let modifyOuterHead = false;
        let validModifier = true;

        if (getPixelHex(grassData, 3) == 0xff3acb28 &&
            getPixelHex(grassData, 2) == 0xfff9ca8b &&
            getPixelHex(grassData, 1) == 0xffff859b) {
            
            isGrass = true;
            log("SkinParse", `Identified valid grass skin: ${skin.src}`);

            const modifier = getPixel(grassData, 0);
            if (modifier[3] == 0xff && modifier[0] == 0xff) {
                if (modifier[1] == 0xfe) {
                    log("SkinParse", `Will modify inner head UV for this skin`);
                    modifyInnerHead = true;
                } else {
                    validModifier = modifier[1] == 0xff;
                }

                if (modifier[2] == 0xfe) {
                    log("SkinParse", `Will modify outer head UV for this skin`);
                    modifyOuterHead = true;
                } else {
                    validModifier = validModifier && modifier[2] == 0xff;
                }
            }

            const catEarsPixel = skinCtx.getImageData(62, 1, 1, 1).data;
            if (getPixelHex(catEarsPixel, 0) == 0xffdb9c3e) {
                log("SkinParse", `Identified valid cat ears skin: ${skin.src}`);
                this.isCatEars = true;
            }

            const catTailPixel = skinCtx.getImageData(63, 1, 1, 1).data;
            if (getPixelHex(catTailPixel, 0) == 0xff987b54) {
                log("SkinParse", `Identified valid cat tail skin: ${skin.src}`);
                this.isCatTail = true;
            }
        } else if (getPixelHex(grassData, 3) == 0xff51280c &&
            getPixelHex(grassData, 2) == 0xffc5a068 &&
            getPixelHex(grassData, 1) == 0xffd8c5a1) {
            this.isEeveeEars = true;
            log("SkinParse", `Identified valid eevee ears skin: ${skin.src}`);
        }

        this.isGrass = isGrass;
        this.modifyInnerHead = modifyInnerHead && validModifier;
        this.modifyOuterHead = modifyOuterHead && validModifier;
    }

    public async createCanvas(): Promise<HTMLCanvasElement> {
        const canvas = document.createElement("canvas");
        this.canvas = canvas;

        this.earlySetupCanvas();

        const loadTexture = () => {
            requestAnimationFrame(() => {
                this.parseTexture();
                log("SkinRenderer", "Uploading texture data: " + this.skin.src);
                this.uploadSkinTextureData(this.skin);
            });
        };

        if (this.skin.complete) {
            loadTexture();
        } else {
            this.skin.onload = () => loadTexture();
        }

        document.addEventListener("mousemove", ev => {
            const x = ev.clientX;
            const y = ev.clientY;
            this.mousePosRaw = [x, y];
        });

        document.addEventListener("touchmove", ev => {
            const x = ev.touches[0].clientX;
            const y = ev.touches[0].clientY;
            this.mousePosRaw = [x, y];
        });

        const mrf = () => {
            const rect = this.canvas!.getBoundingClientRect();
            let [x, y] = this.mousePosRaw;
            x = (x - rect.left - rect.width / 2 - document.documentElement.scrollLeft) / (rect.width / 2);
            y = 1 - (y - rect.top - document.documentElement.scrollTop) / rect.height * 2;
            y += -0.2;
            this.mousePos = [x, y];

            if (this.mousePosO == null) {
                this.mousePosO = [x, y];
            } else {
                const pg = 0.15;
                this.mousePosO = [
                    lerp(this.mousePosO[0], x, pg),
                    lerp(this.mousePosO[1], y, pg),
                ];
            }
        };
        setInterval(() => mrf(), 16);
        return canvas;
    }

    protected abstract uploadSkinTextureData(skin: HTMLImageElement): void;

    protected earlySetupCanvas(): void {

    }

    public update() {
        const animDuration = 250; // 180;
        let camTx = 0;
        let camTy = 24;
        let camTz = -50;
        const globalTranslate: [number, number, number] = [0, 0, 0];

        function transformBone(bone: Bone, mat?: m4.Matrix4x4) {
            mat ??= m4.translation(globalTranslate[0], globalTranslate[1], globalTranslate[2]);
            bone.transform(mat);
        }

        function createBone(cuboids: Cuboid[], pivot?: m4.Vector3, rotation?: m4.Vector3, children?: Bone[]): Bone {
            pivot ??= [0, 0, 0];
            rotation ??= [0, 0, 0];
            children ??= [];
            return new Bone(cuboids, pivot, rotation, children);
        }

        const yOffset = -20;
        let pose = {
            head: [0, 0, 0],
            body: [0, 0, 0],
            bodyInv: [0, 0, 0],
            leftArm: [0, 0, 0],
            rightArm: [0, 0, 0],
            leftLeg: [0, 0, 0],
            rightLeg: [0, 0, 0],
            catTail1: [-45 * Math.PI / 180, 0, 0],
            catTail2: [-45 * Math.PI / 180, 0, 0]
        } as PoseData;

        // Smoothstep function
        // The result gets "steppier" if the i is larger.
        const fn = (n: number, i?: number) => {
            i ??= 1;
            let a = 0;
            let b = 0;

            const f = Math.floor(i);
            const c = Math.ceil(i);

            for (var j = 0; j < f; j++) {
                n = n * n * (3 - 2 * n);
            }
            a = n;
            if (f == c) return a;

            for (var j = f; j < c; j++) {
                n = n * n * (3 - 2 * n);
            }
            b = n;

            return lerp(a, b, i - f);
        };

        if (this.poseType == PoseType.Walk) {
            const anim = this.noAnim ? -Math.PI / 4 : lerp(-1, 1, fn(Math.sin(this.seed + performance.now() / animDuration) / 2 + 0.5, 0.25)) * Math.PI / 2.5;
            const headAnim = this.noAnim ? -Math.PI / 4 : lerp(-1, 1, fn(Math.sin(this.seed + performance.now() / animDuration * 2) / 2 + 0.5, 0.25)) * Math.PI / 2.5;
            const bodyRotY = anim * 0.125;

            pose = {
                head: [-headAnim * 0.25 + 0.25, anim * 0.125, 0],
                body: [0, bodyRotY, 0],
                bodyInv: [0, -bodyRotY, 0],
                leftArm: [anim, 0, 0],
                rightArm: [-anim, 0, 0],
                leftLeg: [-anim, 0, 0],
                rightLeg: [anim, 0, 0],
                catTail1: [-65 * Math.PI / 180 - headAnim * 0.125, 0, 0],
                catTail2: [-45 * Math.PI / 180 - headAnim * 0.125, 0, 0],
            } as PoseData;

            const walkAnim = this.noAnim ? 0 : lerp(0, 1, Math.abs(Math.sin(this.seed + performance.now() / animDuration))) * Math.PI;
            globalTranslate[1] = walkAnim * 2;

            // var angle = (this.noAnim ? 195 : (Math.sin(performance.now() / 1000 * 160 / animDuration) * 30 + 180)) * Math.PI / 180;
            const angle = ((performance.now() / 1000 - 3) * 16 / 180 + 1) * Math.PI;
            camTx = Math.sin(angle) * 50;
            camTz = Math.cos(angle) * 50;
        } else if (this.poseType == PoseType.LookAtMouseCursor || this.poseType == PoseType.BackLookAtMouseCursor) {
            let [mx, my] = this.mousePosO ?? [0, 0];
            const yaw = fn(clamp((mx / 12 + 1) / 2, 0, 1), 2.5);
            const pitch = fn(clamp((my / 12 + 1) / 2, 0, 1), 2.5);
            const xRot = lerp(-Math.PI / 2.25, Math.PI / 2.25, pitch);
            const yRot = lerp(Math.PI / 2.25, -Math.PI / 2.25, yaw);
            const bodyXRot = xRot; // Math.min(0, xRot);

            pose.head = [xRot / 1.5, yRot / 1.5, 0];
            pose.body = [bodyXRot, yRot / 2 + (this.poseType == PoseType.BackLookAtMouseCursor ? Math.PI : 0), 0];
            pose.bodyInv = [-bodyXRot, -yRot / 2, 0];
            camTy = 12;
        } else {
            warn("SkinRenderer", `Unknown pose type: ${this.poseType} (${PoseType[this.poseType]})`);
        }

        let headBone: Bone;
        let bodyBone: Bone;

        const outerDilation = 0.5;
        const bones = [
            bodyBone = createBone([
                // Body (inner / outer)
                createCuboid([-4, 0, -2], [8, 12, 4], [16, 16], 0.01),
                createCuboid([-4, 0, -2], [8, 12, 4], [16, 32], 0.01 + outerDilation)
            ], [0, yOffset + 12, 0], pose.body, [
                headBone = createBone([
                    // Head (inner / outer)
                    createCuboid([-4, 0, -4], [8, 8, 8], [0, 0], 0, {grassUvMod: !this.noGrass && this.modifyInnerHead}),
                    createCuboid([-4, 0, -4], [8, 8, 8], [32, 0], outerDilation * 2, {grassUvMod: !this.noGrass && this.modifyOuterHead})
                ], [0, 12, 0], pose.head),

                createBone([
                    // Left arm (inner / outer)
                    createCuboid([-2, -12, -2], [this.isSlim ? 3 : 4, 12, 4], [40, 16], 0),
                    createCuboid([-2, -12, -2], [this.isSlim ? 3 : 4, 12, 4], [40, 32], outerDilation),
                ], [this.isSlim ? -5 : -6, 12, 0], pose.leftArm),

                createBone([
                    // Right arm (inner / outer)
                    createCuboid([-2, -12, -2], [this.isSlim ? 3 : 4, 12, 4], [32, 48], 0),
                    createCuboid([-2, -12, -2], [this.isSlim ? 3 : 4, 12, 4], [48, 48], outerDilation),
                ], [6, 12, 0], pose.rightArm),

                createBone([], [-2, 0, 0], pose.bodyInv, [
                    createBone([
                        // Left leg (inner / outer)
                        createCuboid([-2, -12, -2], [4, 12, 4], [0, 16], 0),
                        createCuboid([-2, -12, -2], [4, 12, 4], [0, 32], outerDilation),
                    ], [0, 0, 0], pose.leftLeg),
                ]),

                createBone([], [2, 0, 0], pose.bodyInv, [
                    createBone([
                        // Right leg (inner / outer)
                        createCuboid([-2, -12, -2], [4, 12, 4], [16, 48], 0),
                        createCuboid([-2, -12, -2], [4, 12, 4], [0, 48], outerDilation),
                    ], [0, 0, 0], pose.rightLeg)
                ]),
            ]),
        ];

        if (!this.noGrass && this.isGrass) {
            headBone.children.push(
                createBone([
                    // Stem
                    createCuboid([-0.5, 0, -0.5], [1, 4, 0], [62, 42], 0.001)
                ], [0, 8, 0], [0, 0, 0], [
                    createBone([
                        // Connection
                        createCuboid([-1, -0.5, 0], [2, 1, 0], [60, 40], 0.001)
                    ], [0, 4, -0.5], [37.5 * Math.PI / 180, 0, 0], [
                        createBone([
                            // Left leaf
                            createCuboid([-3, -1.5, 0], [3, 3, 0], [58, 32], 0.01)
                        ], [-1, 0, 0], [0, -17.5 * Math.PI / 180, 0]),
                        createBone([
                            // Right leaf
                            createCuboid([0, -1.5, 0], [3, 3, 0], [58, 36], 0.01)
                        ], [1, 0, 0], [0, 17.5 * Math.PI / 180, 0])
                    ])
                ])
            );
        }

        if (!this.noEeveeEars && this.isEeveeEars) {
            headBone.children.push(
                createBone([
                    // Right ear
                    createCuboidMirrored([2 - 4, 1, -0.5], [2, 5, 1], [58, 19]),
                    createCuboidMirrored([0 - 4, 1, -0.5], [2, 5, 1], [58, 27]),
                    createCuboidMirrored([1 - 4, 0, -0.5], [3, 1, 1], [56, 38]),
                    createCuboidMirrored([0 - 4, 7, -0.5], [2, 1, 1], [58, 35]),
                    createCuboidMirrored([0 - 4, 6, -0.5], [3, 1, 1], [56, 41]),
                ], [-1.5, 7, 0], [12.5 * Math.PI / 180, 7.5 * Math.PI / 180, 17.5 * Math.PI / 180]),

                createBone([
                    // Left ear
                    createCuboid([0, 1, -0.5], [2, 5, 1], [58, 19]),
                    createCuboid([2, 1, -0.5], [2, 5, 1], [58, 27]),
                    createCuboid([0, 0, -0.5], [3, 1, 1], [56, 38]),
                    createCuboid([2, 7, -0.5], [2, 1, 1], [58, 35]),
                    createCuboid([1, 6, -0.5], [3, 1, 1], [56, 41]),
                ], [1.5, 7, 0], [12.5 * Math.PI / 180, -7.5 * Math.PI / 180, -17.5 * Math.PI / 180])
            );
        }

        // Since: Cat update (v1.1.6)
        if (!this.noCatEars && this.isCatEars) {
            headBone.children.push(
                createBone([], [0, 8, -1], [0, 0, 0], [
                    createBone([
                        createCuboid([0, 0, 0], [3, 2, 1], [56, 18])
                    ], [-4, 0, 0]),
                    createBone([
                        createCuboidMirrored([0, 0, 0], [3, 2, 1], [56, 18])
                    ], [1, 0, 0])
                ])
            );
        }

        if (!this.noCatTail && this.isCatTail) {
            bodyBone.children.push(
                createBone([
                    createCuboid([0, -8, 0], [1, 8, 1], [56, 22])   
                ], [-0.5, 0.8, 0.75], pose.catTail1, [
                    createBone([
                        createCuboid([0, -8, 0], [1, 8, 1], [60, 22])
                    ], [0, -8, 0], pose.catTail2)
                ])
            );
        }

        const allBones = [] as Bone[];

        function addBonesToList(bone: Bone) {
            allBones.push(bone);
            bone.children.forEach(b => addBonesToList(b));
        }

        bones.forEach(b => {
            transformBone(b);
            addBonesToList(b);
        });

        var cuboids = allBones.flatMap(b => b.cuboids);

        function prepareCuboids(cuboids: Cuboid[]) {
            function centerOfFace(face: Triangle): m4.Vector3 {
                const vectorA = face[0];
                const vectorB = face[1];
                const vectorC = face[2];

                const centerX = ((vectorA[0] + vectorB[0] + vectorC[0]) / 3);
                const centerY = ((vectorA[1] + vectorB[1] + vectorC[1]) / 3);
                const centerZ = ((vectorA[2] + vectorB[2] + vectorC[2]) / 3);

                return [centerX, centerY, centerZ];
            }

            function dist(a: m4.Vector3, b: m4.Vector3): number {
                return Math.sqrt(
                    Math.pow(a[0] - b[0], 2) +
                    Math.pow(a[1] - b[1], 2) +
                    Math.pow(a[2] - b[2], 2)
                );
            }

            // Z-sort all faces (triangles) in cuboids
            cuboids.forEach((cube: Cuboid) => {
                cube.sort((a: Triangle, b: Triangle) => {
                    const ca = centerOfFace(a);
                    const cb = centerOfFace(b);
                    const camPos = [camTx, camTy, camTz] as m4.Vector3;
                    return dist(camPos, cb) - dist(camPos, ca);
                });
            });

            // Z-sort all cuboids in the model
            cuboids.sort((a: Cuboid, b: Cuboid) => {
                const ca = a.center!;
                const cb = b.center!;
                const camPos = [camTx, 0, camTz] as m4.Vector3;
                return dist(camPos, cb) - dist(camPos, ca);
            });

            // Calculate the normal of each triangles
            cuboids.forEach((c: Cuboid) => {
                c.forEach((face: Triangle) => {
                    // Deconstruct the triangle into 3 vertices.
                    let [v1, v2, v3] = face;

                    // We need them casted into m4.Vector3 in order to pass these into m4 functions
                    let p1 = v1 as unknown as m4.Vector3;
                    let p2 = v2 as unknown as m4.Vector3;
                    let p3 = v3 as unknown as m4.Vector3;

                    // These operations produces a new array containing 3 elements (x, y, z).
                    let a = m4.subtractVectors(p2, p1);
                    let b = m4.subtractVectors(p3, p1);
                    let n = face.normal = m4.cross(a, b);

                    function setNormal(p: Vertex, normal: m4.Vector3) {
                        // Vertex layout: x, y, z, u, v, nx, ny, nz
                        //         Index: 0, 1, 2, 3, 4, 5,  6,  7
                        p.splice(5);
                        Array.prototype.push.apply(p, normal);

                        // p[5] = normal[0];
                        // p[6] = normal[1];
                        // p[7] = normal[2];
                    }

                    // Assign the calculated normal back to the vertex
                    setNormal(v1, n);
                    setNormal(v2, n);
                    setNormal(v3, n);
                });
            });
        }
        prepareCuboids(cuboids);

        // Start rendering
        this.render({ camTx, camTy, camTz, globalTranslate, cuboids });
    }

    protected abstract render(data: RenderData): void;
}

export interface RenderData {
    camTx: number;
    camTy: number;
    camTz: number;
    globalTranslate: [number, number, number];
    cuboids: Cuboid[]
}