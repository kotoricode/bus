import "./model"
import { get } from "svelte/store"
import { WebGLRenderer, WebGLRenderTarget } from "three"
import { eventManager } from "../events/event-manager"
import { imageScene } from "../scenes/image"
import { clock } from "./clock"
import { settings } from "./settings"
import {
    fadeStore, sceneStore, settingsHeight, settingsSamples, settingsWidth
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
let running = true

export const init = (canvas: HTMLCanvasElement): void =>
{
    initRenderer(canvas)

    imageScene.init()

    sceneStore.subscribe(sceneKey =>
    {
        pendingScene = sceneList[sceneKey]
    })

    running = true
    loop()
}

export const click = (event: MouseEvent): void =>
{
    mouse.setEvent(event)
}

export const quit = (): void =>
{
    running = false
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
    renderer.setClearColor(0x888888)

    settings.init(renderer)
    createSceneRenderTarget()

    settingsSamples.subscribe(value =>
    {
        if (sceneRenderTarget.samples !== value)
        {
            samplesHasChanged = true
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

    sceneRenderTarget = new WebGLRenderTarget(width, height, options)

    textureManager.setTexture("scene", sceneRenderTarget.texture)
}

const loop = async (): Promise<void> =>
{
    if (!running)
    {
        if (renderer.getContext())
        {
            renderer.forceContextLoss()
        }

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
        pendingScene = null
        await activeScene.init()
        fadeStore.set(false)
    }

    clock.update()
    mouse.update()

    const fade = get(fadeStore)

    if (!fade)
    {
        eventManager.update()

        activeScene.update()
        activeScene.render(renderer, sceneRenderTarget)

        imageScene.update()
        imageScene.render(renderer, null)
    }

    requestAnimationFrame(loop)
}
