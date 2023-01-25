import "./model"
import { get } from "svelte/store"
import { sRGBEncoding, WebGLRenderer, WebGLRenderTarget } from "three"
import { imageScene } from "../scenes/image"
import { clock } from "./clock"
import { settings } from "./settings"
import {
    fadeStore, loadingStore, sceneStore, settingsHeight, settingsSamples, settingsWidth
} from "./state"
import { textureManager } from "./texture"
import type { GameScene } from "./types"
import { sceneList } from "../scenes/scene-list"
import { mouse } from "./mouse"

let activeScene: GameScene
let renderer: WebGLRenderer
let sceneRenderTarget: WebGLRenderTarget
let samplesHasChanged = false
let pendingScene: GameScene | null = null
let running = false

export const init = (canvas: HTMLCanvasElement): void =>
{
    initRenderer(canvas)
    imageScene.init()
    initListeners()
    running = true
    loop()
}

export const quit = (): void =>
{
    running = false
}

const initListeners = (): void =>
{
    sceneStore.subscribe(sceneKey =>
    {
        pendingScene = sceneList[sceneKey]
    })
}

const initRenderer = (canvas: HTMLCanvasElement): void =>
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

    settingsSamples.subscribe(value =>
    {
        samplesHasChanged = sceneRenderTarget.samples !== value
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

    sceneRenderTarget = new WebGLRenderTarget(width, height, options)

    textureManager.setTexture("scene", sceneRenderTarget.texture)
}

const loop = async (): Promise<void> =>
{
    if (!running)
    {
        return
    }

    if (samplesHasChanged)
    {
        createSceneRenderTarget()
        samplesHasChanged = false
    }

    if (pendingScene)
    {
        activeScene = pendingScene
        fadeStore.set(true)
        loadingStore.set(true)
        await activeScene.init()
        loadingStore.set(false)
        fadeStore.set(false)
        pendingScene = null
    }

    clock.update()
    mouse.update()

    const fade = get(fadeStore)

    if (!fade)
    {
        activeScene.update()
        activeScene.render(renderer, sceneRenderTarget)

        imageScene.update()
        imageScene.render(renderer, null)
    }

    requestAnimationFrame(loop)
}
