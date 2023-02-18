import "./model-manager"
import { time } from "./time"
import { store } from "./store"
import { sceneList } from "./scenes/scene-list"
import { rendering } from "./rendering"
import type { GameScene } from "./types"
import { sceneImage } from "./scenes/scene-image"
import { Cache, ColorManagement, MathUtils } from "three"
import { get } from "svelte/store"

export const createGame = (canvas: HTMLCanvasElement): (() => void) =>
{
    Cache.enabled = true
    ColorManagement.legacyMode = false

    let currentScene: GameScene | null = null
    let pendingScene: GameScene | null = null
    let nextSceneId: keyof typeof sceneList | null = null
    let disposed = false

    rendering.init(canvas)

    const imageScene = sceneImage()

    const loadScene = async (sceneId: keyof typeof sceneList): Promise<void> =>
    {
        store.loading.set(true)
        const scene = sceneList[sceneId]()
        pendingScene = await Promise.resolve(scene)
        store.loading.set(false)
    }

    const updateFade = (): boolean =>
    {
        const amount = get(store.fadeAmount)
        const target = get(store.fadeTarget)

        if (amount !== target)
        {
            const direction = target * 2 - 1
            const deltaTime = time.getDelta()
            const delta = deltaTime * direction / 500

            const newAmount = MathUtils.clamp(amount + delta, 0, 1)
            store.fadeAmount.set(newAmount)
        }
        else if (amount === 1 && nextSceneId)
        {
            loadScene(nextSceneId)
            nextSceneId = null
        }

        return !!target
    }

    const loop = async (timestamp: number): Promise<void> =>
    {
        if (disposed)
        {
            sceneChangeUnsubscribe()
            rendering.dispose()

            return
        }

        if (pendingScene)
        {
            currentScene = pendingScene
            pendingScene = null
            store.fadeTarget.set(0)
        }

        time.update(timestamp)
        const fadingOut = updateFade()
        rendering.update()

        if (currentScene && !fadingOut)
        {
            currentScene.update()
            imageScene.update()
        }

        requestAnimationFrame(loop)
    }

    requestAnimationFrame(loop)

    const sceneChangeUnsubscribe = store.scene.subscribe(async sceneId =>
    {
        nextSceneId = sceneId
    })

    return (): void =>
    {
        disposed = true
    }
}
