namespace Il2Cpp {
    /** Allocates the given amount of bytes. */
    export function alloc(size: number | UInt64 = Process.pointerSize): NativePointer {
        return api.alloc(size);
    }

    /** Frees memory. */
    export function free(pointer: NativePointerValue): void {
        return api.free(pointer);
    }

    /** @internal */
    export function read(pointer: NativePointer, type: Type): Field.Type {
        switch (type.typeEnum) {
            case Type.Enum.Boolean:
                return !!pointer.readS8();
            case Type.Enum.I1:
                return pointer.readS8();
            case Type.Enum.U1:
                return pointer.readU8();
            case Type.Enum.I2:
                return pointer.readS16();
            case Type.Enum.U2:
                return pointer.readU16();
            case Type.Enum.I4:
                return pointer.readS32();
            case Type.Enum.U4:
                return pointer.readU32();
            case Type.Enum.Char:
                return pointer.readU16();
            case Type.Enum.I8:
                return pointer.readS64();
            case Type.Enum.U8:
                return pointer.readU64();
            case Type.Enum.R4:
                return pointer.readFloat();
            case Type.Enum.R8:
                return pointer.readDouble();
            case Type.Enum.NativeInteger:
            case Type.Enum.UnsignedNativeInteger:
                return pointer.readPointer();
            case Type.Enum.Pointer:
                return new Pointer(pointer.readPointer(), type.class.baseType!);
            case Type.Enum.ValueType:
                return new ValueType(pointer, type);
            case Type.Enum.Object:
            case Type.Enum.Class:
                return new Object(pointer.readPointer());
            case Type.Enum.GenericInstance:
                return type.class.isValueType ? new ValueType(pointer, type) : new Object(pointer.readPointer());
            case Type.Enum.String:
                return new String(pointer.readPointer());
            case Type.Enum.SingleDimensionalZeroLowerBoundArray:
            case Type.Enum.Array:
                return new Array(pointer.readPointer());
        }

        raise(`couldn't read the value from ${pointer} using an unhandled or unknown type ${type.name} (${type.typeEnum}), please file an issue`);
    }

    /** @internal */
    export function write(pointer: NativePointer, value: any, type: Type): NativePointer {
        switch (type.typeEnum) {
            case Type.Enum.Boolean:
                return pointer.writeS8(+value);
            case Type.Enum.I1:
                return pointer.writeS8(value);
            case Type.Enum.U1:
                return pointer.writeU8(value);
            case Type.Enum.I2:
                return pointer.writeS16(value);
            case Type.Enum.U2:
                return pointer.writeU16(value);
            case Type.Enum.I4:
                return pointer.writeS32(value);
            case Type.Enum.U4:
                return pointer.writeU32(value);
            case Type.Enum.Char:
                return pointer.writeU16(value);
            case Type.Enum.I8:
                return pointer.writeS64(value);
            case Type.Enum.U8:
                return pointer.writeU64(value);
            case Type.Enum.R4:
                return pointer.writeFloat(value);
            case Type.Enum.R8:
                return pointer.writeDouble(value);
            case Type.Enum.NativeInteger:
            case Type.Enum.UnsignedNativeInteger:
            case Type.Enum.Pointer:
            case Type.Enum.ValueType:
            case Type.Enum.String:
            case Type.Enum.Object:
            case Type.Enum.Class:
            case Type.Enum.SingleDimensionalZeroLowerBoundArray:
            case Type.Enum.Array:
            case Type.Enum.GenericInstance:
                if (value instanceof ValueType) {
                    Memory.copy(pointer, value, type.class.valueSize);
                    return pointer;
                }

                return pointer.writePointer(value);
        }

        raise(`couldn't write value ${value} to ${pointer} using an unhandled or unknown type ${type.name} (${type.typeEnum}), please file an issue`);
    }

