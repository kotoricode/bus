import { get } from "svelte/store"
import type { Object3D } from "three"
import type { Entity } from "./entity"
import { storeDebug } from "./state"

export class EntityManager
{
    readonly entities = new Map<string, Entity>()
    readonly entityDebug = new Map<string, Object3D>()

    constructor(private root: Entity)
    {
        this.entities.set("root", this.root)

        storeDebug.subscribe(value =>
        {
            for (const [entityId, debug] of this.entityDebug)
            {
                const entity = this.getEntity(entityId)

                if (value)
                {
                    entity.add(debug)
                }
                else
                {
                    entity.remove(debug)
                }
            }
        })
    }

    add(entityId: string, parentId: string, entity: Entity): void
    {
        const parent = this.getEntity(parentId)
        parent.add(entity)
        this.entities.set(entityId, entity)
    }

    addDebug(entityId: string, debug: Object3D): void
    {
        const entity = this.getEntity(entityId)

        debug.name = "debug"

        const existingDebug = this.entityDebug.get(entityId)

        if (existingDebug)
        {
            entity.remove(existingDebug)
        }

        this.entityDebug.set(entityId, debug)

        const debugMode = get(storeDebug)

        if (debugMode)
        {
            entity.add(debug)
        }
    }

    attach(entityId: string, parentId: string): void
    {
        const entity = this.getEntity(entityId)
        const parent = this.getEntity(parentId)

        if (entity.parent)
        {
            entity.removeFromParent()
        }

        parent.add(entity)
    }

    detach(entityId: string): void
    {
        const entity = this.getEntity(entityId)
        entity.removeFromParent()
    }

    getDebug(entityId: string): Object3D
    {
        const debug = this.entityDebug.get(entityId)

        if (!debug)
        {
            throw Error("Missing debug object")
        }

        return debug
    }

    private getEntity(entityId: string): Entity
    {
        const entity = this.entities.get(entityId)

        if (!entity)
        {
            throw Error(`Entity not found: ${entityId}`)
        }

        return entity
    }

    has(entityId: string): boolean
    {
        return this.entities.has(entityId)
    }

    remove(entityId: string): void
    {
        this.detach(entityId)
        this.entities.delete(entityId)
        this.entityDebug.delete(entityId)
    }
}
