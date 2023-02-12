import { UniformsLib } from "three"
import vertexShader from "./shader-image.vert?raw"
import fragmentShader from "./shader-image.frag?raw"

export const shaderImage = {
    uniforms: UniformsLib.common,
    vertexShader,
    fragmentShader,
    defines: {
        USE_UV: "",
        USE_MAP: ""
    }
}
