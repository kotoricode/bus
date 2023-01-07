import { Mesh, type BufferGeometry, type Material, type Vector3 } from "three"

export class Character
{
    path: Vector3[] = []
    readonly tags: Set<string> = new Set
    readonly mesh: Mesh

    constructor(geometry: BufferGeometry, material: Material, public readonly speed: number)
    {
        this.mesh = new Mesh(geometry, material)
    }
}
