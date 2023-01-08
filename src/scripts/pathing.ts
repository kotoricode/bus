import { Line3, Vector3 } from "three"
import { Heap } from "./heap"
import type { Polygon } from "./polygon"

type Node ={
    readonly waypoint: Vector3
    readonly estimated: number
    readonly accumulated: number
    readonly index: number
    readonly previous: Node | null
}

type Intersection = {
    readonly segment1t: number
    readonly distance: number
}

const worldSegment = new Line3(
    new Vector3(0, 0, 20),
    new Vector3()
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
            if (getEndInside(worldSegment, obstacle, false))
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

            if (!getEndInside(worldSegment, ground, true))
            {
                continue
            }

            for (const other of obstacles)
            {
                if (other !== obstacle && getEndInside(worldSegment, other, false))
                {
                    continue waypoints
                }
            }

            globalWaypoints.push(waypoint)
        }
    }
}

const buildPath = (segment: Line3, neighbors: Map<Vector3, Vector3[]>): Vector3[] =>
{
    const candidates = new Heap<Node>((a, b) => a.estimated < b.estimated)

    let node: Node | null = {
        waypoint: segment.start,
        estimated: 0,
        accumulated: segment.distanceSq(),
        index: 0,
        previous: null
    }

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

                const neighborNode = {
                    waypoint: neighbor,
                    estimated: accumulated + neighbor.distanceToSquared(segment.end),
                    accumulated,
                    index: node.index + 1,
                    previous: node
                }

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
    const segment = new Line3()

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
            if (intersect(segment, polygonSegment, false, false, false, false))
            {
                return false
            }
        }
    }

    return true
}

const getEndInside = (segment: Line3, polygon: Polygon, isGround: boolean): boolean =>
{
    const intersections: Intersection[] = []
    let finalIntersection: Intersection

    for (const polySegment of polygon.segments)
    {
        // segment2 half-open to avoid double collisions at polygon seams
        const intersection = intersect(segment, polySegment, false, false, false, true)

        if (intersection)
        {
            intersections.push(intersection)
        }
    }

    if (!intersections.length)
    {
        return false
    }

    if (isGround)
    {
        if (intersections.length % 2 === 0)
        {
            // exit, exit intersection; outside ground
            return false
        }

        intersections.sort((a, b) => a.distance - b.distance)
        finalIntersection = intersections[intersections.length - 1]

        if (finalIntersection.segment1t === 1)
        {
            // enter intersection; outside ground
            return false
        }

        // enter
        return true
    }

    if (intersections.length % 2 === 1)
    {
        // enter, enter intersection; inside collider
        return true
    }

    intersections.sort((a, b) => a.distance - b.distance)
    finalIntersection = intersections[intersections.length - 1]

    if (finalIntersection.segment1t === 1)
    {
        // exit intersection; inside collider
        return true
    }

    // exit
    return false
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

    if (!getEndInside(worldSegment, ground, true))
    {
        return false
    }

    for (const obstacle of obstacles)
    {
        if (getEndInside(worldSegment, obstacle, false))
        {
            return false
        }
    }

    return true
}

const intersect = (
    segment1: Line3,
    segment2: Line3,
    segment1StartOpen: boolean,
    segment1EndOpen: boolean,
    segment2StartOpen: boolean,
    segment2EndOpen: boolean
): Intersection | null =>
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

        const segment1t = (segment2dx * dz - segment2dz * dx) / determinant

        const s1s = segment1StartOpen ? 0 < segment1t : 0 <= segment1t
        const s1e = segment1EndOpen ? segment1t < 1: segment1t <= 1

        if (s1e && s1s)
        {
            const segment2t = (segment1dx * dz - segment1dz * dx) / determinant

            const s2s = segment2StartOpen ? 0 < segment2t : 0 <= segment2t
            const s2e = segment2EndOpen ? segment2t < 1 : segment2t <= 1

            if (s2s && s2e)
            {
                const point = new Vector3(
                    segment1.start.x + segment1dx * segment1t,
                    0,
                    segment1.start.z + segment1dz * segment1t
                )

                const distance = point.length()

                return { segment1t, distance }
            }
        }
    }

    return null
}

const test = (): void =>
{
    // const s1 = new Line3(
    //     new Vector3(-1, 0, 0),
    //     new Vector3(1, 0, 0)
    // )

    // const s2 = new Line3(
    //     new Vector3(0, 0, 1),
    //     new Vector3(-0.5, 0, 0),
    // )

    // const result = segmentsIntersect(s1, s2)
    // console.log(result)
}

export const pathing = <const>{
    buildGlobalWaypoints,
    getEndInside,
    getPath,
    getTargetValid,
    test
}
