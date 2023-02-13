import { ShaderMaterial } from "three"
import { materialEntity } from "./material-entity/material-entity"
import { materialImage } from "./material-image/material-image"

const materials = new Map<string, ShaderMaterial>([
    ["entity", new ShaderMaterial(materialEntity)],
    ["image", new ShaderMaterial(materialImage)]
])

const getMaterial = (key: string): ShaderMaterial =>
{
    const material = materials.get(key)

    if (!material)
    {
        throw Error("Missing material")
    }

    return material
}

export const materialManager = <const>{
    getMaterial
}
