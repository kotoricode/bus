import { BoxGeometry, type Color, Group, Mesh, MeshBasicMaterial, ShaderMaterial, Vector2, Vector4, type IUniform, Object3D } from "three"
import { MeshStandardMaterial } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import type { Entity } from "./entity"
import { materialManager, type MaterialId } from "./materials/material-manager"
import { textureManager } from "./texture-manager"
import { utils } from "./utils"

type Uniform = number | boolean | Color | Vector2 | Vector4

const loader = new GLTFLoader()
const meshGroupName = "meshGroup"

const createPlaceHolder = (entity: Entity): void =>
{
    const placeHolder = new Group()
    placeHolder.name = meshGroupName
    const placeHolderGeometry = new BoxGeometry(1, 1, 1)
    const placeHolderMaterial = new MeshBasicMaterial({ color: 0xff00ff })
    const placeHolderMesh = new Mesh(placeHolderGeometry, placeHolderMaterial)
    placeHolder.add(placeHolderMesh)
    entity.add(placeHolder)
}

const load = async (entity: Entity, fileName: string, materialId: MaterialId, usePlaceHolder: boolean): Promise<void> =>
{
    if (usePlaceHolder && !entity.getObjectByName(meshGroupName))
    {
        createPlaceHolder(entity)
    }

    return loader.loadAsync(`./models/${fileName}.glb`).then(gltf =>
    {
        const existingMeshes = entity.getObjectByName(meshGroupName)

        if (existingMeshes)
        {
            utils.dispose(existingMeshes)
        }

        gltf.scene.traverse(object =>
        {
            if (object instanceof Mesh && object.material instanceof MeshStandardMaterial)
            {
                const oldMaterial = object.material
                const toonMaterial = materialManager.getMaterial(materialId)

                if (oldMaterial.map)
                {
                    toonMaterial.uniforms.map.value = oldMaterial.map
                    const textureId = `${fileName}-${object.userData.name}`
                    textureManager.setNamedTexture(textureId, oldMaterial.map)
                }

                object.material = toonMaterial
                oldMaterial.dispose()
            }
        })

        gltf.scene.name = meshGroupName
        entity.add(gltf.scene)
    })
}

const getMeshGroup = (entity: Entity): Object3D =>
{
    const meshes = entity.getObjectByName(meshGroupName)

    if (!meshes)
    {
        throw Error("Missing meshes")
    }

    return meshes
}

const setModelUniform = (entity: Entity, uniformKey: string, uniformValue: Uniform): void =>
{
    entity.traverse(object =>
    {
        if (object instanceof Mesh && object.material instanceof ShaderMaterial)
        {
            setUniformValue(object.material.uniforms[uniformKey], uniformValue)
        }
    })
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
    getMeshGroup,
    load,
    setModelUniform
}
