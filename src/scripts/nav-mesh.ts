import {
    BufferGeometry, Line, Line3, LineBasicMaterial, Mesh, MeshBasicMaterial, Object3D,
    Raycaster, SphereGeometry, Triangle, Vector3
} from "three"
import { EPSILON } from "./const"
import { Heap } from "./heap"

type NodeData = {
    readonly node: Vector3
    estimated: number
    accumulated: number
    index: number
    previous: NodeData | null
}

type Intersection = {
    readonly triangle: Triangle
    readonly point: Vector3
}

export class NavMesh
{
    private readonly fixedNodes: Vector3[]
    private readonly triangleNeighbors = new Map<Triangle, Triangle[]>()
    private readonly crossingTriangles = new Map<Line3, [Triangle, Triangle]>()
    private readonly fixedNodePaths = new Map<Vector3, Map<Vector3, Vector3[]>>()

    constructor(private readonly grid: Triangle[])
    {
        initTrianglesMerge(grid)
        this.initTriangles(grid)
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

    getGridIntersection(raycaster: Readonly<Raycaster>): Intersection | null
    {
        const target = new Vector3()

        for (const triangle of this.grid)
        {
            const point = raycaster.ray.intersectTriangle(
                triangle.a, triangle.b, triangle.c,
                true, target
            )

            if (point)
            {
                return { triangle, point }
            }
        }

        return null
    }

    getPath(segment: Readonly<Line3>): Vector3[] | null
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

        if (this.getSameCluster(start, end, segment))
        {
            const path = this.getSegmentPath(segment)

            return filterDuplicateWaypoints(path)
        }

        return this.getPathViaNodes(segment)
    }

    private addNeighbor(triangle: Readonly<Triangle>, neighbor: Readonly<Triangle>): void
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

    private getCluster(segment: Readonly<Line3>): Triangle[]
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

    private getPathViaNodes(segment: Readonly<Line3>): Vector3[] | null
    {
        const nodes = [segment.start, segment.end]
        const neighbors = this.getPathViaNodesConnectNodes(nodes)
        const exhausted = new Map<Vector3, NodeData>()
        nodes.push(...this.fixedNodes)

        let currentNodeData: NodeData | null = {
            node: segment.start,
            estimated: segment.distance(),
            accumulated: 0,
            index: 0,
            previous: null
        }

        const candidates = new Heap<NodeData>((a, b) => a.estimated < b.estimated)

        while (currentNodeData)
        {
            const nodeNeighbors = neighbors.get(currentNodeData.node)

            if (!nodeNeighbors)
            {
                console.warn("No neighbors")

                return null
            }

            for (const neighbor of nodeNeighbors)
            {
                if (neighbor === segment.end)
                {
                    return this.getPathViaNodesBuild(segment, currentNodeData)
                }

                if (exhausted.has(neighbor))
                {
                    continue
                }

                const distancePrev = currentNodeData.node.distanceTo(neighbor)
                const distanceEnd = neighbor.distanceTo(segment.end)
                const accumulated = currentNodeData.accumulated + distancePrev

                const existingCandidate = candidates.get(c => c.node === neighbor)

                if (!existingCandidate)
                {
                    const neighborNode: NodeData = {
                        node: neighbor,
                        estimated: accumulated + distanceEnd,
                        accumulated,
                        index: currentNodeData.index + 1,
                        previous: currentNodeData
                    }

                    candidates.add(neighborNode)
                }
                else if (existingCandidate.accumulated > accumulated)
                {
                    const neighborNode: NodeData = {
                        node: neighbor,
                        estimated: accumulated + distanceEnd,
                        accumulated,
                        index: currentNodeData.index + 1,
                        previous: currentNodeData
                    }

                    candidates.remove(existingCandidate)
                    candidates.add(neighborNode)
                }
            }

            exhausted.set(currentNodeData.node, currentNodeData)
            currentNodeData = candidates.next()
        }

        return null
    }

    private getPathViaNodesBuild(segment: Readonly<Line3>, node: Readonly<NodeData>): Vector3[]
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

    private getPathViaNodesBuildGetSegmentPath(segment: Readonly<Line3>): Vector3[]
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

    private getPathViaNodesConnectNodes(dynamicNodes: Readonly<Vector3[]>): Map<Vector3, Vector3[]>
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

                if (!end || !this.getSameCluster(start, end, segment))
                {
                    continue
                }

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

        // TODO: this should be precalculated
        for (const [fixedNode, fixedNodePaths] of this.fixedNodePaths)
        {
            const pathNeighbors = [...fixedNodePaths.keys()]
            const fixedNodeNeighbors = neighbors.get(fixedNode)

            if (fixedNodeNeighbors)
            {
                for (const b of pathNeighbors)
                {
                    if (!fixedNodeNeighbors.includes(b))
                    {
                        fixedNodeNeighbors.push(b)
                    }
                }
            }
            else
            {
                neighbors.set(fixedNode, pathNeighbors)
            }
        }

