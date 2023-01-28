import { storeLetterbox } from "../state"
import { EventBase } from "./event-base"

export class EventLetterbox extends EventBase
{
    constructor(private value: boolean)
    {
        super()
    }

    override run(): void
    {
        storeLetterbox.set(this.value)
        this.done = true
    }
}
