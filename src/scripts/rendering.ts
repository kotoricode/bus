import { get } from "svelte/store"
import { Camera, Scene, sRGBEncoding, Vector2, WebGLRenderer, WebGLRenderTarget, type WebGLRenderTargetOptions } from "three"
import { initSettings } from "./settings"
import { shaderManager } from "./shaders/shader-manager"
import { storeSettings} from "./state"
import { textureManager } from "./texture-manager"

let renderer: WebGLRenderer
let samplesHasChanged = false
const renderTargets = new Map<string, WebGLRenderTarget>()
const pickingBuffer = new Uint8Array(4)

const init = (canvas: HTMLCanvasElement): void =>
{
    renderer = new WebGLRenderer({
        canvas,
        depth: false,
        stencil: false
    })

    const settings = get(storeSettings)
    renderer.setSize(settings.width, settings.height)
    renderer.setClearColor(0)
    renderer.autoClear = false
    renderer.outputEncoding = sRGBEncoding
    renderer.debug.checkShaderErrors = import.meta.env.DEV

    initSettings(renderer)
    createRenderTarget("scene", { samples: settings.samples })
    createRenderTarget("picking")

    storeSettings.subscribe(value =>
    {
        const sceneRenderTarget = renderTargets.get("scene")

        if (sceneRenderTarget)
        {
            samplesHasChanged = sceneRenderTarget.samples !== value.samples
        }
    })

    shaderManager.init()
}

const createRenderTarget = (id: string, options?: WebGLRenderTargetOptions): void =>
{
    const settings = get(storeSettings)

    const renderTarget = new WebGLRenderTarget(
        settings.width,
        settings.height,
        options
    )

    renderTargets.set(id, renderTarget)
    textureManager.setTexture(id, renderTarget.texture)
}

const getRenderTarget = (id: string): WebGLRenderTarget =>
{
    const renderTarget = renderTargets.get(id)

    if (renderTarget === undefined)
    {
        throw Error(`Render target not found: ${id}`)
    }

    return renderTarget
}

const getPixelColor = (position: Vector2, renderTargetId: string): number =>
{
    const renderTarget = getRenderTarget(renderTargetId)
    renderer.readRenderTargetPixels(renderTarget, position.x, position.y, 1, 1, pickingBuffer)

    const r = pickingBuffer[0] << 16
    const g = pickingBuffer[1] << 8
    const b = pickingBuffer[2]

    return r + g + b
}

const render = (scene: Scene, camera: Camera, renderTargetId?: string): void =>
{
    const renderTarget = renderTargetId ? getRenderTarget(renderTargetId) : null
    renderer.clear(true, true)
    renderer.setRenderTarget(renderTarget)
    renderer.render(scene, camera)
}

const update = (): void =>
{
    if (samplesHasChanged)
    {
        const settings = get(storeSettings)
        createRenderTarget("scene", { samples: settings.samples })
        samplesHasChanged = false
    }
}

export const rendering = <const>{
    init,
    getPixelColor,
    render,
    update
}
