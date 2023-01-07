import { Mesh, type BufferGeometry, type Material, type Vector3 } from "three"
import { model } from "./model"

export class Character
{
    path: Vector3[] = []
    readonly tags: Set<string> = new Set
    newMesh: Mesh | null = null
    mesh: Mesh

    constructor(geometry: BufferGeometry, material: Material, public readonly speed: number)
    {
        this.mesh = new Mesh(geometry, material)

        model.get("monkey").then(data =>
        {
            this.newMesh = <Mesh>data.scene.children[0]
        })
    }
}