    /** @internal */
    export function fromFridaValue(value: NativeFunctionReturnValue, type: Type): Parameter.Type | Method.ReturnType {
        if (globalThis.Array.isArray(value)) {
            return arrayToValueType(type, value);
        } else if (value instanceof NativePointer) {
            if (type.isByReference) {
                return new Reference(value, type);
            }

            switch (type.typeEnum) {
                case Type.Enum.Pointer:
                    return new Pointer(value, type.class.baseType!);
                case Type.Enum.String:
                    return new String(value);
                case Type.Enum.Class:
                case Type.Enum.GenericInstance:
                case Type.Enum.Object:
                    return new Object(value);
                case Type.Enum.SingleDimensionalZeroLowerBoundArray:
                case Type.Enum.Array:
                    return new Array(value);
                default:
                    return value;
            }
        } else if (type.typeEnum == Type.Enum.Boolean) {
            return !!(value as number);
        } else {
            return value;
        }
    }

    /** @internal */
    export function toFridaValue(value: Parameter.Type): NativeFunctionArgumentValue {
        if (typeof value == "boolean") {
            return +value;
        } else if (value instanceof ValueType) {
            return valueTypeToArray(value);
        } else {
            return value;
        }
    }

    /** @internal */
    function valueTypeToArray(value: ValueType): NativeFunctionArgumentValue[] {
        const instanceFields = value.type.class.fields.filter(_ => !_.isStatic);

        return instanceFields.length == 0
            ? [value.handle.readU8()]
            : instanceFields
                  .map(_ => _.withHolder(value).value)
                  .map(value =>
                      value instanceof ValueType
                          ? valueTypeToArray(value)
                          : value instanceof NativeStruct
                          ? value.handle
                          : typeof value == "boolean"
                          ? +value
                          : value
                  );
    }

    /** @internal */
    function arrayToValueType(type: Type, nativeValues: any[]): ValueType {
        function iter(type: Type, startOffset: number = 0): [Type.Enum, number][] {
            const arr: [Type.Enum, number][] = [];

            for (const field of type.class.fields) {
                if (!field.isStatic) {
                    const offset = startOffset + field.offset - Object.headerSize;
                    if (field.type.typeEnum == Type.Enum.ValueType || (field.type.typeEnum == Type.Enum.GenericInstance && field.type.class.isValueType)) {
                        arr.push(...iter(field.type, offset));
                    } else {
                        arr.push([field.type.typeEnum, offset]);
                    }
                }
            }

            if (arr.length == 0) {
                arr.push([Type.Enum.U1, 0]);
            }

            return arr;
        }

        const valueType = Memory.alloc(type.class.valueSize);

        nativeValues = nativeValues.flat(Infinity);
        const typesAndOffsets = iter(type);

        for (let i = 0; i < nativeValues.length; i++) {
            const value = nativeValues[i];
            const [typeEnum, offset] = typesAndOffsets[i];
            const pointer = valueType.add(offset);

            switch (typeEnum) {
                case Type.Enum.Boolean:
                    pointer.writeS8(value);
                    break;
                case Type.Enum.I1:
                    pointer.writeS8(value);
                    break;
                case Type.Enum.U1:
                    pointer.writeU8(value);
                    break;
                case Type.Enum.I2:
                    pointer.writeS16(value);
                    break;
                case Type.Enum.U2:
                    pointer.writeU16(value);
                    break;
                case Type.Enum.I4:
                    pointer.writeS32(value);
                    break;
                case Type.Enum.U4:
                    pointer.writeU32(value);
                    break;
                case Type.Enum.Char:
                    pointer.writeU16(value);
                    break;
                case Type.Enum.I8:
                    pointer.writeS64(value);
                    break;
                case Type.Enum.U8:
                    pointer.writeU64(value);
                    break;
                case Type.Enum.R4:
                    pointer.writeFloat(value);
                    break;
                case Type.Enum.R8:
                    pointer.writeDouble(value);
                    break;
                case Type.Enum.NativeInteger:
                case Type.Enum.UnsignedNativeInteger:
                case Type.Enum.Pointer:
                case Type.Enum.SingleDimensionalZeroLowerBoundArray:
                case Type.Enum.Array:
                case Type.Enum.String:
                case Type.Enum.Object:
                case Type.Enum.Class:
                case Type.Enum.GenericInstance:
                    pointer.writePointer(value);
                    break;
                default:
                    warn(`arrayToValueType: defaulting ${typeEnum} to pointer`);
                    pointer.writePointer(value);
                    break;
            }
        }

        return new ValueType(valueType, type);
    }
}
