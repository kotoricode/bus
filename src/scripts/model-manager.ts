import { BoxGeometry, Mesh, MeshBasicMaterial } from "three"
import type { MeshStandardMaterial } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import type { Entity } from "./entity"
import { materialManager } from "./materials/material-manager"

let loader: GLTFLoader

const init = (): void =>
{
    loader = new GLTFLoader()
}

const load = async (entity: Entity, fileName: string): Promise<void> =>
{
    let placeHolder: Mesh

    if (!entity.userData.hasMesh)
    {
        const placeHolderGeometry = new BoxGeometry(1, 1, 1)
        const placeHolderMaterial = new MeshBasicMaterial({ color: 0xff00ff })
        placeHolder = new Mesh(placeHolderGeometry, placeHolderMaterial)
        entity.add(placeHolder)
        entity.userData.hasMesh = true
    }

    return loader.loadAsync(`./models/${fileName}.glb`).then(gltf =>
    {
        if (placeHolder)
        {
            entity.remove(placeHolder)
        }

        for (const child of <Mesh[]>gltf.scene.children)
        {
            const toonMaterial = materialManager.getEntityMaterial()
            toonMaterial.uniforms.map.value = (<MeshStandardMaterial>child.material).map
            child.material = toonMaterial
        }

        entity.add(gltf.scene)
    })
}

export const modelManager = <const>{
    init,
    load
}
