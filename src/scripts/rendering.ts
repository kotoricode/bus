import { get } from "svelte/store"
import { Camera, Scene, sRGBEncoding, WebGLRenderer, WebGLRenderTarget } from "three"
import { initSettings } from "./settings"
import { shaderManager } from "./shaders/shader-manager"
import { storeSettings} from "./state"
import { textureManager } from "./texture-manager"

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

    const settings = get(storeSettings)
    renderer.setSize(settings.width, settings.height)
    renderer.setClearColor(0x333333)
    renderer.autoClear = false
    renderer.outputEncoding = sRGBEncoding
    renderer.debug.checkShaderErrors = import.meta.env.DEV

    initSettings(renderer)
    createSceneRenderTarget()
    renderTargets.set("image", null)

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

const createSceneRenderTarget = (): void =>
{
    const settings = get(storeSettings)

    const renderTarget = new WebGLRenderTarget(
        settings.width,
        settings.height,
        {
            samples: settings.samples
        }
    )

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

    renderer.clear(true, true)
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

export const rendering = <const>{
    init,
    render,
    update
}
