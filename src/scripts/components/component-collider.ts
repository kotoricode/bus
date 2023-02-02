import { Box3, CylinderGeometry, Mesh, MeshBasicMaterial, Object3D, Vector3 } from "three"

export class ComponentCollider
{
    readonly hitbox: Box3

    constructor(public readonly radius: number, public readonly height: number)
    {
        const hypot = (2 * radius ** 2) ** 0.5

        this.hitbox = new Box3(
            new Vector3(-hypot, 0, -hypot),
            new Vector3(hypot, height, hypot)
        )
    }

    getDebugObject(): Object3D
    {
        const object = new Object3D()

        const geometry = new CylinderGeometry(this.radius, this.radius, this.height, 12)
        geometry.translate(0, this.height / 2, 0)

        const material = new MeshBasicMaterial({ color: 0xff00, wireframe: true })
        const mesh = new Mesh(geometry, material)
        object.add(mesh)

        return object
    }
}
