namespace Il2Cpp {
    export class ValueType extends NativeStruct {
        constructor(handle: NativePointer, readonly type: Type) {
            super(handle);
        }

        /** Boxes the current value type in a object. */
        box(): Object {
            return new Object(api.valueBox(this.type.class, this));
        }

        /** Gets the field with the given name. */
        field<T extends Field.Type>(name: string): Field<T> {
            return this.type.class.field<T>(name).withHolder(this);
        }

        /** */
        toString(): string {
            return this.isNull() ? "null" : this.box().toString();
        }
    }
}
