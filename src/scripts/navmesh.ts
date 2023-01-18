import { Line3, Raycaster, Triangle, Vector3 } from "three"
import { Heap } from "./heap"

export class NavMesh
{
    readonly triangles: Triangle[]
    readonly nodes: Vector3[]
    private readonly triangleNeighbors = new Map<Triangle, Triangle[]>()
    private readonly crossingTriangles = new Map<Line3, [Triangle, Triangle]>()

    private readonly nodeNodeWaypoints = new Map<Vector3, Map<Vector3, Vector3[]>>()

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

        if (!start || !end)
        {
            return null
        }

        if (start === end)
        {
            return [segment.start, segment.end]
        }

        const island = this.getIsland(segment)

        if (this.getSameIsland(start, end, island))
        {
            const pathSegment = this.getPathSegment(segment)

            return pathSegment
        }

        const path: Vector3[] = []

        return path
    }

    private getPathSegment(segment: Line3): Vector3[]
    {
        const path: Vector3[] = [segment.start, segment.end]

        for (const crossing of this.crossingTriangles.keys())
        {
            const waypoint = intersect(segment, crossing)

            if (waypoint)
            {
                path.push(waypoint)
            }
        }

        path.sort((w1, w2) =>
            w1.distanceToSquared(segment.start) - w2.distanceToSquared(segment.start)
        )

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

    private getTriangleAt(point: Vector3): Triangle | null
    {
        const pointRaised = point.clone()
        pointRaised.y += 1

        const down = new Vector3(0, -1, 0)
        const near = 0
        const far = 3

        const raycaster = new Raycaster(pointRaised, down, near, far)
        const target = new Vector3()

        for (const triangle of this.triangles)
        {
            const result = raycaster.ray.intersectTriangle(
                triangle.a, triangle.b, triangle.c, false, target
            )

            if (result)
            {
                return triangle
            }
        }

        return null
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
            if (!reflexCorner(point, neighbors, pointNeighbors))
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
                const s2dy = s2.end.y - s2.start.y

                return new Vector3(
                    s2.start.x + s2dx * s2t,
                    s2.start.y + s2dy * s2t,
                    s2.start.z + s2dz * s2t
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

const reflexCorner = (
    point: Vector3,
    neighbors: Vector3[],
    pointNeighbors: Map<Vector3, Vector3[]>
): boolean =>
{
    if (neighbors.length < 3)
    {
        return false
    }

    const sorted: Vector3[] = []
    const candidates = neighbors.slice()

    for (let i = 0; i < neighbors.length; i++)
    {
        if (candidates.length === 1)
        {
            sorted.push(candidates[0])

            break
        }

        for (const candidate of candidates)
        {
            const candidateNeighbors = pointNeighbors.get(candidate)

            if (!candidateNeighbors)
            {
                throw Error
            }

            let oneSharedNeighbor = false

            for (const neighbor of candidateNeighbors)
            {
                if (neighbors.includes(neighbor) && !sorted.includes(neighbor))
                {
                    if (oneSharedNeighbor)
                    {
                        oneSharedNeighbor = false

                        break
                    }

                    oneSharedNeighbor = true
                }
            }

            if (oneSharedNeighbor)
            {
                sorted.push(candidate)
                candidates.splice(candidates.indexOf(candidate), 1)

                break
            }
        }
    }

    if (!sorted.length)
    {
        return false
    }

    let totalAngle = 0
    const vec1 = new Vector3()
    const vec2 = new Vector3()

    for (let i = 0; i < sorted.length - 1; i++)
    {
        vec1.copy(sorted[i]).sub(point).y = 0
        vec2.copy(sorted[i + 1]).sub(point).y = 0

        totalAngle += vec1.angleTo(vec2)
    }

    return totalAngle > Math.PI
}

const vectorsEqual = (v1: Vector3, v2: Vector3): boolean =>
    v1.x === v2.x &&
    v1.y === v2.y &&
    v1.z === v2.z
