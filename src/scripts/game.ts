import "./model-manager"
import { get } from "svelte/store"
import { clock } from "./clock"
import { storeFade, storeLoading, storeScene } from "./state"
import { sceneList } from "./scenes/scene-list"
import { mouse } from "./mouse"
import { rendering } from "./rendering"
import type { GameScene } from "./types"
import { sceneImage } from "./scenes/scene-image"
import { eventManager } from "./events/event-manager"
import { Cache } from "three"
import { shaderManager } from "./shaders/shader-manager"

Cache.enabled = true

let activeScene: GameScene
let pendingScene: GameScene | null = null

let running = false

export const init = (canvas: HTMLCanvasElement): void =>
{
    rendering.init(canvas)
    shaderManager.init()
    sceneImage.init()
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
    storeScene.subscribe(sceneKey =>
    {
        pendingScene = sceneList[sceneKey]

        if (!pendingScene)
        {
            throw Error("No such scene")
        }
    })
}

const loop = async (): Promise<void> =>
{
    if (!running)
    {
        return
    }

    if (pendingScene)
    {
        eventManager.clear()
        activeScene = pendingScene
        storeFade.set(true)
        storeLoading.set(true)
        await activeScene.init()
        storeLoading.set(false)
        storeFade.set(false)
        pendingScene = null
    }

    rendering.update()
    clock.update()
    mouse.update()

    const fade = get(storeFade)

    if (!fade)
    {
        activeScene.update()
        sceneImage.update()
    }

    requestAnimationFrame(loop)
}
