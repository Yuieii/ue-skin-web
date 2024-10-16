import * as m4 from "../m4.js";
import {
    RenderData,
    SHADOW_VERTEX_ELEMENT_COUNT,
    SkinRenderer,
    VERTEX_ELEMENT_COUNT
} from "./base.js";
import { log } from "../common.js";

type WebGLContext = WebGLRenderingContext | WebGL2RenderingContext;

type WebGLShaderType = WebGLContext["VERTEX_SHADER"] | WebGLContext["FRAGMENT_SHADER"];
type WebGLVertexShader = WebGLShader;
type WebGLFragmentShader = WebGLShader;

function createShader(gl: WebGLContext, type: WebGLShaderType, source: string) {
    const handle = gl.createShader(type);
    if (!handle) throw new Error("Failed to create a handle for a new shader");

    gl.shaderSource(handle, source);
    gl.compileShader(handle);

    if (!gl.getShaderParameter(handle, gl.COMPILE_STATUS)) {
        throw new Error("Failed to compile shader: " + gl.getShaderInfoLog(handle) + "\nSource: " + source);
    }

    return handle;
}

function createProgram(gl: WebGLContext, vertexShader: WebGLVertexShader, fragShader: WebGLFragmentShader) {
    const handle = gl.createProgram();
    if (!handle) throw new Error("Failed to create a handle for a new program");

    gl.attachShader(handle, vertexShader);
    gl.attachShader(handle, fragShader);
    gl.linkProgram(handle);

    if (!gl.getProgramParameter(handle, gl.LINK_STATUS)) {
        throw new Error("Failed to link program: " + gl.getProgramInfoLog(handle));
    }

    return handle;
}

type WebGLAttribLocation = number;

export class WebGLSkinRenderer extends SkinRenderer {
    public uniforms: Map<string, WebGLUniformLocation[]>;
    public attributes: Map<string, WebGLAttribLocation[]>;
    public context?: WebGLContext;
    public program?: WebGLProgram;
    public shadowProgram?: WebGLProgram;
    public texture?: WebGLTexture;
    public vertexBuffer?: WebGLBuffer;

    constructor(skin: HTMLImageElement | string, slim: boolean) {
        super(skin, slim);

        this.uniforms = new Map<string, WebGLUniformLocation[]>();
        this.attributes = new Map<string, WebGLAttribLocation[]>();
    }

    protected override earlySetupCanvas(): void {
        super.earlySetupCanvas();

        const gl = this.canvas!.getContext("webgl2", {
            antialias: false
        });
        if (!gl) throw new Error("WebGL is not supported");
        this.context = gl;

        log("WebGLSkinRenderer", `-- Using WebGL backend --`);

        this.vertexBuffer =  gl.createBuffer()!;

        const tex = gl.createTexture()!;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE,
            new Uint8Array([
                0, 0, 0, 255,
                255, 0, 255, 255,
                255, 0, 255, 255,
                0, 0, 0, 255,
            ]));

        this.texture = tex;

        const vertexShaderSource = `#version 300 es
        in vec3 aPos;
        in vec2 aTexCoord;
        in vec3 aNormal;
        
        uniform mat4 uMatrix;

        out vec2 vTexCoord;
        out vec3 vNormal;
        
        void main() {
            gl_Position = uMatrix * vec4(aPos, 1);
            vTexCoord = aTexCoord;
            vNormal = normalize(aNormal);
        }            
        `;

        const fragShaderSource = `#version 300 es
        precision highp float;
        
        uniform sampler2D uTexture;
        uniform float uShadeMix;

        in vec2 vTexCoord;
        in vec3 vNormal;
        out vec4 outColor;

        vec3 rgb2hsv(vec3 c) {
            vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
            vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
            vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

            float d = q.x - min(q.w, q.y);
            float e = 1.0e-10;
            return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
        }

        vec3 hsv2rgb(vec3 c) {
            vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
            vec4 color = texture(uTexture, vTexCoord);
            if (color.a == .0) discard;

            float a = color.a;
            float diff = max(dot(vNormal, normalize(vec3(0, 0, 1))), 0.0);
            diff = mix(0.5, 1.05, diff);

            vec3 hsv = rgb2hsv(color.rgb);
            vec3 lightColor = hsv2rgb(mix(hsv, vec3(hsv.r, 0, 1.02), 0.9));
            vec3 darkColorHsv = mix(hsv, vec3(hsv.r, 0.8, 0.5), 0.8);
                
            // Clear the saturation if there was no saturation originally
            darkColorHsv = mix(vec3(darkColorHsv.r, 0.0, darkColorHsv.b), darkColorHsv, step(1.0e-10, hsv.g));
            vec3 darkColor = hsv2rgb(darkColorHsv);
            
            vec3 diffuse = mix(darkColor, lightColor, diff);
            vec3 lighten = diffuse * mix(color.rgb, lightColor, 0.125);
            
            outColor = mix(color, vec4(lighten, a), uShadeMix);
        }          
        `;

        const shadowVertexShaderSource = `#version 300 es
        in vec3 aPos;
        in vec2 aTexCoord;
        
        uniform mat4 uMatrix;

        out vec2 vTexCoord;
        
        void main() {
            gl_Position = uMatrix * vec4(aPos, 1);
            vTexCoord = aTexCoord;
        }
        `;

