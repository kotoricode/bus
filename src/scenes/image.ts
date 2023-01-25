import { get } from "svelte/store"
import {
    Mesh, MeshBasicMaterial, OrthographicCamera, PlaneGeometry, Scene, Vector2,
    WebGLRenderer, WebGLRenderTarget
} from "three"
import { settingsHeight, settingsWidth } from "../scripts/state"
import { textureManager } from "../scripts/texture"
import type { GameScene } from "../scripts/types"

let scene: Scene
let camera: OrthographicCamera
let quadMaterial: MeshBasicMaterial

const init = async (): Promise<void> =>
{
    scene = new Scene()

    const width = get(settingsWidth)
    const height = get(settingsHeight)
    const size = new Vector2()

    if (width > height)
    {
        size.set(width / height, 1)
    }
    else
    {
        size.set(1, width / height)
    }

    camera = new OrthographicCamera(
        -size.x / 2,
        size.x / 2,
        size.y / 2,
        -size.y / 2
    )

    camera.position.z = 1

    const quadGeometry = new PlaneGeometry(size.x, size.y)
    const map = textureManager.getTexture("scene")

    quadMaterial = new MeshBasicMaterial({
        map
    })

    const quad = new Mesh(quadGeometry, quadMaterial)
    scene.add(quad)
}

const render = (renderer: WebGLRenderer, renderTarget: WebGLRenderTarget | null): void =>
{
    quadMaterial.map = textureManager.getTexture("scene")
    renderer.setRenderTarget(renderTarget)
    renderer.render(scene, camera)
}

const update = (): void =>
{
    //
}

export const imageScene: GameScene = <const>{
    init,
    render,
    update
}
