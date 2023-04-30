namespace Il2Cpp {
    export class Type extends NativeStruct {
        /** Gets the class of this type. */
        @lazy
        get class(): Class {
            return new Class(api.classFromType(this));
        }

        /** */
        @lazy
        get fridaAlias(): NativeCallbackArgumentType {
            if (this.isByReference) {
                return "pointer";
            }

            switch (this.typeEnum) {
                case Type.Enum.Void:
                    return "void";
                case Type.Enum.Boolean:
                    return "bool";
                case Type.Enum.Char:
                    return "uchar";
                case Type.Enum.I1:
                    return "int8";
                case Type.Enum.U1:
                    return "uint8";
                case Type.Enum.I2:
                    return "int16";
                case Type.Enum.U2:
                    return "uint16";
                case Type.Enum.I4:
                    return "int32";
                case Type.Enum.U4:
                    return "uint32";
                case Type.Enum.I8:
                    return "int64";
                case Type.Enum.U8:
                    return "uint64";
                case Type.Enum.R4:
                    return "float";
                case Type.Enum.R8:
                    return "double";
                case Type.Enum.ValueType:
                    return getValueTypeFields(this);
                case Type.Enum.NativeInteger:
                case Type.Enum.UnsignedNativeInteger:
                case Type.Enum.Pointer:
                case Type.Enum.String:
                case Type.Enum.SingleDimensionalZeroLowerBoundArray:
                case Type.Enum.Array:
                    return "pointer";
                case Type.Enum.Class:
                case Type.Enum.Object:
                case Type.Enum.GenericInstance:
                    return this.class.isValueType ? getValueTypeFields(this) : "pointer";
                default:
                    return "pointer";
            }
        }

        /** Determines whether this type is passed by reference. */
        @lazy
        get isByReference(): boolean {
            return !!api.typeIsByReference(this);
        }

        /** Determines whether this type is primitive. */
        @lazy
        get isPrimitive(): boolean {
            return !!api.typeIsPrimitive(this);
        }

        /** Gets the name of this type. */
        @lazy
        get name(): string {
            const handle = api.typeGetName(this);

            try {
                return handle.readUtf8String()!;
            } finally {
                free(handle);
            }
        }

        /** Gets the encompassing object of the current type. */
        @lazy
        get object(): Object {
            return new Object(api.typeGetObject(this));
        }

        /** Gets the type enum of the current type. */
        @lazy
        get typeEnum(): Type.Enum {
            return api.typeGetTypeEnum(this);
        }

        /** */
        toString(): string {
            return this.name;
        }
    }

    function getValueTypeFields(type: Type): NativeCallbackArgumentType {
        const instanceFields = type.class.fields.filter(_ => !_.isStatic);
        return instanceFields.length == 0 ? ["char"] : instanceFields.map(_ => _.type.fridaAlias);
    }
}
