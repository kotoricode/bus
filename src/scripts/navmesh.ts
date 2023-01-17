import { Line3, Raycaster, Triangle, Vector3 } from "three"
import { Heap } from "./heap"

class Node
{
    constructor(
        public readonly point: Vector3,
        public staticNeighbors: Node[],
        public dynamicNeighbors: Node[]
    )
    {}
}

export class NavMesh
{
    private readonly triangles: Triangle[]
    private readonly nodes: Vector3[]
    private readonly triangleNeighbors = new Map<Triangle, Triangle[]>()
    private readonly triangleCrossings = new Map<Triangle, Line3[]>()
    private readonly crossingTriangles = new Map<Line3, [Triangle, Triangle]>()

    constructor(triangles: Triangle[])
    {
        this.triangles = this.initTriangles(triangles)
        this.nodes = this.initNodes()

        console.log(
            "triangles:", this.triangles.length,
            "| nodes:", this.nodes.length
        )
    }

    getPath(segment: Line3): Vector3[] | null
    {
        const start = this.getTriangleAt(segment.start)
        const end = this.getTriangleAt(segment.end)

        if (start === end)
        {
            return [segment.start, segment.end]
        }

        const island = this.getIsland(segment)

        if (this.getSameIsland(start, end, island))
        {
            return [segment.start, segment.end]
        }

        const path: Vector3[] = []

        return path
    }

    private getIsland(segment: Line3): Triangle[]
    {
        const island: Triangle[] = []

        for (const [crossing, triangles] of this.crossingTriangles)
        {
            if (intersect(segment, crossing))
            {
                for (const triangle of triangles)
                {
                    if (!island.includes(triangle))
                    {
                        island.push(triangle)
                    }
                }
            }
        }

        return island
    }

    private getTriangleAt(point: Vector3): Triangle
    {
        const pointRaised = point.clone()
        pointRaised.y += 0.01
        const down = new Vector3(0, -1, 0)
        const near = 0
        const far = 0.02

        const raycaster = new Raycaster(down, down, near, far)
        const target = new Vector3()

        for (const triangle of this.triangles)
        {
            if (raycaster.ray.intersectTriangle(triangle.a, triangle.b, triangle.c, false, target))
            {
                return triangle
            }
        }

        throw Error
    }

    private getSameIsland(start: Triangle, end: Triangle, island: Triangle[]): boolean
    {
        const mid = new Vector3()
        const endMid = end.getMidpoint(mid).clone()

        const exhausted: Triangle[] = []
        const queue = new Heap<Triangle>((t1, t2) =>
            t1.getMidpoint(mid).distanceToSquared(endMid) <
            t2.getMidpoint(mid).distanceToSquared(endMid)
        )

        let current: Triangle | null = start

        while (current)
        {
            const neighbors = this.triangleNeighbors.get(current)

            if (!neighbors)
            {
                continue
            }

            for (const neighbor of neighbors)
            {
                if (!island.includes(neighbor))
                {
                    continue
                }

                if (neighbor === end)
                {
                    return true
                }

                if (!exhausted.includes(neighbor))
                {
                    queue.add(neighbor)
                }
            }

            exhausted.push(current)
            current = queue.next()
        }

        return false
    }

    private initNodes(): Vector3[]
    {
        const pointNeighbors = this.createPointNeighbors()
        const nodes: Vector3[] = []

        for (const [point, neighbors] of pointNeighbors)
        {
            // Don't include points already used as nodes
            if (nodes.includes(point))
            {
                continue
            }

            // Don't include points only used in one triangle
            if (neighbors.length < 3)
            {
                continue
            }

            // Don't include points encircled by neighbors
            if (pointEncircledByNeighbors(neighbors, pointNeighbors))
            {
                continue
            }

            nodes.push(point)
        }

        return nodes
    }

    private createPointNeighbors(): Map<Vector3, Vector3[]>
    {
        const pointNeighbors = new Map<Vector3, Vector3[]>()

        for (const triangle of this.triangles)
        {
            const a = pointNeighbors.get(triangle.a)

            if (a)
            {
                if (!a.includes(triangle.b))
                {
                    a.push(triangle.b)
                }

                if (!a.includes(triangle.c))
                {
                    a.push(triangle.c)
                }
            }
            else
            {
                pointNeighbors.set(triangle.a, [triangle.b, triangle.c])
            }

            const b = pointNeighbors.get(triangle.b)

            if (b)
            {
                if (!b.includes(triangle.a))
                {
                    b.push(triangle.a)
                }

                if (!b.includes(triangle.c))
                {
                    b.push(triangle.c)
                }
            }
            else
            {
                pointNeighbors.set(triangle.b, [triangle.a, triangle.c])
            }

            const c = pointNeighbors.get(triangle.c)

            if (c)
            {
                if (!c.includes(triangle.a))
                {
                    c.push(triangle.a)
                }

                if (!c.includes(triangle.b))
                {
                    c.push(triangle.b)
                }
            }
            else
            {
                pointNeighbors.set(triangle.c, [triangle.a, triangle.b])
            }
        }

        return pointNeighbors
    }

