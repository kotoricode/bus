import { Vector2, MathUtils } from "three"

export const createNoise = (
    cellsHorizontal: number,
    cellsVertical: number,
    imageWidth: number,
    imageHeight: number
): Uint8Array =>
{
    const nodes: Vector2[] = Array(cellsHorizontal * cellsVertical)

    for (let i = 0; i < nodes.length; i++)
    {
        const random = Math.random() * Math.PI * 2
        const dirX = Math.cos(random)
        const dirY = Math.sin(random)
        nodes[i] = new Vector2(dirX, dirY).normalize()
    }

    const result = new Uint8Array(4 * imageWidth * imageHeight)

    const cellWidth = imageWidth / cellsHorizontal
    const cellHeight = imageHeight / cellsVertical

    const cell = new Vector2()
    const local = new Vector2()
    const weight = new Vector2()

    const offNW = new Vector2()
    const offNE = new Vector2()
    const offSW = new Vector2()
    const offSE = new Vector2()

    for (let y = 0; y < imageHeight; y++)
    {
        const xOffset = imageWidth * y

        const yCell = y / cellHeight
        cell.y = yCell | 0
        local.y = yCell - cell.y

        const indexRowFirstCell = cell.y * cellsHorizontal

        offNW.y = -local.y
        offNE.y = -local.y
        offSW.y = 1 - local.y
        offSE.y = 1 - local.y

        weight.y = MathUtils.smootherstep(local.y, 0, 1)

        for (let x = 0; x < imageWidth; x++)
        {
            const xCell = x / cellWidth
            cell.x = xCell | 0
            local.x = xCell - cell.x

            const indexNW = indexRowFirstCell + cell.x
            const indexNE = indexRowFirstCell + (cell.x + 1) % cellsHorizontal

            const NW = nodes[indexNW]
            const NE = nodes[indexNE]
            const SW = nodes[(indexNW + cellsHorizontal) % nodes.length]
            const SE = nodes[(indexNE + cellsHorizontal) % nodes.length]

            offNW.x = local.x
            offNE.x = local.x - 1
            offSW.x = local.x
            offSE.x = local.x - 1

            const dotNW = NW.dot(offNW)
            const dotNE = NE.dot(offNE)
            const dotSW = SW.dot(offSW)
            const dotSE = SE.dot(offSE)

            weight.x = MathUtils.smootherstep(local.x, 0, 1)

            const lerpTop       = MathUtils.lerp(dotNW,   dotNE,      weight.x)
            const lerpBottom    = MathUtils.lerp(dotSW,   dotSE,      weight.x)
            const lerpTopBottom = MathUtils.lerp(lerpTop, lerpBottom, weight.y)

            const dataIndex = 4 * (x + xOffset)
            const value = (lerpTopBottom + Math.SQRT1_2) / Math.SQRT2 * 255

            result[dataIndex]     = value
            result[dataIndex + 1] = value
            result[dataIndex + 2] = value
            result[dataIndex + 3] = 255
        }
    }

    return result
}

export const addArrays = (...arrays: Uint8Array[]): Uint8Array =>
{
    const result = new Uint8Array(arrays[0].length)

    for (let i = 0; i < result.length; i += 4)
    {
        let value = 0

        for (const array of arrays)
        {
            value += array[i]
        }

        value /= arrays.length

        result[i]     = value
        result[i + 1] = value
        result[i + 2] = value
        result[i + 4] = 255
    }

    return result
}

export const multipleArrays = (...arrays: Uint8Array[]): Uint8Array =>
{
    const result = new Uint8Array(arrays[0].length)

    for (let i = 0; i < result.length; i += 4)
    {
        let value = 1

        for (const array of arrays)
        {
            value *= array[i]
        }

        value = value / 255**(arrays.length - 1)

        result[i]     = value
        result[i + 1] = value
        result[i + 2] = value
        result[i + 3] = 255
    }

    return result
}

export const lowPass = (array: Uint8Array, threshold: number): Uint8Array =>
{
    const result = new Uint8Array(array.length)

    for (let i = 0; i < result.length; i += 4)
    {
        const value = array[i] >= threshold ? array[i] : 0

        result[i]     = value
        result[i + 1] = value
        result[i + 2] = value
        result[i + 3] = 255
    }

    return result
}

export const highPass = (array: Uint8Array, threshold: number): Uint8Array =>
{
    const result = new Uint8Array(array.length)

    for (let i = 0; i < result.length; i += 4)
    {
        const value = array[i] <= threshold ? 0 : array[i]

        result[i]     = value
        result[i + 1] = value
        result[i + 2] = value
        result[i + 3] = 255
    }

    return result
}
