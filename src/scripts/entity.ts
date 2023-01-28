import { Object3D, Vector3 } from "three"

export class Entity
{
    path: Vector3[] = []
    object = new Object3D()
    targetRotation = 0
    speed = 0
}
