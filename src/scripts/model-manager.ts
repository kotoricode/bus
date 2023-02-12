import { BoxGeometry, Color, Group, Material, Mesh, MeshBasicMaterial, ShaderMaterial, Vector2, Vector4, type IUniform } from "three"
import type { MeshStandardMaterial } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import type { Entity } from "./entity"
import { materialManager } from "./materials/material-manager"

let loader: GLTFLoader
type Uniform = number | boolean | Color | Vector2 | Vector4

const init = (): void =>
{
    loader = new GLTFLoader()
}

const load = async (entity: Entity, fileName: string): Promise<void> =>
{
    let placeHolder: Group
    let placeHolderGeometry: BoxGeometry
    let placeHolderMaterial: MeshBasicMaterial

    if (!entity.getObjectByName("meshes"))
    {
        placeHolder = new Group()
        placeHolderGeometry = new BoxGeometry(1, 1, 1)
        placeHolderMaterial = new MeshBasicMaterial({ color: 0xff00ff })
        const placeHolderMesh = new Mesh(placeHolderGeometry, placeHolderMaterial)
        placeHolder.add(placeHolderMesh)
        entity.add(placeHolder)
    }

    return loader.loadAsync(`./models/${fileName}.glb`).then(gltf =>
    {
        if (placeHolder)
        {
            entity.remove(placeHolder)
            placeHolderGeometry.dispose()
            placeHolderMaterial.dispose()
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

const setModelUniform = (entity: Entity, uniformKey: string, uniformValue: Uniform): void =>
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

const setMaterialUniform = (material: Material, uniformKey: string, uniformValue: Uniform): void =>
{
    if (material instanceof ShaderMaterial)
    {
        setUniformValue(material.uniforms[uniformKey], uniformValue)
    }
}

const setUniformValue = (uniform: IUniform, value: Uniform): void =>
{
    if (typeof uniform.value === "object")
    {
        uniform.value.copy(value)
    }
    else
    {
        uniform.value = value
    }
}

export const modelManager = <const>{
    init,
    load,
    setModelUniform
}
