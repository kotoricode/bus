import { ShaderMaterial } from "three"
import { shaderEntity } from "./shader-entity"
import { shaderImage } from "./shader-image"

let imageShader: ShaderMaterial
let pickingShader: ShaderMaterial

const init = (): void =>
{
    imageShader = new ShaderMaterial(shaderImage)
    pickingShader = new ShaderMaterial(shaderEntity)
}

const getImageMaterial = (): ShaderMaterial => imageShader

const getPickingMaterial = (): ShaderMaterial => pickingShader

export const shaderManager = <const>{
    getImageMaterial,
    getPickingMaterial,
    init
}
