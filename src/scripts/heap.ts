export class Heap<T>
{
    private readonly array: T[] = []

    constructor(private readonly compare: (a: T, b: T) => boolean)
    {}

    *[Symbol.iterator](): Generator<T | undefined>
    {
        while (this.array.length)
        {
            yield this.next()
        }
    }

    add(item: T): void
    {
        let index = this.array.length
        this.array.push(item)

        while (index)
        {
            const parentIndex = index - 1 >> 1
            const child = this.array[index]
            const parent = this.array[parentIndex]

            if (this.compare(parent, child))
            {
                break
            }

            this.array[parentIndex] = child
            this.array[index] = parent
            index = parentIndex
        }
    }

    next(): T | undefined
    {
        const top = this.array.pop()

        if (!top || !this.array.length)
        {
            return top
        }

        const returnValue = this.array[0]
        this.array[0] = top
        let parentIndex = 0
        const max = this.array.length / 2 | 0

        while (parentIndex < max)
        {
            const leftIndex = parentIndex * 2 + 1
            const rightIndex = leftIndex + 1

            const hasRight = rightIndex < this.array.length

            const childIndex = hasRight && this.compare(
                this.array[rightIndex],
                this.array[leftIndex]
            ) ? rightIndex : leftIndex

            const parent = this.array[parentIndex]
            const child = this.array[childIndex]

            if (this.compare(parent, child))
            {
                break
            }

            this.array[parentIndex] = child
            this.array[childIndex] = parent
            parentIndex = childIndex
        }

        return returnValue
    }
}
