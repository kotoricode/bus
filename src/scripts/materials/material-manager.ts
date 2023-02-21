import { ShaderMaterial } from "three"
import { materialEntity } from "./material-entity/material-entity"
import { materialImage } from "./material-image/material-image"

const materials = {
    materialEntity: new ShaderMaterial(materialEntity),
    materialImage: new ShaderMaterial(materialImage)
}

export type MaterialId = keyof typeof materials

const getMaterial = (key: MaterialId): ShaderMaterial =>
    materials[key].clone()

export const materialManager = <const>{
    getMaterial
}