        return neighbors
    }

    private getSameCluster(
        start: Readonly<Triangle>,
        end: Readonly<Triangle>,
        segment: Readonly<Line3>
    ): boolean
    {
        const cluster = this.getCluster(segment)

        const mid = new Vector3()
        const endMid = end.getMidpoint(mid).clone()
        const queue = new Heap<Triangle>((t1, t2) =>
        {
            const dist1 = t1.getMidpoint(mid).distanceToSquared(endMid)
            const dist2 = t2.getMidpoint(mid).distanceToSquared(endMid)

            return dist1 < dist2
        })

        const exhausted: Triangle[] = []
        let current: Triangle | null = start

        while (current)
        {
            const neighbors = this.triangleNeighbors.get(current)

            if (neighbors)
            {
                for (const neighbor of neighbors)
                {
                    if (neighbor === end)
                    {
                        return true
                    }

                    if (!cluster.includes(neighbor))
                    {
                        continue
                    }

                    if (!exhausted.includes(neighbor))
                    {
                        queue.add(neighbor)
                    }
                }
            }

            exhausted.push(current)
            current = queue.next()
        }

        return false
    }

    private getSegmentPath(segment: Readonly<Line3>): Vector3[]
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

    private getTriangleAt(point: Readonly<Vector3>): Triangle | null
    {
        const raise = 0.1

        const pointRaised = point.clone()
        pointRaised.y += raise

        const down = new Vector3(0, -1, 0)
        const near = raise / 2
        const far = near + raise

        const raycaster = new Raycaster(pointRaised, down, near, far)
        const intersection = this.getGridIntersection(raycaster)

        if (intersection)
        {
            return intersection.triangle
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

                if (!end || !this.getSameCluster(start, end, segment))
                {
                    continue
                }

                const path = this.getSegmentPath(segment)

                const filtered = filterDuplicateWaypoints(path)
                const filteredReversed = filtered.slice()
                filteredReversed.reverse()

                this.initFixedNodePathsConnectPath(segment.start, segment.end, filtered)
                this.initFixedNodePathsConnectPath(segment.end, segment.start, filteredReversed)
            }
        }
    }

    private initFixedNodePathsConnectPath(
        n1: Readonly<Vector3>,
        n2: Readonly<Vector3>,
        path: Vector3[]
    ): void
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
        const pointAngle = new Map<Vector3, number>()
        const vec1 = new Vector3()
        const vec2 = new Vector3()

        for (const triangle of this.grid)
        {
            const corners = [triangle.a, triangle.b, triangle.c]

            for (let i = 0; i < corners.length; i++)
            {
                const point = corners[i]
                const neighbor1 = corners[(i + 1) % corners.length]
                const neighbor2 = corners[(i + 2) % corners.length]

                vec1.copy(neighbor1).sub(point).setY(0)
                vec2.copy(neighbor2).sub(point).setY(0)

                const storedAngle = pointAngle.get(point) ?? 0
                const angle = storedAngle + vec1.angleTo(vec2)
                pointAngle.set(point, angle)
            }
        }

        const fixedNodes: Vector3[] = []
        const reflexCornerThreshold = Math.PI - EPSILON

        for (const [point, angle] of pointAngle)
        {
            if (angle > reflexCornerThreshold)
            {
                fixedNodes.push(point)
            }
        }

        return fixedNodes
    }

    private initTriangles(triangles: Readonly<Triangle[]>): void
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
                    this.crossingTriangles.set(crossing, [t1, t2])
                }
            }
        }
    }
}

const getCrossing = (t1: Readonly<Triangle>, t2: Readonly<Triangle>): Line3 | null =>
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

const createCrossing = (v1: Readonly<Vector3>, v2: Readonly<Vector3>): Line3 =>
    (v2.x - v1.x || v2.z - v1.z || v2.y - v1.y) <= 0
        ? new Line3(v1, v2)
        : new Line3(v2, v1)

const intersect = (s1: Readonly<Line3>, s2: Readonly<Line3>): Vector3 | null =>
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

        if (0 <= s1t && s1t <= 1 + EPSILON)
        {
            const s2t = (s1dx * dz - s1dz * dx) / determinant

            if (0 <= s2t && s2t <= 1 + EPSILON)
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

const filterDuplicateWaypoints = (path: Readonly<Vector3[]>): Vector3[] =>
{
    const filtered: Vector3[] = []

    for (let i = 0; i < path.length; i++)
    {
        if (!i || !path[i].equals(path[i - 1]))
        {
            filtered.push(path[i])
        }
    }

    return filtered
}

const initTrianglesMerge = (triangles: Readonly<Triangle[]>): void =>
{
    const mergedCorners: Vector3[] = []

    for (const triangle of triangles)
    {
        const a = mergedCorners.find(corner => corner.equals(triangle.a))

        if (a)
        {
            triangle.a = a
        }
        else
        {
            mergedCorners.push(triangle.a)
        }

        const b = mergedCorners.find(corner => corner.equals(triangle.b))

        if (b)
        {
            triangle.b = b
        }
        else
        {
            mergedCorners.push(triangle.b)
        }

        const c = mergedCorners.find(corner => corner.equals(triangle.c))

        if (c)
        {
            triangle.c = c
        }
        else
        {
            mergedCorners.push(triangle.c)
        }
    }
}
