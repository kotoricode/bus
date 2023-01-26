import { get } from "svelte/store"
import { sRGBEncoding, WebGLRenderer, WebGLRenderTarget } from "three"
import { settings } from "./settings"
import { settingsHeight, settingsSamples, settingsWidth } from "./state"
import { textureManager } from "./texture"

let renderer: WebGLRenderer
let samplesHasChanged = false
const renderTargets = new Map<string, WebGLRenderTarget | null>()

const getRenderer = (): WebGLRenderer => renderer

const init = (canvas: HTMLCanvasElement): void =>
{
    renderer = new WebGLRenderer({
        canvas,
        depth: false,
        stencil: false
    })

    const width = get(settingsWidth)
    const height = get(settingsHeight)

    renderer.setSize(width, height)
    renderer.setClearColor(0x333333)
    renderer.outputEncoding = sRGBEncoding
    renderer.debug.checkShaderErrors = import.meta.env.DEV

    settings.init(renderer)
    createSceneRenderTarget()
    renderTargets.set("image", null)

    settingsSamples.subscribe(value =>
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
    const samples = get(settingsSamples)
    const width = get(settingsWidth)
    const height = get(settingsHeight)

    const options = {
        samples
    }

    const renderTarget = new WebGLRenderTarget(width, height, options)
    renderTargets.set("scene", renderTarget)
    textureManager.setTexture("scene", renderTarget.texture)

    samplesHasChanged = false
}

const getRenderTarget = (id: string): WebGLRenderTarget | null =>
{
    const renderTarget = renderTargets.get(id)

    if (!renderTarget && renderTarget !== null)
    {
        throw Error(`Render target not found: ${id}`)
    }

    return renderTarget
}

const getSamplesHasChanged = (): boolean => samplesHasChanged

export const rendering = {
    createSceneRenderTarget,
    getRenderer,
    getRenderTarget,
    getSamplesHasChanged,
    init
}
