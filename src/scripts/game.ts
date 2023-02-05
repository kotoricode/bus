import "./model-manager"
import { get } from "svelte/store"
import { clock } from "./clock"
import { storeFade, storeLoading, storeScene } from "./state"
import { sceneList } from "./scenes/scene-list"
import { rendering } from "./rendering"
import type { GameScene } from "./types"
import { sceneImage } from "./scenes/scene-image"
import { eventManager } from "./events/event-manager"
import { Cache } from "three"

let currentScene: GameScene | null
let nextScene: GameScene | null

export const init = (canvas: HTMLCanvasElement): void =>
{
    Cache.enabled = true
    currentScene = null
    nextScene = null

    rendering.init(canvas)
    sceneImage.init()

    storeScene.subscribe(sceneKey =>
    {
        nextScene = sceneList[sceneKey]

        if (!currentScene)
        {
            requestAnimationFrame(loop)
        }
    })
}

const loop = async (): Promise<void> =>
{
    if (nextScene)
    {
        if (currentScene)
        {
            eventManager.clear()
            storeFade.set(true)
            storeLoading.set(true)
        }

        currentScene = nextScene
        await currentScene.init()

        storeLoading.set(false)
        storeFade.set(false)
        nextScene = null
    }
    else if (!currentScene)
    {
        return
    }

    rendering.update()
    clock.update()

    const fade = get(storeFade)

    if (!fade)
    {
        currentScene.update()
        sceneImage.update()
    }

    requestAnimationFrame(loop)
}
