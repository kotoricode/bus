import { Line3, Vector3 } from "three"

export class Polygon
{
    readonly segments: Line3[] = []
    readonly waypoints: Vector3[] = []

    constructor(vectors: Vector3[], extrudeWaypoints: boolean)
    {
        const vector21 = new Vector3
        const vector32 = new Vector3
        const cross = new Vector3

        for (let i = 0; i < vectors.length; i++)
        {
            const vector1 = vectors[i]
            const vector2 = vectors[(i + 1) % vectors.length]
            const vector3 = vectors[(i + 2) % vectors.length]

            vector21.copy(vector2).sub(vector1)
            vector32.copy(vector3).sub(vector2)

            cross.copy(vector21).cross(vector32)

            if (cross.y && cross.y < 0 === extrudeWaypoints)
            {
                // todo: obstacles

                const a = vector21.clone().normalize()
                const b = vector32.clone().normalize()

                const ab = new Vector3(b.x - a.x, 0, b.z - a.z)
                ab.normalize().multiplyScalar(-0.0001)
                ab.add(vector2)
                this.waypoints.push(ab)
            }

            const line = new Line3(vector1, vector2)
            this.segments.push(line)
        }
    }
}
