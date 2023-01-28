export const eventParallel = (events: (() => boolean)[]): () => boolean =>
{
    const completed: (() => boolean)[] = []

    return (): boolean =>
    {
        for (const event of events)
        {
            if (!completed.includes(event) && event())
            {
                completed.push(event)
            }
        }

        return completed.length === events.length
    }
}
