import type { Scene } from "three"
import type { Character } from "../character"
import { GameTask } from "./game-task"

export class TaskUpdateModels extends GameTask
{
    constructor(
        private readonly scene: Scene,
        private readonly characters: Map<string, Character>)
    {
        super()
    }

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
