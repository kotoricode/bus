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
        const circleVertices = sides + 1

        const vertices: Vector3[] = new Array(circleVertices * 2)
        vertices[0] = new Vector3()
        vertices[circleVertices] = new Vector3(0, 0, this.height)

        const indices: Uint16Array = new Uint16Array(sides * 3 * 4)

        const slice = Math.PI * 2 / sides

        for (let i = 0; i < sides; i++)
        {
            // vertices
            const x = Math.cos(i * slice) * this.radius
            const z = Math.sin(i * slice) * this.radius
            const vec1 = new Vector3(x, z, 0)
            const vec2 = new Vector3(x, z, this.height)

            vertices[i + 1] = vec1
            vertices[i + 1 + circleVertices] = vec2

            // indices
            // bottom
            indices[i * 3] = i % sides + 1
            indices[i * 3 + 1] = 0
            indices[i * 3 + 2] = (i + 1) % sides + 1

            // top
            indices[3 * sides + i * 3] = indices[i * 3] + circleVertices
            indices[3 * sides + i * 3 + 1] = circleVertices
            indices[3 * sides + i * 3 + 2] = indices[i * 3 + 2] + circleVertices

            // sides
            indices[3 * sides * 2 + i * 3] = i % sides + 1
            indices[3 * sides * 2 + i * 3 + 1] = (i + 1) % sides + 1
            indices[3 * sides * 2 + i * 3 + 2] = i % sides + 1 + circleVertices

            indices[3 * sides * 3 + i * 3] = i % sides + 1 + circleVertices
            indices[3 * sides * 3 + i * 3 + 1] = (i + 1) % sides + 1 + circleVertices
            indices[3 * sides * 3 + i * 3 + 2] = (i + 1) % sides + 1
        }

        const vertexBuffer = new BufferGeometry()
        const indexBuffer = new BufferAttribute(indices, 3)
        vertexBuffer.setFromPoints(vertices)
        vertexBuffer.setIndex(indexBuffer)

        return vertexBuffer
    }
}