    private initTriangles(triangles: Triangle[]): Triangle[]
    {
        mergeTriangles(triangles)

        for (let i = 0; i < triangles.length - 1; i++)
        {
            const t1 = triangles[i]

            for (let j = i + 1; j < triangles.length; j++)
            {
                const t2 = triangles[j]
                const crossing = getCrossing(t1, t2)

                if (!crossing)
                {
                    continue
                }

                this.addNeighbor(t1, t2)
                this.addNeighbor(t2, t1)

                this.addCrossing(t1, crossing)
                this.addCrossing(t2, crossing)

                this.addTriangles(crossing, t1, t2)
            }
        }

        return triangles
    }

    private addNeighbor(triangle: Triangle, neighbor: Triangle): void
    {
        const neighbors = this.triangleNeighbors.get(triangle)

        if (neighbors)
        {
            neighbors.push(neighbor)
        }
        else
        {
            this.triangleNeighbors.set(triangle, [neighbor])
        }
    }

    private addCrossing(triangle: Triangle, crossing: Line3): void
    {
        const crossings = this.triangleCrossings.get(triangle)

        if (crossings)
        {
            crossings.push(crossing)
        }
        else
        {
            this.triangleCrossings.set(triangle, [crossing])
        }
    }

    private addTriangles(crossing: Line3, t1: Triangle, t2: Triangle): void
    {
        this.crossingTriangles.set(crossing, [t1, t2])
    }
}

const getCrossing = (t1: Triangle, t2: Triangle): Line3 | null =>
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
            return createCrossing(first, t1.b)
        }

        first = t1.b
    }

    if (first && (
        vectorsEqual(t1.c, t2.a) || vectorsEqual(t1.c, t2.b) || vectorsEqual(t1.c, t2.c)
    ))
    {
        return createCrossing(first, t1.c)
    }

    return null
}

const createCrossing = (v1: Vector3, v2: Vector3): Line3 =>
    (v2.x - v1.x || v2.z - v1.z || v2.y - v1.y) <= 0
        ? new Line3(v1, v2)
        : new Line3(v2, v1)

const intersect = (s1: Line3, s2: Line3): Vector3 | null =>
{
    const s1dx = s1.end.x - s1.start.x
    const s1dz = s1.end.z - s1.start.z
    const s2dx = s2.end.x - s2.start.x
    const s2dz = s2.end.z - s2.start.z

    const determinant = s2dx * s1dz - s1dx * s2dz

    if (determinant)
    {
        const dx = s2.start.x - s1.start.x
        const dz = s2.start.z - s1.start.z

        const s1t = (s2dx * dz - s2dz * dx) / determinant

        if (0 <= s1t && s1t <= 1)
        {
            const s2t = (s1dx * dz - s1dz * dx) / determinant

            if (0 <= s2t && s2t <= 1)
            {
                const segment1dy = s1.end.y - s1.start.y

                return new Vector3(
                    s1.start.x + s1dx * s1t,
                    s1.start.y + segment1dy * s1t,
                    s1.start.z + s1dz * s1t
                )
            }
        }
    }

    return null
}

const mergeTriangles = (triangles: Triangle[]): void =>
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

const pointEncircledByNeighbors = (
    neighbors: Vector3[],
    pointNeighbors: Map<Vector3, Vector3[]>
): boolean =>
{
    if (neighbors.length < 3)
    {
        return false
    }

    for (const neighbor of neighbors)
    {
        const neighborsNeighbors = pointNeighbors.get(neighbor)

        if (!neighborsNeighbors)
        {
            throw Error
        }

        // Must have at least 3 neighbors (point + 2 shared neighbors)
        if (neighborsNeighbors.length < 3)
        {
            return false
        }

        let sharedNeighbors = 0

        for (const neighborsNeighbor of neighborsNeighbors)
        {
            if (neighbors.includes(neighborsNeighbor))
            {
                sharedNeighbors++
            }
        }

        if (sharedNeighbors < 2)
        {
            return false
        }
    }

    return true
}

const vectorsEqual = (v1: Vector3, v2: Vector3): boolean =>
    v1.x === v2.x &&
    v1.y === v2.y &&
    v1.z === v2.z
