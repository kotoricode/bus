import { get } from "svelte/store"
import { sRGBEncoding, WebGLRenderer, WebGLRenderTarget } from "three"
import { settings } from "./settings"
import { settingsHeight, settingsSamples, settingsWidth } from "./state"
import { textureManager } from "./texture"

let _renderer: WebGLRenderer
let samplesHasChanged = false
const renderTargets = new Map<string, WebGLRenderTarget | null>()

const getRenderer = (): WebGLRenderer => _renderer

const init = (canvas: HTMLCanvasElement): void =>
{
    _renderer = new WebGLRenderer({
        canvas,
        depth: false,
        stencil: false
    })

    const width = get(settingsWidth)
    const height = get(settingsHeight)

    _renderer.setSize(width, height)
    _renderer.setClearColor(0x333333)
    _renderer.outputEncoding = sRGBEncoding
    _renderer.debug.checkShaderErrors = import.meta.env.DEV

    settings.init(_renderer)
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

export const renderer = {
    createSceneRenderTarget,
    getRenderer,
    getRenderTarget,
    getSamplesHasChanged,
    init
}
