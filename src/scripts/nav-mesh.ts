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

export type NavMeshIntersection = {
    readonly triangle: Triangle
    readonly point: Vector3
}

export type NavMesh = {
    getGridDebugObject: () => Entity,
    getGridIntersection: (raycaster: Readonly<Raycaster>) => NavMeshIntersection | null,
    getPath: (segment: Readonly<Line3>) => Vector3[] | null
}

export const createNavMesh = (grid: Triangle[]): NavMesh =>
{
    const fixedNodes: Vector3[] = []
    const triangleNeighbors = new Map<Triangle, Triangle[]>()
    const crossingTriangles = new Map<Line3, [Triangle, Triangle]>()
    const fixedNodePaths = new Map<Vector3, Map<Vector3, Vector3[]>>()

    const getGridDebugObject = (): Entity =>
    {
        const object = new Entity()
        object.layers.set(layer.debug)

        const lineMaterial = new LineBasicMaterial({
            color: 0xffffff
        })

        for (const triangle of grid)
        {
            const geometry = new BufferGeometry().setFromPoints([
                triangle.a, triangle.b, triangle.c, triangle.a
            ])

            const line = new Line(geometry, lineMaterial)
            line.layers.set(layer.debug)
            object.add(line)
        }

        const fixedNodeGeometry = new SphereGeometry(0.08)
        const fixedNodeMaterial = new MeshBasicMaterial({
            color: 0x40E0D0,
        })

        for (const node of fixedNodes)
        {
            const mesh = new Mesh(fixedNodeGeometry, fixedNodeMaterial)
            mesh.layers.set(layer.debug)
            mesh.position.copy(node)
            object.add(mesh)
        }

        return object
    }

    const getGridIntersection = (raycaster: Readonly<Raycaster>): NavMeshIntersection | null =>
    {
        const target = new Vector3()

        for (const triangle of grid)
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

    const getPath = (segment: Readonly<Line3>): Vector3[] | null =>
    {
        const start = getTriangleAt(segment.start)
        const end = getTriangleAt(segment.end)

        if (!start || !end)
        {
            return null
        }

        if (start === end)
        {
            return [segment.start, segment.end]
        }

        if (getSameCluster(start, end, segment))
        {
            const path = getSegmentPath(segment)

            return filterDuplicateWaypoints(path)
        }

        const pathViaNodes = getPathViaNodes(segment)

        return pathViaNodes
    }

    const addNeighbor = (triangle: Readonly<Triangle>, neighbor: Readonly<Triangle>): void =>
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

    const getCluster = (segment: Readonly<Line3>): Triangle[] =>
    {
        const cluster: Triangle[] = []

        for (const [crossing, triangles] of crossingTriangles)
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

    const getPathViaNodes = (segment: Readonly<Line3>): Vector3[] | null =>
    {
        const nodeNeighbors = getPathViaNodesConnectNodes(segment)

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
                    return getPathViaNodesBuild(segment, currentNodeData)
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

    const getPathViaNodesBuild = (segment: Readonly<Line3>, node: Readonly<NodeData>): Vector3[] =>
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
            const segmentPath = getPathViaNodesBuildGetSegmentPath(pathSegment)
            path.push(...segmentPath)
        }

        return filterDuplicateWaypoints(path)
    }

    const getPathViaNodesBuildGetSegmentPath = (segment: Readonly<Line3>): Vector3[] =>
    {
        const existingPaths = fixedNodePaths.get(segment.start)

        if (existingPaths)
        {
            const existingPath = existingPaths.get(segment.end)

            if (existingPath)
            {
                return existingPath
            }
        }

        return getSegmentPath(segment)
    }

    const getPathViaNodesConnectNodes = (segment: Readonly<Line3>): Map<Vector3, Vector3[]> =>
    {
        const connectSegment = new Line3()
        const neighbors = new Map<Vector3, Vector3[]>()

        for (const dynamicNode of [segment.start, segment.end])
        {
            connectSegment.start = dynamicNode
            const start = getTriangleAt(dynamicNode)

            if (!start)
            {
                continue
            }

            for (const fixedNode of fixedNodes)
            {
                connectSegment.end = fixedNode
                const end = getTriangleAt(fixedNode)

                if (!end || !getSameCluster(start, end, connectSegment))
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

        for (const [fixedNode, paths] of fixedNodePaths)
        {
            const fixedNodeNeighbors = neighbors.get(fixedNode)
            const pathedNeighborsKeysIter = paths.keys()

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

    const getSameCluster = (
        start: Readonly<Triangle>,
        end: Readonly<Triangle>,
        segment: Readonly<Line3>
    ): boolean =>
    {
        const cluster = getCluster(segment)

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
            const neighbors = triangleNeighbors.get(current)

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

    const getSegmentPath = (segment: Readonly<Line3>): Vector3[] =>
    {
        const path: Vector3[] = [segment.start, segment.end]

        for (const crossing of crossingTriangles.keys())
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

    const getTriangleAt = (point: Readonly<Vector3>): Triangle | null =>
    {
        const raise = 0.1

        const pointRaised = point.clone()
        pointRaised.y += raise

        const down = new Vector3(0, -1, 0)
        const near = raise / 2
        const far = near + raise

        const raycaster = new Raycaster(pointRaised, down, near, far)
        const intersection = getGridIntersection(raycaster)

        if (intersection)
        {
            return intersection.triangle
        }

        return null
    }

    const initFixedNodePaths = (): void =>
    {
        const segment = new Line3()

        for (let i = 0; i < fixedNodes.length - 1; i++)
        {
            segment.start = fixedNodes[i]
            const start = getTriangleAt(segment.start)

            if (!start)
            {
                continue
            }

            for (let j = i + 1; j < fixedNodes.length; j++)
            {
                segment.end = fixedNodes[j]
                const end = getTriangleAt(segment.end)

                if (!end || !getSameCluster(start, end, segment))
                {
                    continue
                }

                const path = getSegmentPath(segment)

                const filtered = filterDuplicateWaypoints(path)
                const filteredReversed = filtered.slice()
                filteredReversed.reverse()

                initFixedNodePathsConnectPath(fixedNodePaths, segment.start, segment.end, filtered)
                initFixedNodePathsConnectPath(fixedNodePaths, segment.end, segment.start, filteredReversed)
            }
        }
    }

    const initFixedNodes = (): void =>
    {
        const pointAngle = new Map<Vector3, number>()

        const vec1 = new Vector3()
        const vec2 = new Vector3()

        for (const triangle of grid)
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
    }

    const initGrid = (): void =>
    {
        const mergedCorners: Vector3[] = []
        const corners = <const>["a", "b", "c"]

        for (const triangle of grid)
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

        for (let i = 0; i < grid.length - 1; i++)
        {
            const t1 = grid[i]

            for (let j = i + 1; j < grid.length; j++)
            {
                const t2 = grid[j]
                const crossing = getCrossing(t1, t2)

                if (crossing)
                {
                    addNeighbor(t1, t2)
                    addNeighbor(t2, t1)
                    crossingTriangles.set(crossing, [t1, t2])
                }
            }
        }
    }

    initGrid()
    initFixedNodes()
    initFixedNodePaths()

    return {
        getGridDebugObject,
        getGridIntersection,
        getPath
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

const initFixedNodePathsConnectPath = (
    fixedNodePaths: Map<Vector3, Map<Vector3, Vector3[]>>,
    n1: Readonly<Vector3>,
    n2: Readonly<Vector3>,
    path: Vector3[]
): void =>
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
