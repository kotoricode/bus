import { get } from "svelte/store"
import { AmbientLight, Color, DirectionalLight, Scene, Vector3 } from "three"
import { eventManager } from "../events/event-manager"
import { WorldCamera } from "../camera/world-camera"
import { Entity } from "../entity"
import { store } from "../store"
import { EntityManager } from "../entity-manager"
import { modelManager } from "../model-manager"
import { ComponentMovement } from "../components/component-movement"
import { taskUpdateCamera } from "../tasks/task-update-camera"
import { taskUpdateTransforms } from "../tasks/task-update-transforms"
import { taskRender } from "../tasks/task-render"
import { taskUpdateMouse } from "../tasks/task-update-mouse"
import { ComponentPicking } from "../components/component-picking"
import { taskPickEntity } from "../tasks/task-pick-entity"
import type { GameScene } from "../types"

class Tile
{
    entity: Entity
    type = "round"
    next: Tile[] = []

    constructor()
    {
        this.entity = new Entity()
    }
}

export const sceneBoard = async (): Promise<GameScene> =>
{
    const scene = new Scene()
    const root = new Entity()
    scene.add(root)
    const entityManager = new EntityManager(root)

    const createLights = (): void =>
    {
        const light = new DirectionalLight(new Color(1, 1, 1))
        scene.add(light)

        const ambientLight = new AmbientLight(new Color(1, 0.05, 0.1))
        scene.add(ambientLight)
    }

    const update = (): void =>
    {
        const dialogue = get(store.dialogue)

        if (dialogue)
        {
            return
        }

        if (eventManager.active())
        {
            eventManager.update()
        }

        for (const task of tasks)
        {
            task()
        }
    }

    const player = new Entity()
    const movement = new ComponentMovement(0.0014)
    const picking = new ComponentPicking()
    player.addComponents(movement, picking)
    entityManager.addEntity("player", "root", player)

    const camera = new WorldCamera(
        new Vector3(0, 4.6, 5.2),
        45,
        {
            min: new Vector3(-100, -100, -100),
            max: new Vector3(2, 100, 100)
        }
    )

    const ground = new Entity()
    entityManager.addEntity("ground", "root", ground)

    camera.jumpTo(player.position)
    camera.track(player)

    createLights()

    const tasks = [
        taskUpdateMouse(),
        taskPickEntity(scene, entityManager, camera),
        taskUpdateTransforms(entityManager),
        taskUpdateCamera(camera),
        taskRender(scene, camera, "renderTargetScene")
    ]

    const t1 = new Entity()
    entityManager.addEntity("t1", "root", t1)

    const modelsLoaded = [
        modelManager.load(player, "monkey", "materialEntity", true),
        modelManager.load(ground, "grass", "materialEntity", false),
        modelManager.load(t1, "tile-round", "materialEntity", false)
    ]

    await Promise.all(modelsLoaded)

    return <const>{
        scene,
        update
    }
}
