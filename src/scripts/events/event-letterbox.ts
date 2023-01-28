import { letterboxStore } from "../state"
import { EventBase } from "./event-base"

export class EventLetterbox extends EventBase
{
    constructor(private value: boolean)
    {
        super()
    }

    override run(): void
    {
        letterboxStore.set(this.value)
        this.done = true
    }
}
