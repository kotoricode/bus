import { BufferGeometry, Light, Material, Mesh, type Object3D } from "three"

const dispose = (object: Object3D): void =>
{
    const objects: Object3D[] = [object]

    while (objects.length)
    {
        const currentObject = objects.pop()

        if (!currentObject)
        {
            throw Error
        }

        if (currentObject.parent)
        {
            currentObject.removeFromParent()
        }

        if (currentObject instanceof Light)
        {
            currentObject.dispose()
        }
        else if (currentObject instanceof Mesh && !currentObject.userData.preserve)
        {
            if (currentObject.geometry instanceof BufferGeometry)
            {
                currentObject.geometry.dispose()
            }

            if (currentObject.material instanceof Material)
            {
                currentObject.material.dispose()
            }
        }

        if (currentObject.children.length)
        {
            objects.push(...currentObject.children)
        }
    }
}

export const utils = <const>{
    dispose
}
