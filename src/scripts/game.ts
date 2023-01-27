import "./model"
import { get } from "svelte/store"
import { clock } from "./clock"
import { fadeStore, loadingStore, sceneStore } from "./state"
import { sceneList } from "./scenes/scene-list"
import { mouse } from "./mouse"
import { rendering } from "./renderer"
import type { GameScene } from "./types"
import { sceneImage } from "./scenes/scene-image"

let activeScene: GameScene
let pendingScene: GameScene | null = null

let running = false

export const init = (canvas: HTMLCanvasElement): void =>
{
    rendering.init(canvas)
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
    sceneStore.subscribe(sceneKey =>
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
        activeScene = pendingScene
        fadeStore.set(true)
        loadingStore.set(true)
        await activeScene.init()
        loadingStore.set(false)
        fadeStore.set(false)
        pendingScene = null
    }

    rendering.update()
    clock.update()
    mouse.update()

    const fade = get(fadeStore)

    if (!fade)
    {
        activeScene.update()
        sceneImage.update()
    }

    requestAnimationFrame(loop)
}
