import { Mesh, Object3D, type BufferGeometry, type Material, type Vector3 } from "three"
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader"
import { model } from "./model"

export class Character
{
    path: Vector3[] = []
    placeholder: Object3D
    model: Object3D
    rotation = 0
    loadModelPromise: Promise<GLTF>
    modelNeedsUpdate = false

    constructor(geometry: BufferGeometry, material: Material, public readonly speed: number)
    {
        this.placeholder = new Mesh(geometry, material)
        this.model = this.placeholder
        this.loadModelPromise = model.get("monkey")
        this.loadModelPromise.then(data =>
        {
            this.model = data.scene
            this.modelNeedsUpdate = true
        })
    }
}
