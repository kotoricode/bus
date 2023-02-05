import { Line3, type Vector3 } from "three"
import { ComponentMovement } from "../components/component-movement"
import type { Entity } from "../entity"
import type { NavMesh } from "../nav-mesh"

export const eventPath = (entity: Entity, navMesh: NavMesh, target: Vector3): () => boolean =>
{
    let initialized = false
    const segment = new Line3()
    segment.end.copy(target)
    const movement = entity.getComponent(ComponentMovement)

    if (!movement)
    {
        throw Error
    }

    return (): boolean =>
    {
        if (!initialized)
        {
            initialized = true
            segment.start.copy(entity.position)
            movement.path = navMesh.getPath(segment) ?? [segment.start, segment.end]
        }

        return !movement.path.length
    }
}
