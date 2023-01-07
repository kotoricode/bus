import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader"

const loader = new GLTFLoader()
const cache = new Map<string, Promise<GLTF>>()

const get = async (fileName: string): Promise<GLTF> =>
{
    const cached = cache.get(fileName)

    if (cached)
    {
        return cached
    }

    const promise = loader.loadAsync(`./models/${fileName}.glb`)
    cache.set(fileName, promise)

    return promise
}

export const model = <const>{
    get
}
