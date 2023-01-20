import { Line3, Raycaster, Triangle, Vector3 } from "three"
import { Heap } from "./heap"

type Node = {
    readonly waypoint: Vector3
    readonly estimated: number
    readonly accumulated: number
    readonly index: number
    readonly previous: Node | null
}

export class NavMesh
{
    readonly triangles: Triangle[]
    readonly nodes: Vector3[]
    private readonly triangleNeighbors = new Map<Triangle, Triangle[]>()
    private readonly crossingTriangles = new Map<Line3, [Triangle, Triangle]>()
    private readonly nodeDistances = new Map<Vector3, Map<Vector3, number>>()
    private readonly nodeWaypoints = new Map<Vector3, Map<Vector3, Vector3[]>>()

    constructor(triangles: Triangle[])
    {
        this.triangles = this.initTriangles(triangles)
        this.nodes = this.initNodes()
        this.initNodeWaypoints()
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

        const cluster = this.getCluster(segment)

        if (this.getSameCluster(start, end, cluster))
        {
            const path = this.getPathSegment(segment)

            return this.filterDuplicateWaypoints(path)
        }

        return this.getPathViaNodes(segment)
    }

    private getPathViaNodes(segment: Line3): Vector3[] | null
    {
        const neighbors = new Map<Vector3, Vector3[]>()
        const nodes = [segment.start, segment.end]
        nodes.push(...this.nodes)
        const testSegment = new Line3()

        for (let i = 0; i < nodes.length - 1; i++)
        {
            const n1 = nodes[i]
            testSegment.start.copy(n1)
            const testStart = this.getTriangleAt(n1)

            if (!testStart)
            {
                continue
            }

            for (let j = i + 1; j < nodes.length; j++)
            {
                const n2 = nodes[j]
                testSegment.end.copy(n2)
                const testEnd = this.getTriangleAt(n2)

                if (!testEnd)
                {
                    continue
                }

                const testCluster = this.getCluster(testSegment)

                if (this.getSameCluster(testStart, testEnd, testCluster))
                {
                    const c1 = neighbors.get(n1)

                    if (c1)
                    {
                        c1.push(n2)
                    }
                    else
                    {
                        neighbors.set(n1, [n2])
                    }

                    const c2 = neighbors.get(n2)

                    if (c2)
                    {
                        c2.push(n1)
                    }
                    else
                    {
                        neighbors.set(n2, [n1])
                    }
                }
            }
        }

        const candidates = new Heap<Node>((a, b) => a.estimated < b.estimated)

        let currentNode: Node | null = {
            waypoint: segment.start,
            estimated: 0,
            accumulated: segment.distanceSq(),
            index: 0,
            previous: null
        }

        while (currentNode)
        {
            const nodeNeighbors = neighbors.get(currentNode.waypoint)
            neighbors.delete(currentNode.waypoint)

            if (!nodeNeighbors)
            {
                throw Error
            }

            for (const neighbor of nodeNeighbors)
            {
                if (neighbor === segment.end)
                {
                    return this.buildPath(segment, currentNode)
                }

                if (!neighbors.has(neighbor))
                {
                    continue
                }

                const distancePrev = currentNode.waypoint.distanceToSquared(neighbor)
                const distanceEnd = neighbor.distanceToSquared(segment.end)
                const accumulated = currentNode.accumulated + distancePrev

                const neighborNode = {
                    waypoint: neighbor,
                    estimated: accumulated + distanceEnd,
                    accumulated,
                    index: currentNode.index + 1,
                    previous: currentNode
                }

                candidates.add(neighborNode)
            }

            currentNode = candidates.next() ?? null
        }

        return null
    }

    private initNodeWaypoints(): void
    {
        const segment = new Line3()

        for (let i = 0; i < this.nodes.length - 1; i++)
        {
            segment.start = this.nodes[i]
            const start = this.getTriangleAt(segment.start)

            if (!start)
            {
                continue
            }

            for (let j = i + 1; j < this.nodes.length; j++)
            {
                segment.end = this.nodes[j]
                const end = this.getTriangleAt(segment.end)

                if (!end)
                {
                    continue
                }

                const cluster = this.getCluster(segment)

                if (!this.getSameCluster(start, end, cluster))
                {
                    continue
                }

                const waypointsUnfiltered = this.getPathSegment(segment)
                const waypoints = this.filterDuplicateWaypoints(waypointsUnfiltered)

                this.initNodeWaypointsConnectWaypoints(segment.start, segment.end, waypoints)
                this.initNodeWaypointsConnectWaypoints(segment.end, segment.start, waypoints)

                const distance = segment.distanceSq()
                this.initNodeWaypointsConnectDistances(segment.start, segment.end, distance)
                this.initNodeWaypointsConnectDistances(segment.end, segment.start, distance)
            }
        }
    }

