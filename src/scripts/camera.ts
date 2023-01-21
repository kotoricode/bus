import { MathUtils, PerspectiveCamera, Vector3,  } from "three"
import type { Character } from "./character"
import { clock } from "./clock"

const getSceneCamera = (): PerspectiveCamera => gameCamera

const init = (aspectRatio: number): void =>
{
    gameCamera = new PerspectiveCamera(45, aspectRatio, 1, 50)
    groundPosition.copy(gameCamera.position)
    gameCamera.position.add(offset)
    gameCamera.rotation.x = MathUtils.degToRad(-45)
}

const jumpTo = (target: Vector3): void =>
{
    gameCamera.position.copy(target).add(offset)
}

const track = (target: Character): void =>
{
    trackTarget = target
}

const update = (): void =>
{
    if (!trackTarget)
    {
        return
    }

    const delta = trackTarget.mesh.position.clone().sub(groundPosition)
    const distance = delta.length()

    if (!distance)
    {
        return
    }

    const minDistance = 0.02
    const stepMultiplier = 3
    const deltaTime = clock.getDeltaTime()
    const step = Math.max(minDistance, distance) * stepMultiplier * deltaTime

    if (step < distance)
    {
        const multiplier = step / distance
        delta.multiplyScalar(multiplier)
        groundPosition.add(delta)
    }
    else
    {
        groundPosition.copy(trackTarget.mesh.position)
    }

    gameCamera.position.copy(groundPosition).add(offset)
}

let gameCamera: PerspectiveCamera
const offset = new Vector3(0, 12, 12)
let trackTarget: Character | null = null
const groundPosition = new Vector3()

export const camera = <const>{
    getSceneCamera,
    init,
    jumpTo,
    track,
    update
}
