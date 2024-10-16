import * as m4 from "../m4.js";
import { RenderData, SHADOW_VERTEX_ELEMENT_COUNT, SkinRenderer, VERTEX_ELEMENT_COUNT } from "./base.js";
import { log } from "../common.js";

export class WebGPUSkinRenderer extends SkinRenderer {
    public vertexUniformBuffer: GPUBuffer = null!;
    public fragmentUniformBuffer: GPUBuffer = null!;
    public context: GPUCanvasContext = null!;
    public device: GPUDevice = null!;
    public gpu: GPU = null!;
    // public program?: WebGLProgram;
    public sampler: GPUSampler = null!;
    public texture: GPUTexture = null!;
    public depthTexture: GPUTexture = null!;
    public pipeline: GPURenderPipeline = null!;
    public shadowPipeline: GPURenderPipeline = null!;
    public vertexBindGroup: GPUBindGroup = null!;
    public fragmentBindGroupLayout: GPUBindGroupLayout = null!;
    public fragmentBindGroup: GPUBindGroup = null!;
    public vertexBuffer: GPUBuffer = null!;

    public shadowFragmentBindGroupLayout: GPUBindGroupLayout = null!;
    public shadowFragmentBindGroup: GPUBindGroup = null!;

    private deviceReadyPromise: Promise<void>;

    constructor(skin: HTMLImageElement | string, slim: boolean) {
        super(skin, slim);
        this.deviceReadyPromise = this.createDevice();
    }

    private async createDevice(): Promise<void> {
        const gpu = navigator.gpu;
        const adapter = await gpu?.requestAdapter();
        const device = await adapter?.requestDevice();

        if (!gpu || !device || !adapter) {
            throw new Error("WebGPU is not supported");
        }

        const info = await adapter.requestAdapterInfo();
        log("WebGPUSkinRenderer", `-- Using WebGPU backend --`);

        this.gpu = gpu;
        this.device = device;

        device.lost.then(info => {
            this.handleDeviceLost(info);
        });

        this.context.configure({
            device,
            format: gpu.getPreferredCanvasFormat(),
            alphaMode: "premultiplied"
        });

        await this.createDeviceResources();
    }

