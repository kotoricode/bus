import { get } from "svelte/store"
import { Camera, LinearEncoding, Scene, sRGBEncoding, Vector2, WebGLRenderer, WebGLRenderTarget, type WebGLRenderTargetOptions } from "three"
import { EffectComposer, Pass } from "three/examples/jsm/postprocessing/EffectComposer"
import { initSettings } from "./settings"
import { materialManager } from "./materials/material-manager"
import { storeSettings} from "./state"
import { textureManager } from "./texture-manager"
import { time } from "./time"

let renderer: WebGLRenderer
let samplesChanged: boolean
let renderTargets: Map<string, WebGLRenderTarget>
let pickingBuffer: Uint8Array
let effectComposer: EffectComposer

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

const destroy = (): void =>
{
    renderer.dispose()
}

const getCanvasSize = (): Vector2 => renderer.getSize(new Vector2())

const getPixelColor = (position: Vector2, renderTargetId: string): number =>
{
    const renderTarget = getRenderTarget(renderTargetId)
    renderer.readRenderTargetPixels(renderTarget, position.x, position.y, 1, 1, pickingBuffer)

    const r = pickingBuffer[0] << 16
    const g = pickingBuffer[1] << 8
    const b = pickingBuffer[2]

    return r + g + b
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

const init = (canvas: HTMLCanvasElement): void =>
{
    renderer = new WebGLRenderer({
        canvas,
        depth: false,
        stencil: false
    })

    samplesChanged = false
    renderTargets = new Map()
    pickingBuffer = new Uint8Array(4)

    const settings = get(storeSettings)
    renderer.setSize(settings.width, settings.height)
    renderer.setClearColor(0)
    renderer.autoClear = false
    renderer.outputEncoding = sRGBEncoding
    renderer.debug.checkShaderErrors = import.meta.env.DEV

    initSettings(renderer)
    createRenderTarget("scene", { samples: settings.samples })
    createRenderTarget("picking", { encoding: sRGBEncoding })

    effectComposer = new EffectComposer(renderer)

    storeSettings.subscribe(value =>
    {
        const sceneRenderTarget = renderTargets.get("scene")

        if (sceneRenderTarget)
        {
            samplesChanged = sceneRenderTarget.samples !== value.samples
        }
    })

    materialManager.init()
}

const render = (scene: Scene, camera: Camera, renderTargetId?: string): void =>
{
    const renderTarget = renderTargetId ? getRenderTarget(renderTargetId) : null
    renderer.clear(true, true)
    renderer.setRenderTarget(renderTarget)
    renderer.render(scene, camera)
}

const renderEffects = (): void =>
{
    const deltaTime = time.delta()
    effectComposer.render(deltaTime)
}

const setEffects = (passes: Pass[]): void =>
{
    effectComposer.passes.length = 0

    for (const pass of passes)
    {
        effectComposer.addPass(pass)
    }
}

const update = (): void =>
{
    if (samplesChanged)
    {
        const settings = get(storeSettings)
        createRenderTarget("scene", { samples: settings.samples })
        samplesChanged = false
    }
}

export const rendering = <const>{
    destroy,
    getCanvasSize,
    getPixelColor,
    init,
    render,
    renderEffects,
    setEffects,
    update
}
