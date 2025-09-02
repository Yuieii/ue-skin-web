import { Expand, FixedLengthArray, IConstructor } from "../utils";

export declare global {
    // Expose the gpu property
    interface Navigator {
        readonly gpu?: GPU;
    }

    // Add WebGPU context option to the HTMLCanvasElement
    interface HTMLCanvasElement {
        getContext(contextId: "webgpu"): GPUCanvasContext | null;
    }

    interface GPUCanvasContext {
        readonly canvas: HTMLCanvasElement;

        configure(options: GPUContextConfiguration): void;
        getCurrentTexture(): GPUTexture;
        unconfigure(): void;
    }

    interface GPUCanvasContextConstructor {
        prototype: GPUCanvasContext;
        new(): GPUCanvasContext;
    }

    const GPUCanvasContext: GPUCanvasContextConstructor;

    interface GPUContextConfiguration {
        device: GPUDevice;
        format: GPUCanvasFormat;
        alphaMode?: GPUAlphaMode;
        colorSpace?: GPUColorSpace;
        usage?: GPUTextureUsage;
        viewFormats?: GPUTextureFormat;
    }

    type GPUAlphaMode = "opaque" | "premultiplied";

    type GPUColorSpace = "srgb" | "display-p3";

    enum GPUTextureUsage {
        /**
         * The texture can be used as the source of a copy operation, for example
         * the `source` argument of a {@link GPUCommandEncoder.copyTextureToBuffer} call.
         */
        COPY_SRC = 0x01,

        /**
         * The texture can be used as the destination of a copy/write operation, for example
         * the `destination` argument of a {@link GPUCommandEncoder.copyBufferToTexture} call.
         */
        COPY_DST = 0x02,

        /**
         * The texture can be used as a color or depth/stencil attachment in a render pass,
         * for example as the `view` property of the descriptor object in a
         * {@link GPUCommandEncoder.beginRenderPass} call.
         */
        RENDER_ATTACHMENT = 0x10,

        /**
         * The texture can be bound for use as a storage texture in a shader, for example
         * as a resource in a bind group entry when creating a {@link GPUBindGroup}
         * (via {@link GPUDevice.createBindGroup}), which adheres to a {@link GPUBindGroupLayout}
         * entry with a specified storage texture binding layout.
         */
        STORAGE_BINDING = 0x08,

        /**
         * The texture can be bound for use as a sampled texture in a shader, for example
         * as a resource in a bind group entry when creating a {@link GPUBindGroup}
         * (via {@link GPUDevice.createBindGroup}), which adheres to a {@link GPUBindGroupLayout}
         * entry with a specified storage texture binding layout.
         */
        TEXTURE_BINDING = 0x04,
    }

    interface GPUTextureFormatKeys {
        // 8-bit formats
        "r8unorm": unknown;
        "r8snorm": unknown;
        "r8uint": unknown;
        "r8sint": unknown;

        // 16-bit formats
        "r16uint": unknown;
        "r16sint": unknown;
        "r16float": unknown;
        "rg8unorm": unknown;
        "rg8snorm": unknown;
        "rg8uint": unknown;
        "rg8sint": unknown;

        // 32-bit formats
        "r32uint": unknown;
        "r32sint": unknown;
        "r32float": unknown;
        "rg16uint": unknown;
        "rg16sint": unknown;
        "rg16float": unknown;
        "rgba8unorm": unknown;
        "rgba8unorm-srgb": unknown;
        "rgba8snorm": unknown;
        "rgba8uint": unknown;
        "rgba8sint": unknown;
        "bgra8unorm": unknown;
        "bgra8unorm-srgb": unknown;

        // Packed 32-bit formats
        "rgb9e5ufloat": unknown;
        "rgb10a2uint": unknown;
        "rgb10a2unorm": unknown;
        "rg11b10ufloat": unknown;

        // 64-bit formats
        "rg32uint": unknown;
        "rg32sint": unknown;
        "rg32float": unknown;
        "rgba16uint": unknown;
        "rgba16sint": unknown;
        "rgba16float": unknown;

        // 128-bit formats
        "rgba32uint": unknown;
        "rgba32sint": unknown;
        "rgba32float": unknown;

        // Depth/stencil formats
        "stencil8": unknown;
        "depth16unorm": unknown;
        "depth24plus": unknown;
        "depth24plus-stencil8": unknown;
        "depth32float": unknown;

        // "depth32float-stencil8" feature
        "depth32float-stencil8": unknown;

        // BC compressed formats usable if "texture-compression-bc" is both
        // supported by the device/user agent and enabled in requestDevice.
        "bc1-rgba-unorm": unknown;
        "bc1-rgba-unorm-srgb": unknown;
        "bc2-rgba-unorm": unknown;
        "bc2-rgba-unorm-srgb": unknown;
        "bc3-rgba-unorm": unknown;
        "bc3-rgba-unorm-srgb": unknown;
        "bc4-r-unorm": unknown;
        "bc4-r-snorm": unknown;
        "bc5-rg-unorm": unknown;
        "bc5-rg-snorm": unknown;
        "bc6h-rgb-ufloat": unknown;
        "bc6h-rgb-float": unknown;
        "bc7-rgba-unorm": unknown;
        "bc7-rgba-unorm-srgb": unknown;

        // ETC2 compressed formats usable if "texture-compression-etc2" is both
        // supported by the device/user agent and enabled in requestDevice.
        "etc2-rgb8unorm": unknown;
        "etc2-rgb8unorm-srgb": unknown;
        "etc2-rgb8a1unorm": unknown;
        "etc2-rgb8a1unorm-srgb": unknown;
        "etc2-rgba8unorm": unknown;
        "etc2-rgba8unorm-srgb": unknown;
        "eac-r11unorm": unknown;
        "eac-r11snorm": unknown;
        "eac-rg11unorm": unknown;
        "eac-rg11snorm": unknown;

        // ASTC compressed formats usable if "texture-compression-astc" is both
        // supported by the device/user agent and enabled in requestDevice.
        "astc-4x4-unorm": unknown;
        "astc-4x4-unorm-srgb": unknown;
        "astc-5x4-unorm": unknown;
        "astc-5x4-unorm-srgb": unknown;
        "astc-5x5-unorm": unknown;
        "astc-5x5-unorm-srgb": unknown;
        "astc-6x5-unorm": unknown;
        "astc-6x5-unorm-srgb": unknown;
        "astc-6x6-unorm": unknown;
        "astc-6x6-unorm-srgb": unknown;
        "astc-8x5-unorm": unknown;
        "astc-8x5-unorm-srgb": unknown;
        "astc-8x6-unorm": unknown;
        "astc-8x6-unorm-srgb": unknown;
        "astc-8x8-unorm": unknown;
        "astc-8x8-unorm-srgb": unknown;
        "astc-10x5-unorm": unknown;
        "astc-10x5-unorm-srgb": unknown;
        "astc-10x6-unorm": unknown;
        "astc-10x6-unorm-srgb": unknown;
        "astc-10x8-unorm": unknown;
        "astc-10x8-unorm-srgb": unknown;
        "astc-10x10-unorm": unknown;
        "astc-10x10-unorm-srgb": unknown;
        "astc-12x10-unorm": unknown;
        "astc-12x10-unorm-srgb": unknown;
        "astc-12x12-unorm": unknown;
        "astc-12x12-unorm-srgb": unknown;
    }

    type GPUTextureFormat = Expand<keyof GPUTextureFormatKeys>;
    // Using Extract<...> so we make sure we don't miss one
    type GPUDepthOrStencilFormat = Extract<GPUTextureFormat, "stencil8" | "depth16unorm" | "depth24plus" | "depth24plus-stencil8" | "depth32float" | "depth32float-stencil8">;
    type GPUTextureFormatNoDepthOrStencil = Exclude<GPUTextureFormat, GPUDepthOrStencilFormat>;

    interface GPULabelIdentifiableResource {
        label: string;
    }

    interface GPUOptionalLabelIdentifiableResource {
        label?: string;
    }

    interface GPUDeviceEventMap {
        uncapturederror: GPUUncapturedErrorEvent;
    }

    interface GPUUncapturedErrorEvent extends Event {
        readonly error: GPUError;
    }

    type GPUErrorType = "internal" | "out-of-memory" | "validation";

    interface GPUUncapturedErrorEventConstructor {
        prototype: GPUUncapturedErrorEvent;
        new(type: GPUErrorType, options: {
            error: GPUError
        }): GPUUncapturedErrorEvent;
    }

    const GPUUncapturedErrorEvent: GPUUncapturedErrorEventConstructor;

    interface GPUDestroyableResource {
        destroy(): void;
    }

    type GPUExternalImageSource = ImageBitmap | HTMLVideoElement | VideoFrame | HTMLCanvasElement | OffscreenCanvas;

    interface GPUExternalImageCopySourceDescriptor {
        source: GPUExternalImageSource;
        origin?: [x?: number, y?: number] | { x?: number, y?: number };
        flipY?: boolean;
    }

    interface GPUExternalImageCopyDestinationDescriptor extends GPUTextureWriteDestinationDescriptor {
        colorSpace?: GPUColorSpace;
        premultipliedAlpha?: boolean;
    }

    interface GPUTextureWriteDestinationDescriptor {
        aspect?: GPUTextureViewAspect;
        mipLevel?: number;
        origin?: [x?: number, y?: number, z?: number] | { x?: number, y?: number, z: number };
        texture: GPUTexture;
    }

    interface GPUCommandBuffer {

    }

    type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array |
        Int32Array | Uint32Array | Float32Array | Float64Array | BigInt64Array | BigUint64Array;

    type GPUBufferData = ArrayBuffer | DataView | TypedArray;

    interface GPUTextureDataLayout {
        offset: number;
        bytesPerRow: number;
        rowsPerImage: number;
    }

    interface GPUQueue extends GPULabelIdentifiableResource {
        copyExternalImageToTexture(source: GPUExternalImageCopySourceDescriptor,
                                   destination: GPUExternalImageCopyDestinationDescriptor,
                                   copySize: GPUTextureSizeResolvable): void;
        onSubmittedWorkDone(): Promise<void>;
        submit(commandBuffers: GPUCommandBuffer[]): void;
        writeBuffer(buffer: GPUBuffer, bufferOffset: number, data: GPUBufferData, dataOffset?: number, size?: number): void;
        writeTexture(destination: GPUTextureWriteDestinationDescriptor,
                     data: GPUBufferData,
                     dataLayout: Partial<GPUTextureDataLayout>,
                     size: GPUTextureSizeResolvable): void;
    }

    interface GPUCompilationInfo {
        readonly messages: GPUCompilationMessage[];
    }

    interface GPUCompilationMessage {
        readonly length: number;
        readonly lineNum: number;
        readonly linePos: number;
        readonly message: string;
        readonly offset: number;
        readonly type: "error" | "info" | "warning";
    }

    interface GPUDeviceLostInfo {
        readonly message: string;
        readonly reason: "destroyed" | undefined;
    }

    interface GPUDevice extends EventTarget, GPULabelIdentifiableResource, GPUDestroyableResource {
        readonly features: GPUSupportedFeatures;
        readonly limits: GPUSupportedLimits;
        readonly lost: Promise<GPUDeviceLostInfo>;
        readonly queue: GPUQueue;

        createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;
        createBindGroupLayout(descriptor: GPUBindGroupLayoutDescriptor): GPUBindGroupLayout;
        createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
        createCommandEncoder(descriptor?: GPUCommandEncoderDescriptor): GPUCommandEncoder;
        createComputePipeline(descriptor: GPUComputePipelineDescriptor): GPUComputePipeline;
        createComputePipelineAsync(descriptor: GPUComputePipelineDescriptor): Promise<GPUComputePipeline>;
        createPipelineLayout(descriptor: GPUPipelineLayoutDescriptor): GPUPipelineLayout;
        createQuerySet(descriptor: GPUQuerySetDescriptor): GPUQuerySet;
        createRenderBundleEncoder(descriptor: GPURenderBundleEncoderDescriptor): GPURenderBundleEncoder;
        createRenderPipeline(descriptor: GPURenderPipelineDescriptor): GPURenderPipeline;
        createRenderPipelineAsync(descriptor: GPURenderPipelineDescriptor): Promise<GPURenderPipeline>;
        createSampler(descriptor?: GPUSamplerDescriptor): GPUSampler;
        createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;
        createTexture(descriptor: GPUTextureDescriptor): GPUTexture;
        importExternalTexture(descriptor: GPUExternalTextureDescriptor): GPUExternalTexture;
        popErrorScope(): Promise<GPUInternalError | GPUOutOfMemoryError | GPUValidationError | null>;
        pushErrorScope(filter: GPUErrorType): void;

        addEventListener<K extends keyof GPUDeviceEventMap>(type: K, callback: (this: GPUDevice, ev: GPUDeviceEventMap[K]) => any, options?: AddEventListenerOptions | boolean): void;
        onuncapturederror: ((this: GPUDevice, ev: GPUUncapturedErrorEvent) => any) | null;
    }

    interface GPUDeviceConstructor {
        prototype: GPUDevice;
        new(): GPUDevice;
    }

    const GPUDevice: GPUDeviceConstructor;

    interface GPUError extends Error {

    }

    interface GPUErrorConstructor {
        prototype: GPUError;
        new(): GPUError;
    }

    const GPUError: GPUErrorConstructor;

    interface GPUInternalError extends GPUError {

    }

    const GPUInternalError: {
        prototype: GPUInternalError;
        new(message: string): GPUInternalError;
    };

    interface GPUOutOfMemoryError extends GPUError {

    }

    const GPUOutOfMemoryError: {
        prototype: GPUOutOfMemoryError;
        new(message: string): GPUOutOfMemoryError;
    };

    interface GPUValidationError extends GPUError {

    }

    const GPUValidationError: {
        prototype: GPUValidationError;
        new(message: string): GPUValidationError;
    };

    interface GPUPipelineError extends DOMException {
        readonly reason: "internal" | "validation";
    }

    interface GPUTextureDescriptor extends GPUOptionalLabelIdentifiableResource {
        dimension?: GPUTextureDimension;
        format: GPUTextureFormat;
        mipLevelCount?: number;
        sampleConut?: number;
        size: GPUTextureSizeResolvable;
        usage: GPUTextureUsage;
    }

    interface GPUTextureSizeDescriptor {
        width: number;
        height?: number;
        depthOrArrayLayers?: number;
    }

    type GPUTextureSizeResolvable = GPUTextureSizeDescriptor |
        [width: number] | [width: number, height: number] |
        [width: number, height: number, depthOrArrayLayers: number];

    interface GPUShaderModuleDescriptor extends GPUOptionalLabelIdentifiableResource {
        code: string;
        hints?: Record<string, GPUPipelineLayout | "auto">;
        sourceMap?: string;
    }

    type GPUSamplerAddressMode = "clamp-to-edge" | "repeat" | "mirror-repeat";

    type GPUComparisonKind = "never" | "less" | "equal" | "less-equal" | "greater" | "not-equal" | "greater-equal" | "always";

    type GPUSamplerFilter = "nearest" | "linear";

    interface GPUSamplerDescriptor extends GPUOptionalLabelIdentifiableResource {
        addressModeU?: GPUSamplerAddressMode;
        addressModeV?: GPUSamplerAddressMode;
        addressModeW?: GPUSamplerAddressMode;
        compare?: GPUComparisonKind;
        lodMinClamp?: number;
        lodMaxClamp?: number;
        maxAnisotropy?: number;
        magFilter?: GPUSamplerFilter;
        minFilter?: GPUSamplerFilter;
        mipmapFilter?: GPUSamplerFilter;
    }

    interface GPURenderPipelineDescriptor extends GPUOptionalLabelIdentifiableResource {
        depthStencil?: GPURenderPipelineDepthStencilDescriptor;
        fragment?: GPURenderPipelineFragmentDescriptor;
        layout: GPUPipelineLayout | "auto";
        multisample?: GPURenderPipelineMultiSampleDescriptor;
        primitive?: GPURenderPipelinePrimitiveDescriptor;
        vertex: GPURenderPipelineVertexDescriptor;
    }

    interface GPURenderPipelineMultiSampleDescriptor {
        alphaToCoverageEnabled?: boolean;
        count?: number;
        mask?: number;
    }

    interface GPURenderPipelinePrimitiveDescriptor {
        cullMode?: GPUCullMode;
        frontFace?: GPUFrontFace;
        stripIndexFormat?: GPUIndexType;
        topology?: GPUPrimitiveTopology;
        unclippedDepth?: boolean;
    }

    type GPUIndexType = "uint16" | "uint32";
    type GPUCullMode = "back" | "front" | "none";
    type GPUFrontFace = "ccw" | "cw";
    type GPUPrimitiveTopology = "line-list" | "line-strip" | "point-list" | "triangle-list" | "triangle-strip";

    type GPUPipelineConstantValue = boolean | number;
    type GPUPipelineConstantOverrides = Record<number | string, GPUPipelineConstantValue>;

    interface GPUPipelineModuleDescriptorBase {
        constants?: GPUPipelineConstantOverrides;
        entryPoint: string;
        module: GPUShaderModule;
    }

    interface GPURenderPipelineVertexDescriptor extends GPUPipelineModuleDescriptorBase {
        buffers?: GPURenderPipelineVertexBufferLayoutDescriptor[];
    }

    interface GPURenderPipelineVertexBufferLayoutDescriptor {
        arrayStride: number;
        attributes: GPURenderPipelineVertexBufferAttributeDescriptor[];
        stepMode?: "instance" | "vertex";
    }

    interface GPURenderPipelineVertexBufferAttributeDescriptor {
        format: GPUVertexFormat;
        offset: number;
        shaderLocation: number;
    }

    interface GPUVertexFormatKeys {
        "uint8x2": unknown;
        "uint8x4": unknown;
        "sint8x2": unknown;
        "sint8x4": unknown;
        "unorm8x2": unknown;
        "unorm8x4": unknown;
        "snorm8x2": unknown;
        "snorm8x4": unknown;
        "uint16x2": unknown;
        "uint16x4": unknown;
        "sint16x2": unknown;
        "sint16x4": unknown;
        "unorm16x2": unknown;
        "unorm16x4": unknown;
        "snorm16x2": unknown;
        "snorm16x4": unknown;
        "float16x2": unknown;
        "float16x4": unknown;
        "float32": unknown;
        "float32x2": unknown;
        "float32x3": unknown;
        "float32x4": unknown;
        "uint32": unknown;
        "uint32x2": unknown;
        "uint32x3": unknown;
        "uint32x4": unknown;
        "sint32": unknown;
        "sint32x2": unknown;
        "sint32x3": unknown;
        "sint32x4": unknown;
        "unorm10-10-10-2": unknown;
    }

    type GPUVertexFormat = Expand<keyof GPUVertexFormatKeys>;

    interface GPURenderPipelineFragmentDescriptor extends GPUPipelineModuleDescriptorBase {
        targets: GPURenderPipelineFragmentTargetDescriptor[];
    }

    interface GPURenderPipelineFragmentTargetDescriptor {
        blend?: GPUBlendStateDescriptor;
        format: GPUTextureFormat;
        writeMask?: GPUFlagsConstantBits;
    }

    type GPUFlagsConstantBits = number;

    interface GPUFlagsConstant {
        readonly RED: GPUFlagsConstantBits;
        readonly GREEN: GPUFlagsConstantBits;
        readonly BLUE: GPUFlagsConstantBits;
        readonly ALPHA: GPUFlagsConstantBits;
        readonly ALL: GPUFlagsConstantBits;
    }

    const GPUFlagsConstant: GPUFlagsConstant;

    interface GPUBlendStateDescriptor {
        alpha: GPUBlendFactorDescriptor;
        color: GPUBlendFactorDescriptor;
    }

    interface GPUBlendFactorDescriptor {
        dstFactor?: GPUBlendFactor;
        srcFactor?: GPUBlendFactor;
        operation?: GPUBlendOperation;
    }

    type GPUBlendOperation = "add" | "max" | "min" | "reverse-subtract" | "subtract";

    type GPUBlendFactor = "constant" | "dst" | "dst-alpha" | "one" | "one-minus-dst" | "one-minus-src" | 
        "one-minus-src-alpha" | "one-minus-dst-alpha" | "one-minus-constant" | "src" | "src-alpha" | "src-alpha-saturated" | "zero";

    type GPUDepthOperation = "decrement-clamp" | "decrement-wrap" | "invert" | "increment-clamp" | "increment-wrap" | "keep" | "replace" | "zero";

    interface GPURenderPipelineDepthStencilDescriptor {
        depthBias?: number;
        depthBiasClamp?: number;
        depthBiasSlopeScale?: number;
        depthCompare: GPUComparisonKind;
        depthWriteEnabled: boolean;
        format: GPUTextureFormat;
        stencilBack?: GPURenderPipelineStencilDescriptor;
        stencilFront?: GPURenderPipelineStencilDescriptor;
        stencilReadMask?: number;
        stencilWriteMask?: number;
    }

    interface GPURenderPipelineStencilDescriptor {
        compare?: GPUComparisonKind;
        depthFailOp?: GPUDepthOperation;
        failOp?: GPUDepthOperation;
        passOp: GPUDepthOperation;
    }

    interface GPURenderPipeline extends GPULabelIdentifiableResource {

    }

    const GPURenderPipeline: IConstructor<GPURenderPipeline>;

    interface GPUPipelineLayoutDescriptor extends GPUOptionalLabelIdentifiableResource {
        bindGroupLayouts: GPUBindGroupLayout[]
    }

    interface GPUComputePipelineDescriptor extends GPUOptionalLabelIdentifiableResource {
        compute: GPUComputePipelineComputeDescriptor;
        layout: GPUPipelineLayout | "auto";
    }

    interface GPUPipelineLayout extends GPULabelIdentifiableResource {

    }

    interface GPUComputePipelineComputeDescriptor extends GPUPipelineModuleDescriptorBase { }

    interface GPUShaderModule extends GPULabelIdentifiableResource{
        getCompilationInfo(): Promise<GPUCompilationInfo>;
    }

    interface GPUComputePipeline {

    }

    interface GPUCommandEncoderDescriptor extends GPUOptionalLabelIdentifiableResource {

    }

    type GPUQuerySetType = "occlusion" | "timestamp";

    interface GPUQuerySetDescriptor extends GPUOptionalLabelIdentifiableResource{
        count: number;
        type: GPUQuerySetType;
    }

    interface GPUQuerySet extends GPULabelIdentifiableResource, GPUDestroyableResource {
        readonly count: number;
        readonly type: GPUQuerySetType;
    }

    interface GPUComputePassDescriptor extends GPUOptionalLabelIdentifiableResource {
        timestampWrites?: GPUTimestampWritesDescriptor;
    }

    interface GPUTimestampWritesDescriptor {
        location: "beginning" | "end";
        queryIndex: number;
        querySet: GPUQuerySet;
    }

    interface GPUCommandEncoderBase extends GPULabelIdentifiableResource {
        insertDebugMarker(markerLabel: string): void;
        popDebugGroup(): void;
        pushDebugGroup(groupLabel: string): void;
    }

    interface GPUPassEncoderBase extends GPUCommandEncoderBase {
        end(): void;
        setBindGroup(index: number, bindGroup: GPUBindGroup, dynamicOffsets?: number[]): void;
        setBindGroup(index: number, bindGroup: GPUBindGroup, dynamicOffsets: Uint32Array,
                     dynamicOffsetsStart: number, dynamicOffsetsLength: number): void;
        setPipeline(pipeline: GPURenderPipeline | GPUComputePipeline): void;
    }

    interface GPURenderEncoderBase extends GPUPassEncoderBase {
        draw(vertexCount: number, instanceCount?: number = 1, firstVertex?: number = 0, firstInstance?: number = 0): void;
        drawIndexed(indexCount: number, instanceCount?: number = 1,
                    firstIndex?: number = 0, baseVertex?: number = 0, firstInstance?: number = 0): void;
        drawIndexedIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
        drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
        setIndexBuffer(buffer: GPUBuffer, indexFormat: GPUIndexType, offset?: number = 0, size?: number): void;
        setVertexBuffer(slot: number, buffer: GPUBuffer, offset?: number = 0, size?: number): void;
        setPipeline(pipeline: GPURenderPipeline): void;
    }

    type GPUColorRGBAResolvable = [r: number, g: number, b: number, a: number] | {
        r: number;
        g: number;
        b: number;
        a: number;
    };

    interface GPURenderPassEncoder extends GPURenderEncoderBase {
        beginOcclusionQuery(queryIndex: number): void;
        endOcclusionQuery(): void;
        executeBundles(bundles: GPURenderBundle[]): void;
        setBlendConstant(color: GPUColorRGBAResolvable): void;
        setScissorRect(x: number, y: number, width: number, height: number): void;
        setStencilReference(reference: number);
        setViewport(x: number, y: number, width: number, height: number, minDepth: number, maxDepth: number): void;
    }

    interface GPUComputePassEncoder extends GPUPassEncoderBase {
        /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/GPUComputePassEncoder/dispatchWorkgroups) */
        dispatchWorkgroups(workgroupCountX: number, workgroupCountY?: number = 1, workgroupCountZ?: number = 1): void;
        /** [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/GPUComputePassEncoder/dispatchWorkgroupsIndirect) */
        dispatchWorkgroupsIndirect(indirectBuffer: GPUBuffer, indirectOffset: number): void;
        /**
         * Sets the {@link GPUComputePipeline} to use for this compute pass.
         * @param pipeline The {@link GPUComputePipeline} to use for this compute pass.
         * @see [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/GPUComputePassEncoder/setPipeline)
         */
        setPipeline(pipeline: GPUComputePipeline): void;
    }

    interface GPURenderBundle extends GPULabelIdentifiableResource { }

    interface GPURenderBundleEncoderDescriptor extends GPUOptionalLabelIdentifiableResource {
        colorFormats: GPUTextureFormat[];
        depthReadOnly?: boolean;
        depthStencilFormat?: GPUDepthOrStencilFormat;
        sampleCount?: number;
        stencilReadOnly?: boolean;
    }

    interface GPURenderBundleEncoder extends GPURenderEncoderBase {
        finish(descriptor?: GPURenderBundleDescriptor): GPURenderBundle;
    }

    interface GPURenderBundleDescriptor extends GPUOptionalLabelIdentifiableResource { }

    type GPULoadOperation = "clear" | "load";
    type GPUStoreOperation = "store" | "discard";

    interface GPURenderPassDescriptor extends GPUOptionalLabelIdentifiableResource {
        colorAttachments: GPURenderPassColorAttachmentDescriptor[];
        depthStencilAttachment?: GPURenderPassDepthStencilAttachmentDescriptor;
        maxDrawCount?: number;
        occlusionQuerySet?: GPUQuerySet;
        timestampWrites?: GPUTimestampWritesDescriptor;
    }

    interface GPURenderPassColorAttachmentDescriptor {
        clearValue?: GPUColorRGBAResolvable;
        loadOp: GPULoadOperation;
        storeOp: GPUStoreOperation;
        resolveTarget?: GPUTextureView;
        view: GPUTextureView;
    }

    interface GPURenderPassDepthStencilAttachmentDescriptor {
        depthClearValue?: number;
        depthLoadOp?: GPULoadOperation;
        depthStoreOp?: GPUStoreOperation;
        stencilClearValue?: number;
        stencilLoadOp?: GPULoadOperation;
        stencilReadOnly?: boolean;
        stencilStoreOp?: GPUStoreOperation;
        view: GPUTextureView;
    }

    interface GPUCommandEncoder extends GPUCommandEncoderBase {
        beginComputePass(descriptor?: GPUComputePassDescriptor): GPUComputePassEncoder;
        beginRenderPass(descriptor: GPURenderPassDescriptor): GPURenderPassEncoder;
        clearBuffer(): void;
        copyBufferToBuffer(): void;
        copyBufferToTexture(): void;
        copyTextureToBuffer(): void;
        copyTextureToTexture(): void;
        finish(): GPUCommandBuffer;
        resolveQuerySet(): void;
        writeTimestamp(): void;
    }

    interface GPUCommandEncoderConstructor {
        prototype: GPUCommandEncoder;
        new(): GPUCommandEncoder;
    }

    const GPUCommandEncoder: GPUCommandEncoderConstructor;

    interface GPUBufferDescriptor extends GPUOptionalLabelIdentifiableResource {
        mappedAtCreation?: boolean;
        size: number;
        usage: GPUBufferUsage;
    }

    enum GPUBufferUsage {
        COPY_DST = 8,
        COPY_SRC = 4,
        INDEX = 16,
        INDIRECT = 256,
        MAP_READ = 1,
        MAP_WRITE = 2,
        QUERY_RESOLVE = 512,
        STORAGE = 128,
        UNIFORM = 64,
        VERTEX = 32,
    }

    interface GPUExternalTextureDescriptor extends GPUOptionalLabelIdentifiableResource {
        colorSpace?: GPUColorSpace;
        source: HTMLVideoElement | VideoFrame;
    }

    interface GPUBindGroupDescriptor extends GPUOptionalLabelIdentifiableResource {
        layout: GPUBindGroupLayout;
        entries: GPUBindGroupEntryDescriptor[]
    }

    interface GPUBindGroupEntryDescriptor {
        binding: number;
        resource: GPUBufferBinding | GPUExternalTexture | GPUSampler | GPUTextureView;
    }

    interface GPUBuffer {

    }

    interface GPUBufferConstructor {
        prototype: GPUBuffer;
        new(): GPUBuffer;
    }

    const GPUBuffer: GPUBufferConstructor;

    interface GPUBufferBinding {
        buffer: GPUBuffer;
        offset?: number;
        size?: number;
    }

    interface GPUExternalTexture extends GPULabelIdentifiableResource {

    }

    interface GPUExternalTextureConstructor {
        prototype: GPUExternalTexture;
        new(): GPUExternalTexture;
    }

    const GPUExternalTexture: GPUExternalTextureConstructor;

    interface GPUSampler {

    }

    interface GPUSamplerConstructor {
        prototype: GPUSampler;
        new(): GPUSampler;
    }

    const GPUSampler: GPUSamplerConstructor;

    interface GPUTexture extends GPULabelIdentifiableResource, GPUDestroyableResource {
        readonly depthOrArrayLayers: number;
        readonly dimension: GPUTextureDimension;
        readonly format: GPUTextureFormat;
        readonly height: number;
        readonly mipLevelCount: number;
        readonly sampleCount: number;
        readonly usage: GPUTextureUsage;
        readonly width: number;

        createView(descriptor?: Partial<GPUTextureViewDescriptor>): GPUTextureView;
    }

    interface GPUTextureConstructor {
        prototype: GPUTexture;
        new(): GPUTexture;
    }

    const GPUTexture: GPUTextureConstructor;

    type GPUTextureViewAspect = "all" | "depth-only" | "stencil-only";

    interface GPUTextureViewDescriptor extends GPULabelIdentifiableResource {
        arrayLayerCount: number;
        aspect: GPUTextureViewAspect;
        baseArrayLayer: number;
        baseMipmapLevel: number;
        dimension: GPUTextureViewDimension;
        format: GPUTextureFormat;
        mipLevelCount: number;
    }

    interface GPUTextureView extends GPULabelIdentifiableResource { }

    interface GPUTextureViewConstructor {
        prototype: GPUTextureView;
        new(): GPUTextureView;
    }

    const GPUTextureView: GPUTextureViewConstructor;

    type GPUTextureDimension = "1d" | "2d" | "3d";
    type GPUTextureViewDimension = "1d" | "2d" | "2d-array" | "cube" | "cube-array" | "3d";

    type GPUCanvasFormat = "rgba8unorm" | "bgra8unorm" | "rgba16float";

    interface GPU {
        readonly wgslLanguageFeatures: WGSLLanguageFeatures;

        requestAdapter(options?: Partial<GPUAdapterRequestOptions>): Promise<GPUAdapter | null>;
        getPreferredCanvasFormat(): GPUCanvasFormat;
    }

    interface WGSLLanguageFeatureKeys {
        "readonly_and_readwrite_storage_textures": unknown;
        "packed_4x8_integer_dot_product": unknown;
        "unrestricted_pointer_parameters": unknown;
        "pointer_composite_access": unknown;
    }

    interface WGSLLanguageFeatures extends ReadonlySet<keyof WGSLLanguageFeatureKeys> {

    }

    interface GPUConstructor {
        prototype: GPU;
        new(): GPU;
    }

    const GPU: GPUConstructor;

    interface GPUAdapterRequestOptions {
        powerPreference?: GPUPowerPreference;
    }

    type GPUPowerPreference = "low-power" | "high-performance";

    interface GPUAdapter {
        readonly features: GPUSupportedFeatures;
        readonly isFallbackAdapter: boolean;
        readonly limits: GPUSupportedLimits;

        readonly info?: GPUAdapterInfo;
        requestAdapterInfo?(): Promise<GPUAdapterInfo>;
        requestDevice(options?: Partial<GPUDeviceDescriptor>): Promise<GPUDevice>;
    }

    interface GPUAdapterConstructor {
        prototype: GPUAdapter;
        new(): GPUAdapter;
    }

    const GPUAdapter: GPUAdapterConstructor;

    interface GPUAdapterInfo {
        readonly architecture: string;
        readonly description: string;
        readonly device: string;
        readonly vendor: string;
    }

    interface GPUAdapterInfoConstructor {
        prototype: GPUAdapterInfo;
        new(): GPUAdapterInfo;
    }

    const GPUAdapterInfo: GPUAdapterInfoConstructor;

    interface GPUBindGroup extends GPULabelIdentifiableResource {}

    interface GPUBindGroupConstructor {
        prototype: GPUBindGroup;
        new(): GPUBindGroup;
    }

    const GPUBindGroup: GPUBindGroupConstructor;

    interface GPUBindGroupLayout extends GPULabelIdentifiableResource {}

    interface GPUBindGroupLayoutConstructor {
        prototype: GPUBindGroupLayout;
        new(): GPUBindGroupLayout;
    }

    const GPUBindGroupLayout: GPUBindGroupConstructor;

    interface GPUBindGroupLayoutDescriptor extends GPUOptionalLabelIdentifiableResource {
        entries: GPUBindGroupLayoutEntryDescriptor[];
    }

    type GPUBindGroupLayoutEntryDescriptorBase<T extends keyof GPUResourceLayoutTypeMap> = {
        binding: number,
        visibility: GPUShaderStage
    } & {
        [K in T]: GPUResourceLayoutTypeMap[K]
    };

    type GPUBindGroupLayoutEntryDescriptorUnion<T> = T extends keyof GPUResourceLayoutTypeMap
        ? GPUBindGroupLayoutEntryDescriptorBase<T> : never;

    type GPUBindGroupLayoutEntryDescriptor = GPUBindGroupLayoutEntryDescriptorUnion<keyof GPUResourceLayoutTypeMap>;

    interface GPUResourceLayoutTypeMap {
        buffer: GPUBindGroupLayoutBufferDescriptor;
        externalTexture: GPUBindGroupLayoutExternalTextureDescriptor;
        sampler: GPUBindGroupLayoutSamplerDescriptor;
        storageTexture: GPUBindGroupLayoutStorageTextureDescriptor;
        texture: GPUBindGroupLayoutTextureDescriptor;
    }

    interface GPUBindGroupLayoutBufferDescriptor {
        hasDynamicOffset?: boolean;
        minBindingSize?: number;
        type?: "read-only-storage" | "storage" | "uniform";
    }

    interface GPUBindGroupLayoutExternalTextureDescriptor { }

    interface GPUBindGroupLayoutSamplerDescriptor {
        type?: "comparison" | "filtering" | "non-filtering";
    }

    interface GPUBindGroupLayoutStorageTextureDescriptor {
        format: GPUTextureFormat;
        access?: "write-only";

        // See validation part:
        // https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/createBindGroupLayout#entry_objects
        viewDimension?: Exclude<GPUTextureViewDimension, "cube" | "cube-array">;
    }

    interface GPUBindGroupLayoutTextureDescriptor {
        multisampled?: boolean;
        sampleType?: "depth" | "float" | "sint" | "uint" | "unfilterable-float";
        viewDimension?: GPUTextureViewDimension;
    }

    type GPUShaderStageBits = number;

    enum GPUShaderStage {
        VERTEX   = 0x01,
        FRAGMENT = 0x02,
        COMPUTE  = 0x04,
    }

    interface GPUDeviceDescriptor extends GPULabelIdentifiableResource {
        defaultQueue: GPUDefaultQueueDescriptor;
        requiredFeatures: GPUFeatures[];
        requiredLimits: GPULimitsRequirements;
    }

    type GPULimitsRequirements = {
        -readonly [K in keyof GPUSupportedLimits]?: GPUSupportedLimits[K];
    }

    interface GPUDefaultQueueDescriptor extends GPULabelIdentifiableResource { }

    interface GPUFeatureKeys {
        "depth-clip-control": unknown;
        "depth32float-stencil8": unknown;
        "texture-compression-bc": unknown;
        "texture-compression-etc2": unknown;
        "texture-compression-astc": unknown;
        "timestamp-query": unknown;
        "indirect-first-instance": unknown;
        "shader-f16": unknown;
        "rg11b10ufloat-renderable": unknown;
        "bgra8unorm-storage": unknown;
        "float32-filterable": unknown;
    }

    type GPUFeatures = keyof GPUFeatureKeys;

    interface GPUSupportedFeatures extends ReadonlySet<GPUFeatures> { }

    interface GPUSupportedLimits {
        readonly maxTextureDimension1D: number;
        readonly maxTextureDimension2D: number;
        readonly maxTextureDimension3D: number;
        readonly maxTextureArrayLayers: number;
        readonly maxBindGroups: number;
        readonly maxBindGroupsPlusVertexBuffers: number;
        readonly maxBindingsPerBindGroup: number;
        readonly maxDynamicUniformBuffersPerPipelineLayout: number;
        readonly maxDynamicStorageBuffersPerPipelineLayout: number;
        readonly maxSampledTexturesPerShaderStage: number;
        readonly maxSamplersPerShaderStage: number;
        readonly maxStorageBuffersPerShaderStage: number;
        readonly maxStorageTexturesPerShaderStage: number;
        readonly maxUniformBuffersPerShaderStage: number;
        readonly maxUniformBufferBindingSize: number;
        readonly maxStorageBufferBindingSize: number;
        readonly minUniformBufferOffsetAlignment: number;
        readonly minStorageBufferOffsetAlignment: number;
        readonly maxVertexBuffers: number;
        readonly maxBufferSize: number;
        readonly maxVertexAttributes: number;
        readonly maxVertexBufferArrayStride: number;
        readonly maxInterStageShaderComponents: number;
        readonly maxInterStageShaderVariables: number;
        readonly maxColorAttachments: number;
        readonly maxColorAttachmentBytesPerSample: number;
        readonly maxComputeWorkgroupStorageSize: number;
        readonly maxComputeInvocationsPerWorkgroup: number;
        readonly maxComputeWorkgroupSizeX: number;
        readonly maxComputeWorkgroupSizeY: number;
        readonly maxComputeWorkgroupSizeZ: number;
        readonly maxComputeWorkgroupsPerDimension: number;
    }
}