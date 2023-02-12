import "./model-manager"
import { get } from "svelte/store"
import { time } from "./time"
import { storeFade, storeLoading, storeScene } from "./state"
import { sceneList } from "./scenes/scene-list"
import { rendering } from "./rendering"
import type { GameScene } from "./types"
import { sceneImage } from "./scenes/scene-image"
import { eventManager } from "./events/event-manager"
import { Cache, ColorManagement } from "three"
import { mouse } from "./mouse"
import { modelManager } from "./model-manager"

let currentScene: GameScene | null
let nextScene: GameScene | null
let destroyed: boolean

export const destroy = (): void =>
{
    destroyed = true
}

export const init = (canvas: HTMLCanvasElement): void =>
{
    Cache.enabled = true
    ColorManagement.legacyMode = false

    currentScene = null
    nextScene = null
    destroyed = false

    time.init()
    mouse.init()
    rendering.init(canvas)
    modelManager.init()
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

const loop = async (timestamp: number): Promise<void> =>
{
    if (destroyed)
    {
        if (import.meta.env.DEV)
        {
            rendering.destroy()
        }

        return
    }

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
    time.update(timestamp)

    const fade = get(storeFade)

    if (!fade)
    {
        currentScene.update()
        sceneImage.update()
    }

    requestAnimationFrame(loop)
}

export const game = <const>{
    destroy,
    init
}
