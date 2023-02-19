import { BoxGeometry, type Color, Group, Material, Mesh, MeshBasicMaterial, ShaderMaterial, Vector2, Vector4, type IUniform } from "three"
import { MeshStandardMaterial } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import type { Entity } from "./entity"
import { materialManager, type MaterialId } from "./materials/material-manager"
import { textureManager } from "./texture-manager"
import { utils } from "./utils"

type Uniform = number | boolean | Color | Vector2 | Vector4

const loader = new GLTFLoader()

const load = async (entity: Entity, fileName: string, materialId: MaterialId, usePlaceHolder: boolean): Promise<void> =>
{
    if (usePlaceHolder && !entity.getObjectByName("meshes"))
    {
        const placeHolder = new Group()
        placeHolder.name = "meshes"
        const placeHolderGeometry = new BoxGeometry(1, 1, 1)
        const placeHolderMaterial = new MeshBasicMaterial({ color: 0xff00ff })
        const placeHolderMesh = new Mesh(placeHolderGeometry, placeHolderMaterial)
        placeHolder.add(placeHolderMesh)
        entity.add(placeHolder)
    }

    return loader.loadAsync(`./models/${fileName}.glb`).then(gltf =>
    {
        const existingMeshes = entity.getObjectByName("meshes")

        if (existingMeshes)
        {
            utils.dispose(existingMeshes)
        }

        for (const child of gltf.scene.children)
        {
            if (child instanceof Mesh && child.material instanceof MeshStandardMaterial)
            {
                const oldMaterial = child.material
                const toonMaterial = materialManager.getMaterial(materialId)

                if (oldMaterial.map)
                {
                    toonMaterial.uniforms.map.value = oldMaterial.map
                    const textureId = `${fileName}-${child.userData.name}`
                    textureManager.setNamedTexture(textureId, oldMaterial.map)
                }

                child.material = toonMaterial
                oldMaterial.dispose()
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
    load,
    setModelUniform
}
