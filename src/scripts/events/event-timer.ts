import { clock } from "../clock"

export const eventTimer = (timer: number): () => boolean =>
    (): boolean =>
    {
        const dt = clock.getDeltaTime()
        timer -= dt

        return timer <= 0
    }
