export abstract class EventBase
{
    protected completed = false

    getCompleted(): boolean
    {
        return this.completed
    }

    abstract run(): void
}
