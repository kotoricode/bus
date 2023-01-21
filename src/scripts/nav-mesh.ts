import {
    BufferGeometry, Line, Line3, LineBasicMaterial, Mesh, MeshBasicMaterial, Object3D, Raycaster,
    SphereGeometry, Triangle, Vector3
} from "three"
import { Heap } from "./heap"

type NodeData = {
    readonly node: Vector3
    readonly estimated: number
    readonly accumulated: number
    readonly index: number
    readonly previous: NodeData | null
}

export class NavMesh
{
    private readonly grid: Triangle[]
    private readonly fixedNodes: Vector3[]
    private readonly triangleNeighbors = new Map<Triangle, Triangle[]>()
    private readonly crossingTriangles = new Map<Line3, [Triangle, Triangle]>()
    private readonly fixedNodePaths = new Map<Vector3, Map<Vector3, Vector3[]>>()

    constructor(triangles: Triangle[])
    {
        initTrianglesMerge(triangles)
        this.grid = this.initTriangles(triangles)
        this.fixedNodes = this.initFixedNodes()
        this.initFixedNodePaths()
    }

    getGridDebugObjects(): Object3D[]
    {
        const objects: Object3D[] = []

        const lineMaterial = new LineBasicMaterial({
            color: 0xffffff
        })

        for (const triangle of this.grid)
        {
            const geometry = new BufferGeometry().setFromPoints([
                triangle.a, triangle.b, triangle.c, triangle.a
            ])

            const object = new Line(geometry, lineMaterial)
            objects.push(object)
        }

        const fixedNodeGeometry = new SphereGeometry(0.2)
        const fixedNodeMaterial = new MeshBasicMaterial({
            color: 0x40E0D0,
        })

        for (const node of this.fixedNodes)
        {
            const object = new Mesh(fixedNodeGeometry, fixedNodeMaterial)
            object.position.copy(node)
            objects.push(object)
        }

        return objects
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
            const path = this.getSegmentPath(segment)

            return filterDuplicateWaypoints(path)
        }

