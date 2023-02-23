import {
    BufferGeometry, Line, Line3, LineBasicMaterial, Mesh, MeshBasicMaterial,
    Raycaster, SphereGeometry, Triangle, Vector3
} from "three"
import { Entity } from "./entity"
import { Heap } from "./heap"
import { layer } from "./layer"

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

type NavMeshData = {
    readonly triangles: Triangle[]
    readonly fixedNodes: Vector3[]
    readonly triangleNeighbors: Map<Triangle, Triangle[]>
    readonly crossingTriangles: Map<Line3, [Triangle, Triangle]>
    readonly fixedNodePaths: Map<Vector3, Map<Vector3, Vector3[]>>
}

const navMeshData = new Map<string, NavMeshData>()

export class NavMesh
{
    private readonly triangles: Triangle[]
    private readonly fixedNodes: Vector3[]
    private readonly triangleNeighbors: Map<Triangle, Triangle[]>
    private readonly crossingTriangles: Map<Line3, [Triangle, Triangle]>
    private readonly fixedNodePaths: Map<Vector3, Map<Vector3, Vector3[]>>

    constructor(id: string, gridCreationFunction: () => Triangle[])
    {
        const cached = navMeshData.get(id)

        if (cached)
        {
            this.triangles = cached.triangles
            this.fixedNodes = cached.fixedNodes
            this.triangleNeighbors = cached.triangleNeighbors
            this.crossingTriangles = cached.crossingTriangles
            this.fixedNodePaths = cached.fixedNodePaths
        }
        else
        {
            this.triangles = gridCreationFunction()
            mergeCorners(this.triangles)
            this.fixedNodes = initFixedNodes(this.triangles)

            const { crossingTriangles, triangleNeighbors } = initTriangleRelations(this.triangles)
            this.triangleNeighbors = triangleNeighbors
            this.crossingTriangles = crossingTriangles

            this.fixedNodePaths = this.initFixedNodePaths(this.fixedNodes)

            navMeshData.set(id, {
                triangles: this.triangles,
                fixedNodes: this.fixedNodes,
                triangleNeighbors,
                crossingTriangles,
                fixedNodePaths: this.fixedNodePaths
            })
        }
    }

    getGridDebugObject(): Entity
    {
        const object = new Entity()
        object.layers.set(layer.debug)

        const lineMaterial = new LineBasicMaterial({
            color: 0xff0000,
            fog: false
        })

        for (const triangle of this.triangles)
        {
            const geometry = new BufferGeometry().setFromPoints([
                triangle.a, triangle.b, triangle.c, triangle.a
            ])

            const line = new Line(geometry, lineMaterial)
            line.translateY(0.01)
            line.layers.set(layer.debug)
            object.add(line)
        }

        const fixedNodeGeometry = new SphereGeometry(0.08)
        const fixedNodeMaterial = new MeshBasicMaterial({
            color: 0x40E0D0,
            fog: false
        })

        for (const node of this.fixedNodes)
        {
            const mesh = new Mesh(fixedNodeGeometry, fixedNodeMaterial)
            mesh.layers.set(layer.debug)
            mesh.position.copy(node)
            object.add(mesh)
        }

        return object
    }

