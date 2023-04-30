namespace Il2Cpp {
    export class Field<T extends Field.Type = Field.Type> extends NativeStruct {
        /** Gets the class in which this field is defined. */
        @lazy
        get class(): Class {
            return new Class(api.fieldGetClass(this));
        }

        /** Gets the flags of the current field. */
        @lazy
        get flags(): number {
            return api.fieldGetFlags(this);
        }

        /** Determines whether this field value is known at compile time. */
        @lazy
        get isLiteral(): boolean {
            return !!api.fieldIsLiteral(this);
        }

        /** Determines whether this field is static. */
        @lazy
        get isStatic(): boolean {
            return !!api.fieldIsStatic(this);
        }

        /** Determines whether this field is thread static. */
        @lazy
        get isThreadStatic(): boolean {
            return !!api.fieldIsThreadStatic(this);
        }

        /** Gets the access modifier of this field. */
        @lazy
        get modifier(): string {
            return api.fieldGetModifier(this).readUtf8String()!;
        }

        /** Gets the name of this field. */
        @lazy
        get name(): string {
            return api.fieldGetName(this).readUtf8String()!;
        }

        /** Gets the offset of this field, calculated as the difference with its owner virtual address. */
        @lazy
        get offset(): number {
            return api.fieldGetOffset(this);
        }

        /** Gets the type of this field. */
        @lazy
        get type(): Type {
            return new Type(api.fieldGetType(this));
        }

        /** Gets the value of this field. */
        get value(): T {
            const handle = Memory.alloc(Process.pointerSize);
            api.fieldGetStaticValue(this.handle, handle);

            return read(handle, this.type) as T;
        }

        /** Sets the value of this field. Thread static or literal values cannot be altered yet. */
        set value(value: T) {
            if (this.isThreadStatic || this.isLiteral) {
                raise(`cannot write the value of field ${this.name} as it's thread static or literal`);
            }

            const handle = Memory.alloc(Process.pointerSize);
            write(handle, value, this.type);

            api.fieldSetStaticValue(this.handle, handle);
        }

        /** */
        toString(): string {
            return `\
${this.isThreadStatic ? `[ThreadStatic] ` : ``}\
${this.isStatic ? `static ` : ``}\
${this.type.name} \
${this.name}\
${this.isLiteral ? ` = ${this.type.class.isEnum ? read((this.value as ValueType).handle, this.type.class.baseType!) : this.value}` : ``};\
${this.isThreadStatic || this.isLiteral ? `` : ` // 0x${this.offset.toString(16)}`}`;
        }

        /** @internal */
        withHolder(instance: Object | ValueType): Field<T> {
            let valueHandle = instance.handle.add(this.offset);
            if (instance instanceof ValueType) {
                valueHandle = valueHandle.sub(Object.headerSize);
            }

            return new Proxy(this, {
                get(target: Field<T>, property: keyof Field): any {
                    if (property == "value") {
                        return read(valueHandle, target.type);
                    }
                    return Reflect.get(target, property);
                },

                set(target: Field<T>, property: keyof Field, value: any): boolean {
                    if (property == "value") {
                        write(valueHandle, value, target.type);
                        return true;
                    }

                    return Reflect.set(target, property, value);
                }
            });
        }
    }

    export namespace Field {
        export type Type = boolean | number | Int64 | UInt64 | NativePointer | Pointer | ValueType | Object | String | Array;

        export const enum Attributes {
            FieldAccessMask = 0x0007,
            PrivateScope = 0x0000,
            Private = 0x0001,
            FamilyAndAssembly = 0x0002,
            Assembly = 0x0003,
            Family = 0x0004,
            FamilyOrAssembly = 0x0005,
            Public = 0x0006,
            Static = 0x0010,
            InitOnly = 0x0020,
            Literal = 0x0040,
            NotSerialized = 0x0080,
            SpecialName = 0x0200,
            PinvokeImpl = 0x2000,
            ReservedMask = 0x9500,
            RTSpecialName = 0x0400,
            HasFieldMarshal = 0x1000,
            HasDefault = 0x8000,
            HasFieldRVA = 0x0100
        }
    }
}
