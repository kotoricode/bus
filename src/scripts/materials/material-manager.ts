import { ShaderMaterial } from "three"
import { materialEntity } from "./material-entity/material-entity"
import { materialImage } from "./material-image/material-image"

const materials = {
    materialEntity,
    materialImage
}

export type MaterialId = keyof typeof materials

const getMaterial = (key: MaterialId): ShaderMaterial =>
    new ShaderMaterial(materials[key])

export const materialManager = <const>{
    getMaterial
}
