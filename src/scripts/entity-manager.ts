import { Entity } from "./entity"
import { storeDebug } from "./state"

export class EntityManager
{
    private readonly entities = new Map<string, Entity>()

    constructor(private root: Entity)
    {
        this.entities.set("root", this.root)
        const debug = new Entity()
        this.entities.set("debug", debug)

        storeDebug.subscribe(value =>
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

        if (existing && existing.parent)
        {
            existing.removeFromParent()
        }

        parent.add(entity)
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

        if (entity.parent)
        {
            entity.removeFromParent()
        }

        const parent = this.entities.get(parentId)

        if (!parent)
        {
            console.warn(`Parent not found: ${parentId}`)

            return
        }

        parent.add(entity)
    }

    detach(entityId: string): void
    {
        const entity = this.entities.get(entityId)

        if (!entity)
        {
            console.warn(`Entity not found: ${entityId}`)

            return
        }

        entity.removeFromParent()
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
