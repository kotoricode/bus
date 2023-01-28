import { Group } from "three"
import type { ComponentMovement } from "./components/component-movement"

type Component = typeof ComponentMovement

export class Entity extends Group
{
    private readonly components = new Map<Component, InstanceType<Component>>()

    constructor()
    {
        super()
    }

    addComponents(...components: readonly InstanceType<Component>[]): void
    {
        for (const component of components)
        {
            const constructor = <Component>component.constructor

            if (this.hasComponent(constructor))
            {
                throw Error("Duplicate component")
            }

            this.components.set(constructor, component)
        }
    }

    getComponent<T extends Component>(constructor: T): InstanceType<T>
    {
        if (!this.hasComponent(constructor))
        {
            throw Error("Missing component")
        }

        return <InstanceType<T>>this.components.get(constructor)
    }

    hasComponent<T extends Component>(constructor: T): boolean
    {
        return this.components.has(constructor)
    }

    removeComponents(...components: readonly InstanceType<Component>[]): void
    {
        for (const component of components)
        {
            const constructor = <Component>component.constructor

            if (!this.hasComponent(constructor))
            {
                throw Error("Missing component")
            }

            this.components.delete(constructor)
        }
    }
}
