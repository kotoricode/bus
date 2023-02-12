import { UniformsLib } from "three"
import vertexShader from "./material-image.vert?raw"
import fragmentShader from "./material-image.frag?raw"

export const materialImage = {
    uniforms: UniformsLib.common,
    vertexShader,
    fragmentShader,
    defines: {
        USE_UV: "",
        USE_MAP: ""
    }
}
