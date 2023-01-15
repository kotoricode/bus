import type { Triangle, Vector3 } from "three"

type Side = [Vector3, Vector3]

export class NavMesh
{
    readonly nodes: Vector3[]
    private triangleNeighbors = new Map<Triangle, Triangle[]>()

    constructor(public readonly triangles: Triangle[])
    {
        this.mergeTriangles(triangles)
        this.triangles = this.initTriangles(triangles)
        this.nodes = this.initNodes()

        console.log(
            "triangles:", this.triangles.length,
            "| nodes:", this.nodes.length
        )
    }

    private initNodes = (): Vector3[] =>
    {
        const pointNeighbors = new Map<Vector3, Vector3[]>()

        for (const triangle of this.triangles)
        {
            const a = pointNeighbors.get(triangle.a)

            if (a)
            {
                a.push(triangle.b, triangle.c)
            }
            else
            {
                pointNeighbors.set(triangle.a, [triangle.b, triangle.c])
            }

            const b = pointNeighbors.get(triangle.b)

            if (b)
            {
                b.push(triangle.a, triangle.c)
            }
            else
            {
                pointNeighbors.set(triangle.b, [triangle.a, triangle.c])
            }

            const c = pointNeighbors.get(triangle.c)

            if (c)
            {
                c.push(triangle.a, triangle.b)
            }
            else
            {
                pointNeighbors.set(triangle.c, [triangle.a, triangle.b])
            }
        }

        const nodes: Vector3[] = []

        for (const [point, neighbors] of pointNeighbors)
        {
            if (nodes.includes(point))
            {
                continue
            }

            if (neighbors.length < 3)
            {
                continue
            }

            nodes.push(point)
        }

        return nodes
    }

    private initTriangles = (triangles: Triangle[]): Triangle[] =>
    {
        for (let i = 0; i < triangles.length - 1; i++)
        {
            const t1 = triangles[i]

            for (let j = i + 1; j < triangles.length; j++)
            {
                const t2 = triangles[j]
                const shared = sharedSide(t1, t2)

                if (!shared)
                {
                    continue
                }

                this.addNeighbor(t1, t2)
                this.addNeighbor(t2, t1)
            }
        }

        return triangles
    }

    private mergeTriangles(triangles: Triangle[]): void
    {
        const points: Vector3[] = []

        for (const triangle of triangles)
        {
            const a = points.find(point => vectorsEqual(point, triangle.a))

            if (a)
            {
                triangle.a = a
            }
            else
            {
                points.push(triangle.a)
            }

            const b = points.find(point => vectorsEqual(point, triangle.b))

            if (b)
            {
                triangle.b = b
            }
            else
            {
                points.push(triangle.b)
            }

            const c = points.find(point => vectorsEqual(point, triangle.c))

            if (c)
            {
                triangle.c = c
            }
            else
            {
                points.push(triangle.c)
            }
        }
    }

    private addNeighbor(t1: Triangle, t2: Triangle): void
    {
        const t1Neighbors = this.triangleNeighbors.get(t1)

        if (t1Neighbors)
        {
            t1Neighbors.push(t2)
        }
        else
        {
            this.triangleNeighbors.set(t1, [t2])
        }
    }
}

const sharedSide = (t1: Triangle, t2: Triangle): Side | null =>
{
    let first: Vector3 | null = null

    if (vectorsEqual(t1.a, t2.a) || vectorsEqual(t1.a, t2.b) || vectorsEqual(t1.a, t2.c))
    {
        first = t1.a
    }

    if (vectorsEqual(t1.b, t2.a) || vectorsEqual(t1.b, t2.b) || vectorsEqual(t1.b, t2.c))
    {
        if (first)
        {
            return createSide(first, t1.b)
        }

        first = t1.b
    }

    if (first && (
        vectorsEqual(t1.c, t2.a) || vectorsEqual(t1.c, t2.b) || vectorsEqual(t1.c, t2.c)
    ))
    {
        return createSide(first, t1.c)
    }

    return null
}

const createSide = (a: Vector3, b: Vector3): Side =>
    (b.x - a.x || b.z - a.z || b.y - a.y) <= 0 ? [a, b] : [b, a]

const vectorsEqual = (v1: Vector3, v2: Vector3): boolean =>
    v1.x === v2.x &&
    v1.y === v2.y &&
    v1.z === v2.z
