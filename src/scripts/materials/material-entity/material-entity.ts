import { Color, UniformsLib, UniformsUtils, Vector2 } from "three"
import vertexShader from "./material-entity.vert?raw"
import fragmentShader from "./material-entity.frag?raw"

const uniforms = UniformsUtils.merge([
    UniformsLib.common,
    UniformsLib.aomap,
    UniformsLib.lightmap,
    UniformsLib.emissivemap,
    UniformsLib.bumpmap,
    UniformsLib.normalmap,
    UniformsLib.displacementmap,
    UniformsLib.gradientmap,
    UniformsLib.fog,
    UniformsLib.lights,
    {
        emissive: { value: new Color(0) }
    },
    {
        picking: { value: new Vector2() }
    }
])

export const materialEntity = {
    uniforms,
    vertexShader,
    fragmentShader,
    defines: {
        USE_UV: "",
        USE_MAP: ""
    },
    lights: true
}
