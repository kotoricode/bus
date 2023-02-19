import { get } from "svelte/store"
import { Camera, Scene, sRGBEncoding, Vector2, WebGLRenderer, WebGLRenderTarget, type WebGLRenderTargetOptions } from "three"
import { EffectComposer, Pass } from "three/examples/jsm/postprocessing/EffectComposer"
import { initSettings } from "./settings"
import { store} from "./store"
import { textureManager } from "./texture-manager"
import { time } from "./time"

let renderer: WebGLRenderer
let effectComposer: EffectComposer

let samplesChanged = false
const renderTargets = new Map<string, WebGLRenderTarget>()
const pickingBuffer = new Uint8Array(4)

const createRenderTarget = (renderTargetId: string, textureId: string, options?: WebGLRenderTargetOptions): void =>
{
    const settings = get(store.settings)

    const renderTarget = new WebGLRenderTarget(
        settings.width,
        settings.height,
        options
    )

    const existingRenderTarget = renderTargets.get(renderTargetId)

    if (existingRenderTarget)
    {
        existingRenderTarget.texture.dispose()
        existingRenderTarget.dispose()
    }

    renderTargets.set(renderTargetId, renderTarget)
    textureManager.setTexture(textureId, renderTarget.texture)
}

const dispose = (): void =>
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

    initSettings(renderer)

    const settings = get(store.settings)
    renderer.setSize(settings.width, settings.height)
    renderer.setClearColor(0)
    renderer.autoClear = false
    renderer.outputEncoding = sRGBEncoding
    renderer.debug.checkShaderErrors = import.meta.env.DEV

    createRenderTarget("renderTargetScene", "textureScene", { samples: settings.samples })
    createRenderTarget("renderTargetPicking", "texturePicking")

    effectComposer = new EffectComposer(renderer)

    store.settings.subscribe(value =>
    {
        const sceneRenderTarget = renderTargets.get("renderTargetScene")

        if (sceneRenderTarget)
        {
            samplesChanged = sceneRenderTarget.samples !== value.samples
        }
    })
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
    const deltaTime = time.getDelta()
    effectComposer.render(deltaTime)
}

const setEffects = (...passes: Pass[]): void =>
{
    for (const pass of effectComposer.passes)
    {
        pass.dispose()
    }

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
        const settings = get(store.settings)
        createRenderTarget("renderTargetScene", "textureScene", { samples: settings.samples })
        samplesChanged = false
    }
}

export const rendering = <const>{
    dispose,
    getCanvasSize,
    getPixelColor,
    init,
    render,
    renderEffects,
    setEffects,
    update
}
