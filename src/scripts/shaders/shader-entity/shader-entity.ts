import { Color, UniformsLib, UniformsUtils } from "three"
import vertexShader from "./shader-entity.vert?raw"
import fragmentShader from "./shader-entity.frag?raw"

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
    }
])

export const shaderEntity = {
    uniforms,
    vertexShader,
    fragmentShader,
    defines: {
        USE_UV: "",
        USE_MAP: ""
    },
    lights: true
}
