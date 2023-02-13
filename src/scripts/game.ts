import "./model-manager"
import { get } from "svelte/store"
import { time } from "./time"
import { store } from "./store"
import { sceneList } from "./scenes/scene-list"
import { rendering } from "./rendering"
import type { GameScene } from "./types"
import { createImageScene } from "./scenes/scene-image"
import { eventManager } from "./events/event-manager"
import { Cache, ColorManagement } from "three"

export const createGame = (canvas: HTMLCanvasElement): (() => void) =>
{
    Cache.enabled = true
    ColorManagement.legacyMode = false

    let currentScene: GameScene | null = null
    let nextScene: keyof typeof sceneList | null = null
    let disposed = false

    rendering.init(canvas)

    const imageScene = createImageScene()

    const loop = async (timestamp: number): Promise<void> =>
    {
        if (disposed)
        {
            rendering.dispose( )

            return
        }

        if (nextScene)
        {
            if (currentScene)
            {
                eventManager.clear()
                store.fade.set(true)
                store.loading.set(true)
            }

            currentScene = await Promise.resolve(sceneList[nextScene]())

            store.loading.set(false)
            store.fade.set(false)
            nextScene = null
        }
        else if (!currentScene)
        {
            disposed = true

            return
        }

        rendering.update()
        time.update(timestamp)

        const fade = get(store.fade)

        if (!fade)
        {
            currentScene.update()
            imageScene.update()
        }

        requestAnimationFrame(loop)
    }

    store.scene.subscribe(sceneKey =>
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
