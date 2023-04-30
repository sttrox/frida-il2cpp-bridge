namespace Il2Cpp {
    export class Reference<T extends Field.Type = Field.Type> extends NativeStruct {
        constructor(handle: NativePointer, readonly type: Type) {
            super(handle);
        }

        /** Gets the element referenced by the current reference. */
        get value(): T {
            return read(this.handle, this.type) as T;
        }

        /** Sets the element referenced by the current reference. */
        set value(value: T) {
            write(this.handle, value, this.type);
        }

        /** */
        toString(): string {
            return this.isNull() ? "null" : `->${this.value}`;
        }
    }

    export function reference<T extends number | NativePointer>(value: T, type: Type): Reference<T>;

    export function reference<T extends Exclude<Field.Type, number | NativePointer>>(value: T): Reference<T>;

    /** Creates a reference to the specified value. */
    export function reference<T extends Field.Type>(value: T, type?: Type): Reference<T> {
        const handle = Memory.alloc(Process.pointerSize);

        switch (typeof value) {
            case "boolean":
                return new Reference(handle.writeS8(+value), corlib.class("System.Boolean").type);
            case "number":
                switch (type?.typeEnum) {
                    case Type.Enum.U1:
                        return new Reference<T>(handle.writeU8(value), type);
                    case Type.Enum.I1:
                        return new Reference<T>(handle.writeS8(value), type);
                    case Type.Enum.Char:
                    case Type.Enum.U2:
                        return new Reference<T>(handle.writeU16(value), type);
                    case Type.Enum.I2:
                        return new Reference<T>(handle.writeS16(value), type);
                    case Type.Enum.U4:
                        return new Reference<T>(handle.writeU32(value), type);
                    case Type.Enum.I4:
                        return new Reference<T>(handle.writeS32(value), type);
                    case Type.Enum.U8:
                        return new Reference<T>(handle.writeU64(value), type);
                    case Type.Enum.I8:
                        return new Reference<T>(handle.writeS64(value), type);
                    case Type.Enum.R4:
                        return new Reference<T>(handle.writeFloat(value), type);
                    case Type.Enum.R8:
                        return new Reference<T>(handle.writeDouble(value), type);
                }
            case "object":
                if (value instanceof ValueType || value instanceof Pointer) {
                    return new Reference<T>(handle.writePointer(value), value.type);
                } else if (value instanceof Object) {
                    return new Reference<T>(handle.writePointer(value), value.class.type);
                } else if (value instanceof String || value instanceof Array) {
                    return new Reference<T>(handle.writePointer(value), value.object.class.type);
                } else if (value instanceof NativePointer) {
                    switch (type?.typeEnum) {
                        case Type.Enum.UnsignedNativeInteger:
                        case Type.Enum.NativeInteger:
                            return new Reference<T>(handle.writePointer(value), type);
                    }
                } else if (value instanceof Int64) {
                    return new Reference<T>(handle.writeS64(value), corlib.class("System.Int64").type);
                } else if (value instanceof UInt64) {
                    return new Reference<T>(handle.writeU64(value), corlib.class("System.UInt64").type);
                }
            default:
                raise(`couldn't create a reference to ${value} using an unhandled type ${type?.name}`);
        }
    }
}
