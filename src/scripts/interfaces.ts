import type { Camera } from "three"

export interface GameTask
{
    run(): void
}

export interface GameCamera
{
    camera: Camera
}
