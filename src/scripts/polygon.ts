import { Line3, Vector3 } from "three"

export class Polygon
{
    readonly segments: Line3[] = []
    readonly waypoints: Vector3[] = []

    constructor(vectors: Vector3[], extrudeWaypoints: boolean)
    {
        const vector21 = new Vector3
        const vector32 = new Vector3

        for (let i = 0; i < vectors.length; i++)
        {
            const vector1 = vectors[i]
            const vector2 = vectors[(i + 1) % vectors.length]
            const vector3 = vectors[(i + 2) % vectors.length]

            vector21.copy(vector2).sub(vector1)
            vector32.copy(vector3).sub(vector2)

            const cross = vector21.cross(vector32)

            if (cross.y && cross.y < 0 === extrudeWaypoints)
            {
                this.waypoints.push(vector2)
            }

            const line = new Line3(vector1, vector2)
            this.segments.push(line)
        }
    }
}
