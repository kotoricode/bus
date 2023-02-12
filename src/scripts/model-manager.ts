import { BoxGeometry, Group, Material, Mesh, MeshBasicMaterial, ShaderMaterial } from "three"
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
    let placeHolder: Group

    if (!entity.getObjectByName("meshes"))
    {
        placeHolder = new Group()
        const placeHolderGeometry = new BoxGeometry(1, 1, 1)
        const placeHolderMaterial = new MeshBasicMaterial({ color: 0xff00ff })
        const mesh = new Mesh(placeHolderGeometry, placeHolderMaterial)
        placeHolder.add(mesh)
        entity.add(placeHolder)
    }

    return loader.loadAsync(`./models/${fileName}.glb`).then(gltf =>
    {
        if (placeHolder)
        {
            entity.remove(placeHolder)
        }

        for (const child of gltf.scene.children)
        {
            if (child instanceof Mesh)
            {
                const toonMaterial = materialManager.getMaterial("entity")
                toonMaterial.uniforms.map.value = (<MeshStandardMaterial>child.material).map
                child.material = toonMaterial
            }
        }

        gltf.scene.name = "meshes"
        entity.add(gltf.scene)
    })
}

const setModelUniform = (entity: Entity, uniformKey: string, uniformValue: number): void =>
{
    const meshGroup = <Group | undefined>entity.getObjectByName("meshes")

    if (!meshGroup)
    {
        throw Error("Missing mesh group")
    }

    for (const child of meshGroup.children)
    {
        if (child instanceof Mesh)
        {
            if (Array.isArray(child.material))
            {
                for (const material of child.material)
                {
                    setMaterialUniform(material, uniformKey, uniformValue)
                }
            }
            else
            {
                setMaterialUniform(child.material, uniformKey, uniformValue)
            }
        }
    }
}

const setMaterialUniform = (material: Material, uniformKey: string, uniformValue: number): void =>
{
    if (material instanceof ShaderMaterial)
    {
        material.uniforms[uniformKey].value = uniformValue
    }
}

export const modelManager = <const>{
    init,
    load,
    setModelUniform
}
