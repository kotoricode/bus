import { ShaderMaterial } from "three"
import { shaderEntity } from "./shader-entity"

let pickingShader: ShaderMaterial

const init = (): void =>
{
    pickingShader = new ShaderMaterial(shaderEntity)
}

const getPickingMaterial = (): ShaderMaterial =>
{
    return pickingShader
}

export const shaderManager = <const>{
    getPickingMaterial,
    init
}
