import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader"

const loader = new GLTFLoader()

const get = async (fileName: string): Promise<GLTF> =>
{
    return loader.loadAsync(`./models/${fileName}.glb`)
}

export const model = <const>{
    get
}
