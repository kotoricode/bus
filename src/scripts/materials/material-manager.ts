import { ShaderMaterial } from "three"
import { shaderEntity } from "./material-entity/material-entity"
import { shaderImage } from "./material-image/material-image"

let entityMaterial: ShaderMaterial
let imageMaterial: ShaderMaterial

const init = (): void =>
{
    entityMaterial = new ShaderMaterial(shaderEntity)
    imageMaterial = new ShaderMaterial(shaderImage)
}

const getEntityMaterial = (): ShaderMaterial => entityMaterial

const getImageMaterial = (): ShaderMaterial => imageMaterial

export const materialManager = <const>{
    getEntityMaterial,
    getImageMaterial,
    init
}
