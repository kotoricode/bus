import type { Triangle, Vector3 } from "three"

export class NavMesh
{
    readonly nodes: Vector3[]
    private triangleNeighbors = new Map<Triangle, Triangle[]>()
    private triangleNodes = new Map<Triangle, Vector3[]>()

    constructor(public readonly triangles: Triangle[])
    {
        this.triangles = this.initTriangles(triangles)
        this.nodes = this.initNodes()
    }

    private initNodes = (): Vector3[] =>
    {
        const nodes: Vector3[] = []

        for (let i = 0; i < this.triangles.length - 1; i++)
        {
            const t1 = this.triangles[i]

            for (let j = i + 1; j < this.triangles.length; j++)
            {
                const t2 = this.triangles[j]
                const shared = sharedSide(t1, t2)

                if (!shared)
                {
                    continue
                }

                for (const point of shared)
                {
                    const existing = nodes.find(node => vectorsEqual(point, node))

                    if (existing)
                    {
                        this.addNode(t1, existing)
                        this.addNode(t2, existing)
                    }
                    else
                    {
                        nodes.push(point)
                        this.addNode(t1, point)
                        this.addNode(t2, point)
                    }
                }
            }
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

    private addNode(triangle: Triangle, node: Vector3): void
    {
        const triangleNodes = this.triangleNodes.get(triangle)

        if (triangleNodes)
        {
            triangleNodes.push(node)
        }
        else
        {
            this.triangleNodes.set(triangle, [node])
        }
    }
}

const sharedSide = (t1: Triangle, t2: Triangle): [Vector3, Vector3] | null =>
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
            return [first, t1.b]
        }

        first = t1.b
    }

    if (first && (
        vectorsEqual(t1.c, t2.a) || vectorsEqual(t1.c, t2.b) || vectorsEqual(t1.c, t2.c)
    ))
    {
        return [first, t1.c]
    }

    return null
}

const vectorsEqual = (v1: Vector3, v2: Vector3): boolean =>
    v1.x === v2.x &&
    v1.y === v2.y &&
    v1.z === v2.z
