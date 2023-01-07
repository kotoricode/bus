import { Line3, Vector3 } from "three"
import { Heap } from "./heap"
import type { Polygon } from "./polygon"

class Node
{
    constructor(
        public readonly waypoint: Vector3,
        public readonly estimated: number,
        public readonly accumulated: number,
        public readonly index: number,
        public readonly previous: Node | null
    )
    {}
}

const worldSegment = new Line3(
    new Vector3(0, 0, 20),
    new Vector3
)

const globalWaypoints: Vector3[] = []

const buildGlobalWaypoints = (ground: Polygon, obstacles: Polygon[]): void =>
{
    globalWaypoints.length = 0

    waypoints:
    for (const waypoint of ground.waypoints)
    {
        worldSegment.end.copy(waypoint)

        for (const obstacle of obstacles)
        {
            if (getEndInside(worldSegment, obstacle))
            {
                continue waypoints
            }
        }

        globalWaypoints.push(waypoint)
    }

    for (const obstacle of obstacles)
    {
        waypoints:
        for (const waypoint of obstacle.waypoints)
        {
            worldSegment.end.copy(waypoint)

            if (getEndInside(worldSegment, ground))
            {
                for (const otherObstacle of obstacles)
                {
                    if (otherObstacle !== obstacle && getEndInside(worldSegment, otherObstacle))
                    {
                        continue waypoints
                    }
                }

                globalWaypoints.push(waypoint)
            }
        }
    }
}

const buildPath = (segment: Line3, neighbors: Map<Vector3, Vector3[]>): Vector3[] =>
{
    const candidates = new Heap<Node>((a, b) => a.estimated < b.estimated)

    let node: Node | null = new Node(
        segment.start,
        0,
        segment.distanceSq(),
        0,
        null
    )

    while (node)
    {
        const nodeNeighbors = neighbors.get(node.waypoint)
        neighbors.delete(node.waypoint)

        if (!nodeNeighbors)
        {
            throw Error
        }

        for (const neighbor of nodeNeighbors)
        {
            if (neighbor === segment.end)
            {
                const path: Vector3[] = Array(node.index + 1)
                path[node.index + 1] = segment.end

                while (node)
                {
                    path[node.index] = node.waypoint
                    node = node.previous
                }

                return path
            }

            if (neighbors.has(neighbor))
            {
                const accumulated = node.accumulated + node.waypoint.distanceToSquared(neighbor)

                const neighborNode = new Node(
                    neighbor,
                    accumulated + neighbor.distanceToSquared(segment.end),
                    accumulated,
                    node.index + 1,
                    node
                )

                candidates.add(neighborNode)
            }
        }

        node = candidates.next() ?? null
    }

    throw Error
}

const connectWaypoints = (waypoints: Vector3[], polygons: Polygon[]): Map<Vector3, Vector3[]> =>
{
    const neighbors = new Map<Vector3, Vector3[]>()
    const segment = new Line3

    for (let i = 0; i < waypoints.length - 1; i++)
    {
        segment.start = waypoints[i]
        let waypointNeighbors = neighbors.get(segment.start)

        if (!waypointNeighbors)
        {
            waypointNeighbors = []
            neighbors.set(segment.start, waypointNeighbors)
        }

        for (let j = i + 1; j < waypoints.length; j++)
        {
            segment.end = waypoints[j]

            if (getDirect(segment, polygons))
            {
                waypointNeighbors.push(segment.end)
                const otherNodeNeighbors = neighbors.get(segment.end)

                if (otherNodeNeighbors)
                {
                    otherNodeNeighbors.push(segment.start)
                }
                else
                {
                    neighbors.set(segment.end, [segment.start])
                }
            }
        }
    }

    return neighbors
}

const getDirect = (segment: Line3, polygons: Polygon[]): boolean =>
{
    for (const polygon of polygons)
    {
        for (const polygonSegment of polygon.segments)
        {
            if (segmentsIntersect(segment, polygonSegment))
            {
                return false
            }
        }
    }

    return true
}

const getEndInside = (segment: Line3, polygon: Polygon): boolean =>
{
    let inside = false

    for (const polySegment of polygon.segments)
    {
        if (segmentsIntersect(segment, polySegment))
        {
            inside = !inside
        }
    }

    return inside
}

const getPath = (segment: Line3, ground: Polygon, obstacles: Polygon[]): Vector3[] =>
{
    const waypoints: Vector3[] = [segment.start, segment.end]

    for (const target of waypoints)
    {
        if (!getTargetValid(target, ground, obstacles))
        {
            return []
        }
    }

    const polygons = [ground, ...obstacles]

    if (getDirect(segment, polygons))
    {
        return waypoints
    }

    for (const polygon of polygons)
    {
        for (const waypoint of polygon.waypoints)
        {
            if (globalWaypoints.includes(waypoint))
            {
                waypoints.push(waypoint)
            }
        }
    }

    const neighbors = connectWaypoints(waypoints, polygons)

    return buildPath(segment, neighbors)
}

const getTargetValid = (target: Vector3, ground: Polygon, obstacles: Polygon[]): boolean =>
{
    worldSegment.end.copy(target)

    if (!getEndInside(worldSegment, ground))
    {
        return false
    }

    for (const obstacle of obstacles)
    {
        if (getEndInside(worldSegment, obstacle))
        {
            return false
        }
    }

    return true
}

const segmentsIntersect = (segment1: Line3, segment2: Line3): boolean =>
{
    const segment1dx = segment1.end.x - segment1.start.x
    const segment1dz = segment1.end.z - segment1.start.z
    const segment2dx = segment2.end.x - segment2.start.x
    const segment2dz = segment2.end.z - segment2.start.z

    const determinant = segment2dx * segment1dz - segment1dx * segment2dz

    if (determinant)
    {
        const dx = segment2.start.x - segment1.start.x
        const dz = segment2.start.z - segment1.start.z

        const a = (segment2dx * dz - segment2dz * dx) / determinant

        if (0 <= a && a <= 1)
        {
            const b = (segment1dx * dz - segment1dz * dx) / determinant

            return 0 <= b && b < 1
        }
    }

    return false
}

export const pathing = <const>{
    buildGlobalWaypoints,
    getEndInside,
    getPath,
    getTargetValid
}
