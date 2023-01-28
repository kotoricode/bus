import { Entity } from "./entity"
import { debugStore } from "./state"

export class EntityManager
{
    private readonly entities = new Map<string, Entity>()

    constructor(private root: Entity)
    {
        this.entities.set("root", this.root)
        const debug = new Entity()
        this.entities.set("debug", debug)

        debugStore.subscribe(value =>
        {
            if (value)
            {
                this.attach("debug", "root")
            }
            else
            {
                this.detach("debug")
            }
        })
    }

    *[Symbol.iterator](): IterableIterator<Entity>
    {
        yield* this.entities.values()
    }

    add(entityId: string, parentId: string, entity: Entity): void
    {
        const parent = this.entities.get(parentId)

        if (!parent)
        {
            console.warn("Parent not found")

            return
        }

        const existing = this.entities.get(entityId)

        if (existing && existing.object.parent)
        {
            existing.object.removeFromParent()
        }

        parent.object.add(entity.object)
        this.entities.set(entityId, entity)
    }

    attach(entityId: string, parentId: string): void
    {
        const entity = this.entities.get(entityId)

        if (!entity)
        {
            console.warn(`Entity not found: ${entityId}`)

            return
        }

        if (entity.object.parent)
        {
            entity.object.removeFromParent()
        }

        const parent = this.entities.get(parentId)

        if (!parent)
        {
            console.warn(`Parent not found: ${parentId}`)

            return
        }

        parent.object.add(entity.object)
    }

    detach(entityId: string): void
    {
        const entity = this.entities.get(entityId)

        if (!entity)
        {
            console.warn(`Entity not found: ${entityId}`)

            return
        }

        entity.object.removeFromParent()
    }

    has(entityId: string): boolean
    {
        return !!this.entities.get(entityId)
    }

    remove(entityId: string): void
    {
        this.detach(entityId)
        this.entities.delete(entityId)
    }
}