    private async createDeviceResources(): Promise<void> {
        const gpu = this.gpu;
        const device = this.device;
        const tex = device.createTexture({
            format: "rgba8unorm",
            size: [2, 2],
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
        });

        device.queue.writeTexture({
            texture: tex,
        }, new Uint8Array([
              0,   0,   0, 255,
            255,   0, 255, 255,
            255,   0, 255, 255,
              0,   0,   0, 255,
        ]), {
            bytesPerRow: 8
        }, [2, 2]);

        this.texture = tex;

        const shaderSource = /* wgsl */`
            struct VSIn {
                @location(0) pos: vec3f,
                @location(1) texCoord: vec2f,
                @location(2) normal: vec3f,
            };
            
            struct VertexUniforms {
                matrix: mat4x4f,
            };
            
            struct FragmentUniforms {
                shadeMix: f32,
            };
            
            @group(0) @binding(0) var<uniform> uv: VertexUniforms;
            @group(1) @binding(0) var<uniform> uf: FragmentUniforms;
            @group(1) @binding(1) var kSampler: sampler;
            @group(1) @binding(2) var kTexture: texture_2d<f32>; 
            
            struct VSOut {
                @builtin(position) pos: vec4f,
                @location(0) texCoord: vec2f,
                @location(1) normal: vec3f,
            };
            
            @vertex fn vsMain(v: VSIn) -> VSOut {
                var vsOut: VSOut;
                vsOut.pos = uv.matrix * vec4f(v.pos, 1);
                vsOut.texCoord = v.texCoord;
                vsOut.normal = normalize(v.normal);
                return vsOut;
            }
            
            fn rgb2hsv(c: vec3f) -> vec3f {
                var K = vec4f(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
                var p = mix(vec4f(c.bg, K.wz), vec4f(c.gb, K.xy), step(c.b, c.g));
                var q = mix(vec4f(p.xyw, c.r), vec4f(c.r, p.yzx), step(p.x, c.r));
    
                var d = q.x - min(q.w, q.y);
                var e = 1.0e-10;
                return vec3f(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
            }
            
            fn hsv2rgb(c: vec3f) -> vec3f {
                var K = vec4f(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                var p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, vec3f(0.0), vec3f(1.0)), c.y);
            }
            
            @fragment fn fsMain(v: VSOut) -> @location(0) vec4f {
                var color = textureSample(kTexture, kSampler, v.texCoord);
                if (color.a == .0) {
                    discard;
                }
                
                var a = color.a;
                var diff = max(dot(v.normal, normalize(vec3f(0, 0, 1))), 0);
                diff = mix(0.5, 1.05, diff);
                
                var hsv = rgb2hsv(color.rgb);
                var lightColor = hsv2rgb(mix(hsv, vec3f(hsv.r, 0, 1.02), 0.9));
                var darkColorHsv = mix(hsv, vec3f(hsv.r, 0.8, 0.5), 0.8);
                
                // Clear the saturation if there was no saturation originally
                darkColorHsv = mix(vec3f(darkColorHsv.r, 0.0, darkColorHsv.b), darkColorHsv, step(1.0e-10, hsv.g));
                var darkColor = hsv2rgb(darkColorHsv);
                
                var diffuse = mix(darkColor, lightColor, diff);
                var lighten = diffuse * mix(color.rgb, lightColor, 0.125);
                
                return mix(color, vec4f(lighten, a), uf.shadeMix);
            }
        `;

        const shadowShaderSource = /* wgsl */`
            struct VSIn {
                @location(0) pos: vec3f,
                @location(1) texCoord: vec2f,
            };

            struct VertexUniforms {
                matrix: mat4x4f,
            };

            @group(0) @binding(0) var<uniform> uv: VertexUniforms;

            struct VSOut {
                @builtin(position) pos: vec4f,
                @location(0) texCoord: vec2f,
            };

            @vertex fn vsMain(v: VSIn) -> VSOut {
                var vsOut: VSOut;
                vsOut.pos = uv.matrix * vec4f(v.pos, 1);
                vsOut.texCoord = v.texCoord;
                return vsOut;
            }

            @fragment fn fsMain(v: VSOut) -> @location(0) vec4f {
                var d2 = v.texCoord - vec2f(0.5, 0.5);
                var d = d2.x * d2.x + d2.y * d2.y;
                d = smoothstep(0.05, 0.25, d);

                return vec4f(vec3f(0.0), (1.0 - d) * 0.3);
            }
        `;

        const shaderModule = device.createShaderModule({
            code: shaderSource
        });
        
        const shadowShaderModule = device.createShaderModule({
            code: shadowShaderSource
        });

        this.vertexUniformBuffer = device.createBuffer({
            size: 4 * 4 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.fragmentUniformBuffer = device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        const vertexBindGroupLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: "uniform"
                    }
                }
            ]
        });

        this.fragmentBindGroupLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "uniform"
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                }
            ]
        });

        this.vertexBindGroup = device.createBindGroup({
            layout: vertexBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.vertexUniformBuffer
                    }
                }
            ]
        });

        this.sampler = device.createSampler({
            magFilter: "nearest",
            minFilter: "nearest"
        });

        this.fragmentBindGroup = device.createBindGroup({
            layout: this.fragmentBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.fragmentUniformBuffer
                    }
                },
                {
                    binding: 1,
                    resource: this.sampler
                },
                {
                    binding: 2,
                    resource: this.texture.createView()
                }
            ]
        });

        this.shadowFragmentBindGroupLayout = device.createBindGroupLayout({
            entries: []
        });

        this.shadowFragmentBindGroup = device.createBindGroup({
            layout: this.shadowFragmentBindGroupLayout,
            entries: []
        });

        this.depthTexture = device.createTexture({
            format: "depth24plus",
            size: {
                width: this.canvas!.width,
                height: this.canvas!.height
            },
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });

        const layout = device.createPipelineLayout({
            bindGroupLayouts: [
                vertexBindGroupLayout,
                this.fragmentBindGroupLayout
            ]
        });

        this.pipeline = device.createRenderPipeline({
            vertex: {
                module: shaderModule,
                entryPoint: "vsMain",
                buffers: [
                    {
                        arrayStride: VERTEX_ELEMENT_COUNT * 4,
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: "float32x3"
                            },
                            {
                                shaderLocation: 1,
                                offset: 3 * 4,
                                format: "float32x2"
                            },
                            {
                                shaderLocation: 2,
                                offset: 5 * 4,
                                format: "float32x3"
                            }
                        ]
                    }
                ]
            },
            fragment: {
                module: shaderModule,
                entryPoint: "fsMain",
                targets: [
                    {
                        format: gpu.getPreferredCanvasFormat(),
                        blend: {
                            alpha: {
                                srcFactor: "src-alpha",
                                dstFactor: "one-minus-src-alpha"
                            },
                            color: {
                                srcFactor: "src-alpha",
                                dstFactor: "one-minus-src-alpha"
                            }
                        }
                    }
                ]
            },
            depthStencil: {
                format: "depth24plus",
                depthWriteEnabled: true,
                depthCompare: "less"
            },
            layout,
            primitive: {
                cullMode: "none",
                frontFace: "ccw",
            }
        });
        
        const shadowLayout = device.createPipelineLayout({
            bindGroupLayouts: [
                vertexBindGroupLayout,
                this.shadowFragmentBindGroupLayout
            ]
        });

        this.shadowPipeline = device.createRenderPipeline({
            vertex: {
                module: shadowShaderModule,
                entryPoint: "vsMain",
                buffers: [
                    {
                        arrayStride: SHADOW_VERTEX_ELEMENT_COUNT * 4,
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: "float32x3"
                            },
                            {
                                shaderLocation: 1,
                                offset: 3 * 4,
                                format: "float32x2"
                            }
                        ]
                    }
                ]
            },
            fragment: {
                module: shadowShaderModule,
                entryPoint: "fsMain",
                targets: [
                    {
                        format: gpu.getPreferredCanvasFormat(),
                        blend: {
                            alpha: {
                                srcFactor: "src-alpha",
                                dstFactor: "one-minus-src-alpha"
                            },
                            color: {
                                srcFactor: "src-alpha",
                                dstFactor: "one-minus-src-alpha"
                            }
                        }
                    }
                ]
            },
            depthStencil: {
                format: "depth24plus",
                depthWriteEnabled: true,
                depthCompare: "less"
            },
            layout: shadowLayout,
            primitive: {
                cullMode: "none",
                frontFace: "ccw",
            }
        });

        this.vertexBuffer = device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT * VERTEX_ELEMENT_COUNT * 1024,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });
    }

    private handleDeviceLost(info: GPUDeviceLostInfo): void {
        this.context.unconfigure();
        this.deviceReadyPromise = this.createDevice();
    }

    private async waitForDeviceReady(): Promise<void> {
        return await this.deviceReadyPromise;
    }

    protected override earlySetupCanvas(): void {
        super.earlySetupCanvas();

        const ctx = this.canvas!.getContext("webgpu");
        if (!ctx) throw new Error("WebGPU is not supported");
        this.context = ctx;
    }

    protected override async uploadSkinTextureData(skin: HTMLImageElement) {
        const bitmap = await createImageBitmap(skin);

        await this.waitForDeviceReady();

        if (this.texture) {
            this.texture.destroy();
        }

        this.texture = this.device.createTexture({
            format: "rgba8unorm",
            size: {
                width: skin.width,
                height: skin.height
            },
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        });

        this.device.queue.copyExternalImageToTexture({
            source: bitmap,
        }, {
            texture: this.texture,
        }, {
            width: skin.width,
            height: skin.height
        });

        this.fragmentBindGroup = this.device.createBindGroup({
            layout: this.fragmentBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.fragmentUniformBuffer
                    }
                },
                {
                    binding: 1,
                    resource: this.sampler
                },
                {
                    binding: 2,
                    resource: this.texture.createView()
                }
            ]
        });
    }

    protected override render(data: RenderData) {
        if (!this.device) return;

        const { camTx, camTy, camTz, globalTranslate, cuboids } = data;

        // Start rendering
        const canvas = this.canvas!;
        const device = this.device;
        const ctx = this.context;

        const projMat = m4.perspective(60 / 180 * Math.PI, canvas.width / canvas.height, 1, 1000);
        const camMat = m4.scale(m4.lookAt([camTx, camTy, camTz], [0, 0, 0], [0, 1, 0]), -1, 1, 1);
        const viewMat = m4.inverse(camMat);
        const viewProjMat = m4.multiply(projMat, viewMat);
        
        const commandEncoder = device.createCommandEncoder();
        const swapchain = ctx.getCurrentTexture();
        const swapchainView = swapchain.createView();
        const depthView = this.depthTexture.createView({
            aspect: "depth-only"
        });

        device.queue.writeBuffer(this.vertexUniformBuffer, 0,
            new Float32Array(m4.translate(viewProjMat, 0, 0, 0)));
        
        if (this.drawShadow) {
            const shadowSize = 24 - globalTranslate[1] / 2;
            const shSizeH = shadowSize / 2;
            const shadowY = -23;

            // Shadow
        
            device.queue.writeBuffer(this.vertexBuffer, 0,
                new Float32Array([
                    -shSizeH, shadowY, -shSizeH, 0, 0,
                    shSizeH, shadowY, -shSizeH, 1, 0,
                    -shSizeH, shadowY, shSizeH, 0, 1,

                    shSizeH, shadowY, -shSizeH, 1, 0,
                    -shSizeH, shadowY, shSizeH, 0, 1,
                    shSizeH, shadowY, shSizeH, 1, 1,
                ]));

            if (this.depthTexture.width != canvas.width || this.depthTexture.height != canvas.height) {
                this.depthTexture.destroy();
                this.depthTexture = device.createTexture({
                    format: "depth24plus",
                    size: { width: canvas.width, height: canvas.height },
                    usage: GPUTextureUsage.RENDER_ATTACHMENT
                });
            }

            const shadowCommandEncoder = device.createCommandEncoder();
            const shadowRenderPass = shadowCommandEncoder.beginRenderPass({
                colorAttachments: [
                    {
                        clearValue: [0, 0, 0, 0],
                        view: swapchainView,
                        loadOp: "clear",
                        storeOp: "store"
                    }
                ],
                depthStencilAttachment: {
                    view: depthView,
                    depthClearValue: 1,
                    depthLoadOp: "clear",
                    depthStoreOp: "store"
                }
            });

            shadowRenderPass.setPipeline(this.shadowPipeline);
            shadowRenderPass.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
            shadowRenderPass.setBindGroup(0, this.vertexBindGroup);
            shadowRenderPass.setBindGroup(1, this.shadowFragmentBindGroup);
            shadowRenderPass.setVertexBuffer(0, this.vertexBuffer);
            shadowRenderPass.draw(6);
            shadowRenderPass.end();

            const shadowCommandBuffer = shadowCommandEncoder.finish();
            device.queue.submit([shadowCommandBuffer]);
        }

        // ---

        device.queue.writeBuffer(this.fragmentUniformBuffer, 0,
            new Float32Array([1]));

        device.queue.writeBuffer(this.vertexBuffer, 0,
            new Float32Array(cuboids.flat(3)));
        
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: swapchainView,
                    clearValue: [0, 0, 0, 0],
                    loadOp: this.drawShadow ? "load" : "clear",
                    storeOp: "store"
                }
            ],
            depthStencilAttachment: {
                view: depthView,
                depthClearValue: 1,
                depthLoadOp: this.drawShadow ? "load" : "clear",
                depthStoreOp: "store"
            }
        });

        renderPass.setPipeline(this.pipeline);
        renderPass.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
        renderPass.setBindGroup(0, this.vertexBindGroup);
        renderPass.setBindGroup(1, this.fragmentBindGroup);
        renderPass.setVertexBuffer(0, this.vertexBuffer);
        renderPass.draw(cuboids.flat(2).length);
        renderPass.end();

        // ---

        const commandBuffer = commandEncoder.finish();
        device.queue.submit([commandBuffer]);

        // gl.viewport(0, 0, canvas.width, canvas.height);
        // gl.clearColor(0, 0, 0, 0);
        // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // gl.enable(gl.DEPTH_TEST);
        // gl.enable(gl.BLEND);
        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        //
        // const uMatrix = uniforms.get("matrix")!;
        // const uShadeMix = uniforms.get("shadeMix")!;
        // const uTexture = uniforms.get("texture")!;
        //
        // // Matrix uniform
        // gl.uniformMatrix4fv(uMatrix, false, m4.translate(viewProjMat, 0, 0, 0));
        //
        // // Shade?
        // gl.uniform1f(uShadeMix, 1);
        //
        // // Texture filters
        // gl.bindTexture(gl.TEXTURE_2D, this.texture!);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        // gl.uniform1i(uTexture, 0);
        //
        // const vertexBuffer = this.vertexBuffer!;
        // const sizeFloat = Float32Array.BYTES_PER_ELEMENT;
        // gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cuboids.flat(3)), gl.STATIC_DRAW);
        //
        // const posAttr = attrs.get("pos")!;
        // const uvAttr = attrs.get("uv")!;
        // const normalAttr = attrs.get("normal")!;
        //
        // gl.enableVertexAttribArray(posAttr);
        // gl.enableVertexAttribArray(uvAttr);
        // gl.enableVertexAttribArray(normalAttr);
        // gl.vertexAttribPointer(posAttr, 3, gl.FLOAT, false, VERTEX_ELEMENT_COUNT * sizeFloat, 0);
        // gl.vertexAttribPointer(uvAttr, 2, gl.FLOAT, false, VERTEX_ELEMENT_COUNT * sizeFloat, 3 * sizeFloat);
        // gl.vertexAttribPointer(normalAttr, 3, gl.FLOAT, false, VERTEX_ELEMENT_COUNT * sizeFloat, 5 * sizeFloat);
        //
        // gl.drawArrays(gl.TRIANGLES, 0, cuboids.flat(2).length);
    }
}