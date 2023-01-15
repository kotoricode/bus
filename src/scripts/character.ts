import {
    Mesh, Object3D, type BufferGeometry, type Material, type Vector3
} from "three"
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader"
import { model } from "./model"

export class Character
{
    path: Vector3[] = []
    placeholder: Object3D
    mesh: Object3D
    rotation = 0
    loadMeshPromise: Promise<GLTF>
    meshNeedsUpdating = false

    constructor(
        geometry: BufferGeometry,
        material: Material,
        public readonly speed: number
    )
    {
        this.placeholder = new Mesh(geometry, material)
        this.mesh = this.placeholder
        this.loadMeshPromise = model.get("monkey")
        this.loadMeshPromise.then(data =>
        {
            this.mesh = data.scene
            this.meshNeedsUpdating = true
        })
    }
}