        return this.getPathViaNodes(segment)
    }

    getIntersection(raycaster: Raycaster): Vector3 | null
    {
        const target = new Vector3()

        for (const triangle of this.grid)
        {
            const result = raycaster.ray.intersectTriangle(
                triangle.a, triangle.b, triangle.c,
                true, target
            )

            if (result)
            {
                return result
            }
        }

        return null
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

    private getPathViaNodes(segment: Line3): Vector3[] | null
    {
        const nodes = [segment.start, segment.end]
        const neighbors = this.getPathViaNodesConnectDynamicFixed(nodes)
        nodes.push(...this.fixedNodes)

        let currentNode: NodeData | null = {
            node: segment.start,
            estimated: segment.distanceSq(),
            accumulated: 0,
            index: 0,
            previous: null
        }

        const candidates = new Heap<NodeData>((a, b) => a.estimated < b.estimated)

        while (currentNode)
        {
            const nodeNeighbors = neighbors.get(currentNode.node)
            neighbors.delete(currentNode.node)

            if (!nodeNeighbors)
            {
                console.warn("No neighbors")

                return null
            }

            for (const neighbor of nodeNeighbors)
            {
                if (neighbor === segment.end)
                {
                    return this.getPathViaNodesBuild(segment, currentNode)
                }

                if (!neighbors.has(neighbor))
                {
                    continue
                }

                const distancePrev = currentNode.node.distanceToSquared(neighbor)
                const distanceEnd = neighbor.distanceToSquared(segment.end)
                const accumulated = currentNode.accumulated + distancePrev

                const neighborNode: NodeData = {
                    node: neighbor,
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

    private getPathViaNodesBuild(segment: Line3, node: NodeData): Vector3[]
    {
        const nodePath: Vector3[] = Array(node.index + 1)
        nodePath[node.index + 1] = segment.end
        let backtrack: NodeData | null = node

        while (backtrack)
        {
            nodePath[backtrack.index] = backtrack.node
            backtrack = backtrack.previous
        }

        const path: Vector3[] = []
        const pathSegment = new Line3()

        for (let i = 0; i < nodePath.length - 1; i++)
        {
            pathSegment.start = nodePath[i]
            pathSegment.end = nodePath[i + 1]
            const segmentPath = this.getPathViaNodesBuildGetSegmentPath(pathSegment)
            path.push(...segmentPath)
        }

        return filterDuplicateWaypoints(path)
    }

    private getPathViaNodesBuildGetSegmentPath(segment: Line3): Vector3[]
    {
        const existingPaths = this.fixedNodePaths.get(segment.start)

        if (existingPaths)
        {
            const existingPath = existingPaths.get(segment.end)

            if (existingPath)
            {
                return existingPath
            }
        }

        return this.getSegmentPath(segment)
    }

    private getPathViaNodesConnectDynamicFixed(dynamicNodes: Vector3[]): Map<Vector3, Vector3[]>
    {
        const segment = new Line3()
        const neighbors = new Map<Vector3, Vector3[]>()

        for (const dynamicNode of dynamicNodes)
        {
            segment.start = dynamicNode
            const start = this.getTriangleAt(dynamicNode)

            if (!start)
            {
                continue
            }

            for (const fixedNode of this.fixedNodes)
            {
                segment.end = fixedNode
                const end = this.getTriangleAt(fixedNode)

                if (!end)
                {
                    continue
                }

                const testCluster = this.getCluster(segment)

                if (this.getSameCluster(start, end, testCluster))
                {
                    const dynamicNodeNeighbors = neighbors.get(dynamicNode)

                    if (dynamicNodeNeighbors)
                    {
                        dynamicNodeNeighbors.push(fixedNode)
                    }
                    else
                    {
                        neighbors.set(dynamicNode, [fixedNode])
                    }

                    const fixedNodeNeighbors = neighbors.get(fixedNode)

                    if (fixedNodeNeighbors)
                    {
                        fixedNodeNeighbors.push(dynamicNode)
                    }
                    else
                    {
                        neighbors.set(fixedNode, [dynamicNode])
                    }
                }
            }
        }

        return neighbors
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

    private getSegmentPath(segment: Line3): Vector3[]
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

    private getTriangleAt(point: Vector3): Triangle | null
    {
        const pointRaised = point.clone()
        pointRaised.y += 1

        const down = new Vector3(0, -1, 0)
        const near = 0.5
        const far = 1.5

        const raycaster = new Raycaster(pointRaised, down, near, far)
        const target = new Vector3()

        for (const triangle of this.grid)
        {
            const result = raycaster.ray.intersectTriangle(
                triangle.a, triangle.b, triangle.c,
                false, target
            )

            if (result)
            {
                return triangle
            }
        }

        return null
    }

    private initFixedNodePaths(): void
    {
        const segment = new Line3()

        for (let i = 0; i < this.fixedNodes.length - 1; i++)
        {
            segment.start = this.fixedNodes[i]
            const start = this.getTriangleAt(segment.start)

            if (!start)
            {
                continue
            }

            for (let j = i + 1; j < this.fixedNodes.length; j++)
            {
                segment.end = this.fixedNodes[j]
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

                const path = this.getSegmentPath(segment)
                const filtered = filterDuplicateWaypoints(path)

                this.initFixedNodePathsConnectPath(segment.start, segment.end, filtered)
                this.initFixedNodePathsConnectPath(segment.end, segment.start, filtered)
            }
        }
    }

    private initFixedNodePathsConnectPath(n1: Vector3, n2: Vector3, path: Vector3[]): void
    {
        const pathMap = this.fixedNodePaths.get(n1)

        if (pathMap)
        {
            pathMap.set(n2, path)
        }
        else
        {
            this.fixedNodePaths.set(n1, new Map([ [n2, path] ]))
        }
    }

    private initFixedNodes(): Vector3[]
    {
        const pointNeighbors = this.initFixedNodesCreateNeighbors()
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

    private initFixedNodesCreateNeighbors(): Map<Vector3, Vector3[]>
    {
        const pointNeighbors = new Map<Vector3, Vector3[]>()

        for (const triangle of this.grid)
        {
            const corners = [triangle.a, triangle.b, triangle.c]

            for (let i = 0; i < corners.length; i++)
            {
                const corner = corners[i]
                const cornerNeighbors = pointNeighbors.get(corner)

                if (cornerNeighbors)
                {
                    for (let j = 0; j < corners.length - 1; j++)
                    {
                        const neighbor = corners[(i + j + 1) % corners.length]

                        if (!cornerNeighbors.includes(neighbor))
                        {
                            cornerNeighbors.push(neighbor)
                        }
                    }
                }
                else
                {
                    const neighbor1 = corners[(i + 1) % corners.length]
                    const neighbor2 = corners[(i + 2) % corners.length]
                    pointNeighbors.set(corner, [neighbor1, neighbor2])
                }
            }
        }

        return pointNeighbors
    }

    private initTriangles(triangles: Triangle[]): Triangle[]
    {
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
    else if (!first)
    {
        return null
    }

    if (t1.c.equals(t2.a) || t1.c.equals(t2.b) || t1.c.equals(t2.c))
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
    const epsilon = 2 ** -16

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

        if (0 <= s1t && s1t <= 1 + epsilon)
        {
            const s2t = (s1dx * dz - s1dz * dx) / determinant

            if (0 <= s2t && s2t <= 1 + epsilon)
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

const filterDuplicateWaypoints = (path: Vector3[]): Vector3[] =>
{
    const filtered: Vector3[] = []

    for (let i = 0; i < path.length; i++)
    {
        if (i && path[i].equals(path[i - 1]))
        {
            continue
        }

        filtered.push(path[i])
    }

    return filtered
}

const initTrianglesMerge = (triangles: Triangle[]): void =>
{
    const mergerCorners: Vector3[] = []

    for (const triangle of triangles)
    {
        const a = mergerCorners.find(corner => corner.equals(triangle.a))

        if (a)
        {
            triangle.a = a
        }
        else
        {
            mergerCorners.push(triangle.a)
        }

        const b = mergerCorners.find(corner => corner.equals(triangle.b))

        if (b)
        {
            triangle.b = b
        }
        else
        {
            mergerCorners.push(triangle.b)
        }

        const c = mergerCorners.find(corner => corner.equals(triangle.c))

        if (c)
        {
            triangle.c = c
        }
        else
        {
            mergerCorners.push(triangle.c)
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
                throw Error("No candidates")
            }

            const sharedNeighbors = candidateNeighbors.filter(neighbor =>
                neighbors.includes(neighbor) && !sorted.includes(neighbor)
            )

            if (sharedNeighbors.length === 1)
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
