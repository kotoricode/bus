import { get } from "svelte/store"
import { Camera, Scene, sRGBEncoding, WebGLRenderer, WebGLRenderTarget } from "three"
import { settings } from "./settings"
import { storeHeight, storeSamples, storeWidth } from "./state"
import { textureManager } from "./texture"

let renderer: WebGLRenderer
let samplesHasChanged = false
const renderTargets = new Map<string, WebGLRenderTarget | null>()

const init = (canvas: HTMLCanvasElement): void =>
{
    renderer = new WebGLRenderer({
        canvas,
        depth: false,
        stencil: false
    })

    const width = get(storeWidth)
    const height = get(storeHeight)

    renderer.setSize(width, height)
    renderer.setClearColor(0x333333)
    renderer.outputEncoding = sRGBEncoding
    renderer.debug.checkShaderErrors = import.meta.env.DEV

    settings.init(renderer)
    createSceneRenderTarget()
    renderTargets.set("image", null)

    storeSamples.subscribe(value =>
    {
        const sceneRenderTarget = renderTargets.get("scene")

        if (sceneRenderTarget)
        {
            samplesHasChanged = sceneRenderTarget.samples !== value
        }
    })
}

const createSceneRenderTarget = (): void =>
{
    const samples = get(storeSamples)
    const width = get(storeWidth)
    const height = get(storeHeight)

    const options = {
        samples
    }

    const renderTarget = new WebGLRenderTarget(width, height, options)
    renderTargets.set("scene", renderTarget)
    textureManager.setTexture("scene", renderTarget.texture)
}

const render = (scene: Scene, camera: Camera, renderTargetId: string): void =>
{
    const renderTarget = renderTargets.get(renderTargetId)

    if (renderTarget === undefined)
    {
        throw Error(`Render target not found: ${renderTargetId}`)
    }

    renderer.setRenderTarget(renderTarget)
    renderer.render(scene, camera)
}

const update = (): void =>
{
    if (samplesHasChanged)
    {
        createSceneRenderTarget()
        samplesHasChanged = false
    }
}

export const rendering = {
    init,
    render,
    update
}
