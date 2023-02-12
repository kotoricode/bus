import { Group } from "three"
import type { ComponentCollider } from "./components/component-collider"
import type { ComponentMovement } from "./components/component-movement"
import type { ComponentPicking } from "./components/component-picking"

type Component = typeof ComponentCollider |
                 typeof ComponentMovement |
                 typeof ComponentPicking

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
            this.components.set(constructor, component)
        }
    }

    getComponent<T extends Component>(constructor: T): InstanceType<T> | null
    {
        return <InstanceType<T> | null>this.components.get(constructor) ?? null
    }

    getComponentUnwrap<T extends Component>(constructor: T, errorMessage = ""): InstanceType<T>
    {
        const component = <InstanceType<T> | null>this.components.get(constructor)

        if (!component)
        {
            throw Error(errorMessage)
        }

        return component
    }

    removeComponents(...components: readonly InstanceType<Component>[]): void
    {
        for (const component of components)
        {
            const constructor = <Component>component.constructor
            this.components.delete(constructor)
        }
    }
}
