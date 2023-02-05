export class Heap<T>
{
    private readonly array: T[] = []

    constructor(private readonly firstElementHasPriority: (a: T, b: T) => boolean)
    {}

    *[Symbol.iterator](): Generator<T | null>
    {
        while (this.array.length)
        {
            yield this.next()
        }
    }

    add(item: T): void
    {
        const index = this.array.length
        this.array.push(item)
        this.up(index)
    }

    get(find: (value: T, index: number) => unknown): T | null
    {
        return this.array.find(find) ?? null
    }

    next(): T | null
    {
        const top = this.array.pop() ?? null

        if (!top || !this.array.length)
        {
            return top
        }

        const returnValue = this.array[0]
        this.array[0] = top
        this.down(0)

        return returnValue
    }

    remove(value: T): void
    {
        const removedIndex = this.array.findIndex(v => v === value)

        if (removedIndex === -1)
        {
            return
        }

        if (removedIndex === this.array.length - 1)
        {
            this.array.pop()

            return
        }

        const removedElement = this.array[removedIndex]
        const lastElement = this.array[this.array.length - 1]
        this.array[removedIndex] = lastElement
        this.array.pop()

        if (this.firstElementHasPriority(removedElement, lastElement))
        {
            this.down(removedIndex)
        }
        else
        {
            this.up(removedIndex)
        }
    }

    size(): number
    {
        return this.array.length
    }

    private down(index: number): void
    {
        let currentIndex = index
        const max = this.array.length / 2 | 0

        while (currentIndex < max)
        {
            const leftIndex = currentIndex * 2 + 1
            const rightIndex = leftIndex + 1

            const hasRight = rightIndex < this.array.length

            const childIndex = hasRight && this.firstElementHasPriority(
                this.array[rightIndex],
                this.array[leftIndex]
            ) ? rightIndex : leftIndex

            const parent = this.array[currentIndex]
            const child = this.array[childIndex]

            if (this.firstElementHasPriority(parent, child))
            {
                break
            }

            this.array[currentIndex] = child
            this.array[childIndex] = parent
            currentIndex = childIndex
        }
    }

    private up(index: number): void
    {
        let currentIndex = index

        while (currentIndex)
        {
            const parentIndex = currentIndex - 1 >> 1
            const child = this.array[currentIndex]
            const parent = this.array[parentIndex]

            if (this.firstElementHasPriority(parent, child))
            {
                break
            }

            this.array[parentIndex] = child
            this.array[currentIndex] = parent
            currentIndex = parentIndex
        }
    }
}
