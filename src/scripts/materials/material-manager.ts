import { ShaderMaterial } from "three"
import { materialEntity } from "./material-entity/material-entity"
import { materialImage } from "./material-image/material-image"

let materials: Map<string, ShaderMaterial>

const getMaterial = (key: string): ShaderMaterial =>
{
    const material = materials.get(key)

    if (!material)
    {
        throw Error("Missing material")
    }

    return material
}

const init = (): void =>
{
    materials = new Map([
        ["entity", new ShaderMaterial(materialEntity)],
        ["image", new ShaderMaterial(materialImage)]
    ])
}

export const materialManager = <const>{
    getMaterial,
    init
}
