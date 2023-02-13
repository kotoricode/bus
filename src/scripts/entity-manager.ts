import { get } from "svelte/store"
import type { Object3D } from "three"
import type { Entity } from "./entity"
import { layer } from "./layer"
import { store } from "./store"

export class EntityManager
{
    readonly entities = new Map<string, Entity>()
    readonly entityDebug = new Map<string, Object3D>()

    constructor(private root: Entity)
    {
        this.entities.set("root", this.root)
    }

    addEntity(entityId: string, parentId: string, entity: Entity): void
    {
        const parent = this.getEntity(parentId)
        parent.add(entity)
        this.entities.set(entityId, entity)
    }

    addDebug(entityId: string, debug: Object3D): void
    {
        debug.name = "Debug"
        debug.layers.set(layer.debug)

        const entity = this.getEntity(entityId)
        const existingDebug = this.entityDebug.get(entityId)

        if (existingDebug)
        {
            entity.remove(existingDebug)
        }

        this.entityDebug.set(entityId, debug)

        const debugMode = get(store.debug)

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

    hasEntity(entityId: string): boolean
    {
        return this.entities.has(entityId)
    }

    removeEntity(entityId: string): void
    {
        this.detach(entityId)
        this.entities.delete(entityId)
        this.entityDebug.delete(entityId)
    }
}
