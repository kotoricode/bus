import { get } from "svelte/store"
import {
    AmbientLight, Color, DirectionalLight,
    Scene, Triangle, Vector3
} from "three"
import { eventManager } from "../events/event-manager"
import { WorldCamera } from "../camera/world-camera"
import { Entity } from "../entity"
import { store } from "../store"
import { EntityManager } from "../entity-manager"
import { modelManager } from "../model-manager"
import { ComponentMovement } from "../components/component-movement"
import { taskUpdateCamera } from "../tasks/task-update-camera"
import { taskHandleClick } from "../tasks/task-handle-click"
import { taskUpdateTransforms } from "../tasks/task-update-transforms"
import { taskRender } from "../tasks/task-render"
import { ComponentCollider } from "../components/component-collider"
import { taskUpdateMouse } from "../tasks/task-update-mouse"
import { ComponentPicking } from "../components/component-picking"
import { NavMesh } from "../nav-mesh"
import { taskPickEntity } from "../tasks/task-pick-entity"
import type { GameScene } from "../types"

export const sceneBusStop = async (): Promise<GameScene> =>
{
    const scene = new Scene()
    const root = new Entity()
    scene.add(root)
    const entityManager = new EntityManager(root)

    const _createNavMesh = (): NavMesh =>
    {
        const createTriangles = (): Triangle[] =>
        {
            const x = 4
            const triangles = []

            const test: Vector3[] = Array((x + 1) ** 2)
                .fill(0)
                .map((_, i) => new Vector3(
                    i % (x + 1),
                    0,
                    i / (x + 1) | 0
                ))

            for (let i = 0; i < 2 * x ** 2; i++)
            {
                if (i > 9 && i < 16 || i === 18 || i === 22 || i === 27)
                {
                    continue
                }

                let triangle: Triangle

                if (i % 2)
                {
                    const tl = (i / 2 | 0) + (i / (2 * x) | 0) % x
                    const bl = tl + x + 1
                    const tr = tl + 1
                    const br = bl + 1

                    triangle = new Triangle(
                        test[tr],
                        test[bl],
                        test[br]
                    )
                }
                else
                {

                    const tl = (i / 2 | 0) + (i / (2 * x) | 0) % x
                    const bl = tl + x + 1
                    const tr = tl + 1

                    triangle = new Triangle(
                        test[tl],
                        test[bl],
                        test[tr]
                    )
                }

                triangles.push(triangle)
            }

            return triangles
        }

        const _navMesh = new NavMesh("sceneBusStop", createTriangles)
        const debugGrid = _navMesh.getGridDebugObject()
        entityManager.addDebug("root", debugGrid)

        return _navMesh
    }

    const createLights = (): void =>
    {
        const light = new DirectionalLight(new Color(1, 1, 1))
        scene.add(light)

        const ambientLight = new AmbientLight(new Color(0.05, 0.05, 0.1))
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

    const navMesh = _createNavMesh()

    const player = new Entity()
    const collider = new ComponentCollider(0.25, 1.5)
    const movement = new ComponentMovement(0.0014)
    const picking = new ComponentPicking()
    player.addComponents(collider, movement, picking)
    entityManager.addEntity("player", "root", player)

    const colliderDebug = collider.getDebugObject()
    entityManager.addDebug("player", colliderDebug)

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
        taskHandleClick(entityManager, camera, navMesh, player),
        taskUpdateTransforms(entityManager),
        taskUpdateCamera(camera),
        taskRender(scene, camera, "renderTargetScene")
    ]

    const modelsLoaded = [
        modelManager.load(player, "monkey", "materialEntity", true),
        modelManager.load(ground, "grass", "materialEntity", false)
    ]

    await Promise.all(modelsLoaded)

    return <const>{
        scene,
        update
    }
}