    getGridIntersection(raycaster: Raycaster): Intersection | null
    {
        const target = new Vector3()

        for (const triangle of this.triangles)
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

        if (this.getSameCluster(start, end, segment))
        {
            const path = this.getSegmentPath(segment)

            return filterDuplicateWaypoints(path)
        }

        const pathViaNodes = this.getPathViaNodes(segment)

        return pathViaNodes
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
        const nodeNeighbors = this.getPathViaNodesConnectNodes(segment)

        let currentNodeData: NodeData | null = {
            node: segment.start,
            estimated: segment.distance(),
            accumulated: 0,
            index: 0,
            previous: null
        }

        const candidates = new Heap<NodeData>((a, b) => a.estimated < b.estimated)
        const visited = new Set<Vector3>()

        while (currentNodeData)
        {
            const neighbors = nodeNeighbors.get(currentNodeData.node)

            if (!neighbors)
            {
                console.warn("No neighbors")

                return null
            }

            for (const neighbor of neighbors)
            {
                if (neighbor === segment.end)
                {
                    return this.getPathViaNodesBuild(segment, currentNodeData)
                }

                if (visited.has(neighbor))
                {
                    continue
                }

                const step = currentNodeData.node.distanceTo(neighbor)
                const accumulated = currentNodeData.accumulated + step
                const existingCandidate = candidates.get(c => c.node === neighbor)

                if (existingCandidate)
                {
                    if (existingCandidate.accumulated <= accumulated)
                    {
                        continue
                    }

                    candidates.remove(existingCandidate)
                }

                const estimated = accumulated + neighbor.distanceTo(segment.end)

                const neighborNode: NodeData = {
                    node: neighbor,
                    estimated,
                    accumulated,
                    index: currentNodeData.index + 1,
                    previous: currentNodeData
                }

                candidates.add(neighborNode)
            }

            visited.add(currentNodeData.node)
            currentNodeData = candidates.next()
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

    private getPathViaNodesConnectNodes(segment: Line3): Map<Vector3, Vector3[]>
    {
        const connectSegment = new Line3()
        const neighbors = new Map<Vector3, Vector3[]>()

        for (const dynamicNode of [segment.start, segment.end])
        {
            connectSegment.start = dynamicNode
            const start = this.getTriangleAt(dynamicNode)

            if (!start)
            {
                continue
            }

            for (const fixedNode of this.fixedNodes)
            {
                connectSegment.end = fixedNode
                const end = this.getTriangleAt(fixedNode)

                if (!end || !this.getSameCluster(start, end, connectSegment))
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

        for (const [fixedNode, fixedNodePaths] of this.fixedNodePaths)
        {
            const fixedNodeNeighbors = neighbors.get(fixedNode)
            const pathedNeighborsKeysIter = fixedNodePaths.keys()

            if (fixedNodeNeighbors)
            {
                for (const neighbor of pathedNeighborsKeysIter)
                {
                    if (!fixedNodeNeighbors.includes(neighbor))
                    {
                        fixedNodeNeighbors.push(neighbor)
                    }
                }
            }
            else
            {
                const fixedNodePathedNeighbors = Array.from(pathedNeighborsKeysIter)
                neighbors.set(fixedNode, fixedNodePathedNeighbors)
            }
        }

        return neighbors
    }

    private getSameCluster(start: Triangle, end: Triangle, segment: Line3): boolean
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

        const visited = new Set<Triangle>()
        let current: Triangle | null = start

        while (current)
        {
            const neighbors = this.triangleNeighbors.get(current)

            if (!neighbors)
            {
                throw Error("No neighbors")
            }

            for (const neighbor of neighbors)
            {
                if (neighbor === end)
                {
                    return true
                }

                if (!visited.has(neighbor) && cluster.includes(neighbor))
                {
                    queue.add(neighbor)
                }
            }

            visited.add(current)
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

    private initFixedNodePaths(fixedNodes: Vector3[]): typeof this.fixedNodePaths
    {
        const segment = new Line3()
        const fixedNodePaths: typeof this.fixedNodePaths = new Map()

        const connect = (n1: Vector3, n2: Vector3, path: Vector3[]): void =>
        {
            const pathMap = fixedNodePaths.get(n1)

            if (pathMap)
            {
                pathMap.set(n2, path)
            }
            else
            {
                fixedNodePaths.set(n1, new Map([ [n2, path] ]))
            }
        }

        for (let i = 0; i < fixedNodes.length - 1; i++)
        {
            segment.start = fixedNodes[i]
            const start = this.getTriangleAt(segment.start)

            if (!start)
            {
                continue
            }

            for (let j = i + 1; j < fixedNodes.length; j++)
            {
                segment.end = fixedNodes[j]
                const end = this.getTriangleAt(segment.end)

                if (!end || !this.getSameCluster(start, end, segment))
                {
                    continue
                }

                const path = this.getSegmentPath(segment)

                const filtered = filterDuplicateWaypoints(path)
                const filteredReversed = filtered.slice()
                filteredReversed.reverse()

                connect(segment.start, segment.end, filtered)
                connect(segment.end, segment.start, filteredReversed)
            }
        }

        return fixedNodePaths
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
            return createCrossing(t1.a, t1.b)
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

const initFixedNodes = (triangles: Triangle[]): Vector3[] =>
{
    const fixedNodes: Vector3[] = []
    const pointAngle = new Map<Vector3, number>()

    const vec1 = new Vector3()
    const vec2 = new Vector3()

    for (const triangle of triangles)
    {
        const corners = [triangle.a, triangle.b, triangle.c]

        for (let i = 0; i < corners.length; i++)
        {
            const point = corners[i]
            const neighbor1 = corners[(i + 1) % corners.length]
            const neighbor2 = corners[(i + 2) % corners.length]

            vec1.copy(neighbor1).sub(point).setY(0)
            vec2.copy(neighbor2).sub(point).setY(0)

            let angle = pointAngle.get(point) ?? 0
            angle += vec1.angleTo(vec2)
            pointAngle.set(point, angle)
        }
    }

    for (const [point, angle] of pointAngle)
    {
        if (Math.PI + 1e-7 < angle && angle < Math.PI * 2 - 1e-7)
        {
            fixedNodes.push(point)
        }
    }

    return fixedNodes
}

const initTriangleRelations = (triangles: Triangle[]): {
    crossingTriangles: Map<Line3, [Triangle, Triangle]>,
    triangleNeighbors: Map<Triangle, Triangle[]>
} =>
{
    const crossingTriangles = new Map<Line3, [Triangle, Triangle]>()
    const triangleNeighbors = new Map<Triangle, Triangle[]>()

    const addNeighbor = (triangle: Triangle, neighbor: Triangle): void =>
    {
        const neighbors = triangleNeighbors.get(triangle)

        if (neighbors)
        {
            neighbors.push(neighbor)
        }
        else
        {
            triangleNeighbors.set(triangle, [neighbor])
        }
    }

    for (let i = 0; i < triangles.length - 1; i++)
    {
        const t1 = triangles[i]

        for (let j = i + 1; j < triangles.length; j++)
        {
            const t2 = triangles[j]
            const crossing = getCrossing(t1, t2)

            if (crossing)
            {
                addNeighbor(t1, t2)
                addNeighbor(t2, t1)
                crossingTriangles.set(crossing, [t1, t2])
            }
        }
    }

    return {
        crossingTriangles,
        triangleNeighbors
    }
}

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

        if (0 <= s1t && s1t <= 1 + 1e-7)
        {
            const s2t = (s1dx * dz - s1dz * dx) / determinant

            if (0 <= s2t && s2t <= 1 + 1e-7)
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
        if (!i || !path[i].equals(path[i - 1]))
        {
            filtered.push(path[i])
        }
    }

    return filtered
}

const mergeCorners = (triangles: Triangle[]): void =>
{
    const mergedCorners: Vector3[] = []
    const corners = <const>["a", "b", "c"]

    for (const triangle of triangles)
    {
        for (const property of corners)
        {
            const corner = triangle[property]
            const existing = mergedCorners.find(c => c.equals(corner))

            if (existing)
            {
                triangle[property] = existing
            }
            else
            {
                mergedCorners.push(corner)
            }
        }
    }
}
