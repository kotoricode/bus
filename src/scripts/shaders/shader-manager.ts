import { ShaderLib, ShaderMaterial } from "three"

let pickingShader: ShaderMaterial
let testShader: ShaderMaterial

const init = (): void =>
{
    pickingShader = new ShaderMaterial({
        uniforms: ShaderLib.standard.uniforms,
        vertexShader: ShaderLib.standard.vertexShader,
        fragmentShader: ShaderLib.standard.fragmentShader
    })

    testShader = new ShaderMaterial({
        uniforms: ShaderLib.basic.uniforms,
        vertexShader: ShaderLib.basic.vertexShader,
        fragmentShader: ShaderLib.basic.fragmentShader,
        defines: {
            USE_UV: "",
            USE_MAP: ""
        }
    })
}

const getPickingMaterial = (): ShaderMaterial =>
{
    return pickingShader
}

export const shaderManager = <const>{
    getPickingMaterial,
    init
}