    private initNodeWaypointsConnectWaypoints(n1: Vector3, n2: Vector3, waypoints: Vector3[]): void
    {
        const waypointMap = this.nodeWaypoints.get(n1)

        if (waypointMap)
        {
            waypointMap.set(n2, waypoints)
        }
        else
        {
            this.nodeWaypoints.set(n1, new Map([ [n2, waypoints] ]))
        }
    }

    private initNodeWaypointsConnectDistances(n1: Vector3, n2: Vector3, distance: number): void
    {
        const distanceMap = this.nodeDistances.get(n1)

        if (distanceMap)
        {
            distanceMap.set(n2, distance)
        }
        else
        {
            this.nodeDistances.set(n1, new Map([ [n2, distance] ]))
        }
    }

    private buildPath(segment: Line3, node: Node): Vector3[]
    {
        const nodePath: Vector3[] = Array(node.index + 1)
        nodePath[node.index + 1] = segment.end
        let backtrack: Node | null = node

        while (backtrack)
        {
            nodePath[backtrack.index] = backtrack.waypoint
            backtrack = backtrack.previous
        }

        const waypoints: Vector3[] = []

        for (let i = 0; i < nodePath.length - 1; i++)
        {
            const fragment = this.buildPathGetConnection(nodePath[i], nodePath[i + 1])
            waypoints.push(...fragment)
        }

        return this.filterDuplicateWaypoints(waypoints)
    }

    private buildPathGetConnection(n1: Vector3, n2: Vector3): Vector3[]
    {
        const connections = this.nodeWaypoints.get(n1)

        if (connections)
        {
            const connection = connections.get(n2)

            if (connection)
            {
                return connection
            }
        }

        const wpSegment = new Line3(n1, n2)

        return this.getPathSegment(wpSegment)
    }

    private filterDuplicateWaypoints(path: Vector3[]): Vector3[]
    {
        const noDupes: Vector3[] = []

        for (let i = 0; i < path.length; i++)
        {
            if (i && path[i - 1].equals(path[i]))
            {
                continue
            }

            noDupes.push(path[i])
        }

        return noDupes
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
        {
            const dist1 = w1.distanceToSquared(segment.start)
            const dist2 = w2.distanceToSquared(segment.start)

            return dist1 - dist2
        })

        return path
    }

    private getCluster(segment: Line3): Triangle[]
    {
        const cluster: Triangle[] = []

        for (const [crossing, triangles] of this.crossingTriangles)
        {
            if (intersect(segment, crossing))
            {
                for (const triangle of triangles)
                {
                    if (!cluster.includes(triangle))
                    {
                        cluster.push(triangle)
                    }
                }
            }
        }

        return cluster
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

    private getSameCluster(start: Triangle, end: Triangle, cluster: Triangle[]): boolean
    {
        const mid = new Vector3()
        const endMid = end.getMidpoint(mid).clone()

        const exhausted: Triangle[] = []
        const queue = new Heap<Triangle>((t1, t2) =>
        {
            const dist1 = t1.getMidpoint(mid).distanceToSquared(endMid)
            const dist2 = t2.getMidpoint(mid).distanceToSquared(endMid)

            return dist1 < dist2
        })

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
                if (!cluster.includes(neighbor))
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
            if (!nodes.includes(point) && reflexCorner(point, neighbors, pointNeighbors))
            {
                nodes.push(point)
            }
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

                if (crossing)
                {
                    this.addNeighbor(t1, t2)
                    this.addNeighbor(t2, t1)
                    this.addTriangles(crossing, t1, t2)
                }
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

    if (t1.a.equals(t2.a) || t1.a.equals(t2.b) || t1.a.equals(t2.c))
    {
        first = t1.a
    }

    if (t1.b.equals(t2.a) || t1.b.equals(t2.b) || t1.b.equals(t2.c))
    {
        if (first)
        {
            return createCrossing(first, t1.b)
        }

        first = t1.b
    }

    if (first && (t1.c.equals(t2.a) || t1.c.equals(t2.b) || t1.c.equals(t2.c)))
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
        const a = points.find(point => point.equals(triangle.a))

        if (a)
        {
            triangle.a = a
        }
        else
        {
            points.push(triangle.a)
        }

        const b = points.find(point => point.equals(triangle.b))

        if (b)
        {
            triangle.b = b
        }
        else
        {
            points.push(triangle.b)
        }

        const c = points.find(point => point.equals(triangle.c))

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
