import { Box3, BufferAttribute, BufferGeometry, Vector3 } from "three"

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

    createGeometry(sides: number): BufferGeometry
    {
        const vertices: Vector3[] = new Array(sides * 2 + 2)
        vertices[vertices.length - 2] = new Vector3(),
        vertices[vertices.length - 1] = new Vector3(0, 0, this.height)

        const indices: Uint16Array = new Uint16Array(sides * 3 * 2)
        const q = Math.PI * 2 / sides

        for (let i = 0; i < sides; i++)
        {
            // vertices
            const x = Math.cos(i * q) * this.radius
            const z = Math.sin(i * q) * this.radius
            const vec1 = new Vector3(x, z, 0)
            const vec2 = new Vector3(x, z, this.height)

            vertices[i] = vec1
            vertices[sides + i] = vec2

            // indices
            indices[i * 3] = i % sides
            indices[i * 3 + 1] = vertices.length - 2
            indices[i * 3 + 2] = (i + 1) % sides

            indices[sides * 3 + i * 3] = indices[i * 3] + sides
            indices[sides * 3 + i * 3 + 1] = vertices.length - 1
            indices[sides * 3 + i * 3 + 2] = indices[i * 3 + 2] + sides
        }

        const vertexBuffer = new BufferGeometry()
        const indexBuffer = new BufferAttribute(indices, 3)
        vertexBuffer.setFromPoints(vertices)
        vertexBuffer.setIndex(indexBuffer)

        return vertexBuffer
    }
}
