import { Entity } from "./entity"
import { storeDebug } from "./state"

export class EntityManager
{
    readonly entities = new Map<string, Entity>()

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

    add(entityId: string, parentId: string, entity: Entity): void
    {
        if (this.entities.get(entityId))
        {
            throw Error("Entity already exists")
        }

        const parent = this.entities.get(parentId)

        if (!parent)
        {
            throw Error("Parent not found")
        }

        parent.add(entity)
        this.entities.set(entityId, entity)
    }

    attach(entityId: string, parentId: string): void
    {
        const entity = this.entities.get(entityId)

        if (!entity)
        {
            throw Error(`Entity not found: ${entityId}`)
        }

        if (entity.parent)
        {
            entity.removeFromParent()
        }

        const parent = this.entities.get(parentId)

        if (!parent)
        {
            throw Error(`Parent not found: ${parentId}`)
        }

        parent.add(entity)
    }

    detach(entityId: string): void
    {
        const entity = this.entities.get(entityId)

        if (!entity)
        {
            throw Error(`Entity not found: ${entityId}`)
        }

        entity.removeFromParent()
    }

    has(entityId: string): boolean
    {
        return this.entities.has(entityId)
    }

    remove(entityId: string): void
    {
        this.detach(entityId)
        this.entities.delete(entityId)
    }
}
