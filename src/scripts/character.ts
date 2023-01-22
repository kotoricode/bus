import {
    BoxGeometry, Mesh, MeshBasicMaterial, Object3D, Vector3, } from "three"
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader"
import { model } from "./model"

export class Character
{
    path: Vector3[] = []
    mesh: Object3D
    pendingMesh: Object3D | null = null
    position = new Vector3()
    rotation = 0
    targetRotation = 0
    loadMeshPromise: Promise<GLTF>

    constructor(readonly modelName: string, public readonly speed: number)
    {
        const placeHolderGeometry = new BoxGeometry(1, 1, 1)
        const placeHolderMaterial = new MeshBasicMaterial({
            color: 0x00ff00
        })

        this.mesh = new Mesh(placeHolderGeometry, placeHolderMaterial)

        this.loadMeshPromise = model.get(modelName)
        this.loadMeshPromise.then(data =>
        {
            this.pendingMesh = data.scene
        })
    }

    updateMeshTransform(): void
    {
        if (!this.mesh.position.equals(this.position))
        {
            this.mesh.position.copy(this.position)
        }

        if (this.mesh.rotation.y !== this.rotation)
        {
            this.mesh.rotation.y = this.rotation
        }
    }
}
