namespace Il2Cpp {
    export class Parameter {
        /** Name of this parameter. */
        readonly name: string;

        /** Position of this parameter. */
        readonly position: number;

        /** Type of this parameter. */
        readonly type: Type;

        constructor(name: string, position: number, type: Type) {
            this.name = name;
            this.position = position;
            this.type = type;
        }

        /** */
        toString(): string {
            return `${this.type.name} ${this.name}`;
        }
    }

    export namespace Parameter {
        export type Type = Field.Type | Reference;
    }
}
