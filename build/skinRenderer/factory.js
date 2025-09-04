import { log, memoize, warn } from "../common.js";
import { WebGLSkinRenderer } from "./webgl.js";
import { WebGPUSkinRenderer } from "./webgpu.js";
const checkWebGPUAvailability = memoize(async () => {
    log("WebGPU-Availability", "Checking WebGPU availability...");
    // Check if the API is available
    // (Does not exist in old browsers, insecure context, etc.)
    if (!navigator.gpu) {
        warn("WebGPU-Availability", "WebGPU API is unavailable. Are we in an insecure context or a legacy browser?");
        return false;
    }
    // Check if we can create an adapter first
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        warn("WebGPU-Availability", "WebGPU adapter is unavailable.");
        return false;
    }
    // Then check if we can create a device
    const device = await adapter.requestDevice();
    if (!device) {
        warn("WebGPU-Availability", "An WebGPU adapter is available, but it failed to create a WebGPU device.");
        return false;
    }
    log("WebGPU-Availability", "WebGPU is available for use!");
    device.destroy();
    return true;
});
// A factory object is used to prevent circular reference of modules
export const SkinRendererFactory = {
    async createPreferred(skin, slim) {
        const useWebGPU = await checkWebGPUAvailability();
        return useWebGPU ? SkinRendererFactory.createWebGPU(skin, slim) : SkinRendererFactory.createWebGL(skin, slim);
    },
    async createWebGL(skin, slim) {
        return new WebGLSkinRenderer(skin, slim);
    },
    async createWebGPU(skin, slim) {
        return new WebGPUSkinRenderer(skin, slim);
    }
};
//# sourceMappingURL=factory.js.map