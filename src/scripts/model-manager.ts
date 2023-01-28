import { BoxGeometry, Mesh, MeshBasicMaterial } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import type { Entity } from "./entity"

const loader = new GLTFLoader()

const load = async (entity: Entity, fileName: string): Promise<void> =>
{
    let placeHolder: Mesh

    if (!entity.object.getObjectByName("mesh"))
    {
        const placeHolderGeometry = new BoxGeometry(1, 1, 1)
        const placeHolderMaterial = new MeshBasicMaterial({ color: 0xff00ff })
        placeHolder = new Mesh(placeHolderGeometry, placeHolderMaterial)
        entity.object.add(placeHolder)
    }

    return loader.loadAsync(`./models/${fileName}.glb`).then(gltf =>
    {
        if (placeHolder)
        {
            entity.object.remove(placeHolder)
        }

        gltf.scene.name = "mesh"
        entity.object.add(gltf.scene)
    })
}

export const modelManager = <const>{
    load
}
