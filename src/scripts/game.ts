import "./model-manager"
import { get } from "svelte/store"
import { time } from "./time"
import { storeFade, storeLoading, storeScene } from "./state"
import { sceneList } from "./scenes/scene-list"
import { rendering } from "./rendering"
import type { GameScene } from "./types"
import { createImageScene } from "./scenes/scene-image"
import { eventManager } from "./events/event-manager"
import { Cache, ColorManagement } from "three"
import { mouse } from "./mouse"
import { modelManager } from "./model-manager"

export const createGame = (canvas: HTMLCanvasElement): (() => void) =>
{
    Cache.enabled = true
    ColorManagement.legacyMode = false

    let currentScene: GameScene | null = null
    let nextScene: keyof typeof sceneList | null = null
    let disposed = false

    time.init()
    mouse.init()
    rendering.init(canvas)
    modelManager.init()

    const imageScene = createImageScene()

    const loop = async (timestamp: number): Promise<void> =>
    {
        if (disposed)
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

            currentScene = await Promise.resolve(sceneList[nextScene]())

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
            imageScene.update()
        }

        requestAnimationFrame(loop)
    }

    storeScene.subscribe(sceneKey =>
    {
        nextScene = sceneKey

        if (!currentScene)
        {
            requestAnimationFrame(loop)
        }
    })

    return (): void =>
    {
        disposed = true
    }
}
