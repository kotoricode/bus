import type { Object3D } from "three"

export class EntityManager
{
    private readonly entities = new Map<string, Object3D>()

    constructor(private root: Object3D)
    {

    }

    add(entityId: string, parentId: string, entity: Object3D): void
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
            console.warn("Entity not found")

            return
        }

        if (entity.parent)
        {
            entity.removeFromParent()
        }

        const parent = this.entities.get(parentId)

        if (!parent)
        {
            console.warn("Parent not found")

            return
        }

        parent.add(entity)
    }

    detach(entityId: string): void
    {
        const entity = this.entities.get(entityId)

        if (!entity)
        {
            console.warn("Entity not found")

            return
        }

        entity.removeFromParent()
    }

    remove(entityId: string): void
    {
        this.detach(entityId)
        this.entities.delete(entityId)
    }
}