        const shadowFragShaderSource = `#version 300 es
        precision highp float;
        
        in vec2 vTexCoord;
        out vec4 outColor;
        
        void main() {
            vec2 d2 = vTexCoord - vec2(0.5, 0.5);
            float d = d2.x * d2.x + d2.y * d2.y;
            d = smoothstep(0.05, 0.25, d);

            outColor = vec4(vec3(0.0), (1.0 - d) * 0.3);
        }            
        `;

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragShaderSource);

        const program = createProgram(gl, vertexShader, fragShader);
        this.program = program;

        const shVertexShader = createShader(gl, gl.VERTEX_SHADER, shadowVertexShaderSource);
        const shFragShader = createShader(gl, gl.FRAGMENT_SHADER, shadowFragShaderSource);

        const shadowProgram = createProgram(gl, shVertexShader, shFragShader);
        this.shadowProgram = shadowProgram;

        const uniforms = this.uniforms;
        const attrs = this.attributes;

        uniforms.set("matrix", [program, shadowProgram].map(p => gl.getUniformLocation(p, "uMatrix")!));
        uniforms.set("texture", [program].map(p => gl.getUniformLocation(p, "uTexture")!));
        uniforms.set("shadeMix", [program].map(p => gl.getUniformLocation(p, "uShadeMix")!));
        attrs.set("pos", [program, shadowProgram].map(p => gl.getAttribLocation(p, "aPos")));
        attrs.set("uv", [program, shadowProgram].map(p => gl.getAttribLocation(p, "aTexCoord")));
        attrs.set("normal", [program].map(p => gl.getAttribLocation(p, "aNormal")));
    }

    protected override uploadSkinTextureData(skin: HTMLImageElement) {
        const gl = this.context!;
        const tex = this.texture!;

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.skin);

        // This is required
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    protected override render(data: RenderData) {
        const { camTx, camTy, camTz, globalTranslate, cuboids } = data;

        // Start rendering
        const canvas = this.canvas!;
        const gl = this.context!;

        const uniforms = this.uniforms;
        const attrs = this.attributes;

        const projMat = m4.perspective(60 / 180 * Math.PI, canvas.width / canvas.height, 1, 1000);
        const camMat = m4.scale(m4.lookAt([camTx, camTy, camTz], [0, 0, 0], [0, 1, 0]), -1, 1, 1);
        const viewMat = m4.inverse(camMat);
        const viewProjMat = m4.multiply(projMat, viewMat);

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const uMatrix = uniforms.get("matrix")!;
        const uShadeMix = uniforms.get("shadeMix")!;
        const uTexture = uniforms.get("texture")!;

        const posAttr = attrs.get("pos")!;
        const uvAttr = attrs.get("uv")!;
        const normalAttr = attrs.get("normal")!;

        posAttr.forEach(a => gl.enableVertexAttribArray(a));
        uvAttr.forEach(a => gl.enableVertexAttribArray(a));
        normalAttr.forEach(a => gl.enableVertexAttribArray(a));

        const vertexBuffer = this.vertexBuffer!;
        const sizeFloat = Float32Array.BYTES_PER_ELEMENT;
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        if (this.drawShadow) {
            gl.useProgram(this.shadowProgram!);

            // Matrix uniform
            gl.uniformMatrix4fv(uMatrix[1], false, m4.translate(viewProjMat, 0, 0, 0));

            const shadowSize = 24 - globalTranslate[1] / 2;
            const shSizeH = shadowSize / 2;
            const shadowY = -23;

            // Shadow
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                -shSizeH, shadowY, -shSizeH, 0, 0,
                shSizeH, shadowY, -shSizeH, 1, 0,
                -shSizeH, shadowY, shSizeH, 0, 1,

                shSizeH, shadowY, -shSizeH, 1, 0,
                -shSizeH, shadowY, shSizeH, 0, 1,
                shSizeH, shadowY, shSizeH, 1, 1,
            ]), gl.STATIC_DRAW);

            gl.vertexAttribPointer(posAttr[0], 3, gl.FLOAT, false, SHADOW_VERTEX_ELEMENT_COUNT * sizeFloat, 0);
            gl.vertexAttribPointer(uvAttr[0], 2, gl.FLOAT, false, SHADOW_VERTEX_ELEMENT_COUNT * sizeFloat, 3 * sizeFloat);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        // ---

        gl.useProgram(this.program!);

        // Matrix uniform
        gl.uniformMatrix4fv(uMatrix[0], false, m4.translate(viewProjMat, 0, 0, 0));

        // Shade?
        gl.uniform1f(uShadeMix[0], 1);

        // Texture filters
        gl.bindTexture(gl.TEXTURE_2D, this.texture!);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.uniform1i(uTexture[0], 0);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cuboids.flat(3)), gl.STATIC_DRAW);

        gl.vertexAttribPointer(posAttr[0], 3, gl.FLOAT, false, VERTEX_ELEMENT_COUNT * sizeFloat, 0);
        gl.vertexAttribPointer(uvAttr[0], 2, gl.FLOAT, false, VERTEX_ELEMENT_COUNT * sizeFloat, 3 * sizeFloat);
        gl.vertexAttribPointer(normalAttr[0], 3, gl.FLOAT, false, VERTEX_ELEMENT_COUNT * sizeFloat, 5 * sizeFloat);
        
        gl.drawArrays(gl.TRIANGLES, 0, cuboids.flat(2).length);
    }
}