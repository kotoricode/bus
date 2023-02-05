import { time } from "../time"

export const eventTimer = (timer: number): () => boolean =>
{
    return (): boolean =>
    {
        const deltaTime = time.delta()
        timer -= deltaTime

        return timer <= 0
    }
}
