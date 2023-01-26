import type { Scene } from "three"
import type { Character } from "../character"
import type { GameTask } from "./task"

export class TaskUpdateModels implements GameTask
{
    constructor(
        private readonly scene: Scene,
        private readonly characters: Map<string, Character>)
    {}

    run(): void
    {
        for (const character of this.characters.values())
        {
            if (character.pendingMesh)
            {
                this.scene.remove(character.mesh)
                character.mesh = character.pendingMesh
                character.pendingMesh = null
                this.scene.add(character.mesh)
            }

            character.updateMeshTransform()
        }
    }
}
