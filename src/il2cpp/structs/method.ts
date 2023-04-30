namespace Il2Cpp {
    export class Method<T extends Method.ReturnType = Method.ReturnType> extends NativeStruct {
        /** Gets the class in which this method is defined. */
        @lazy
        get class(): Class {
            return new Class(api.methodGetClass(this));
        }

        /** Gets the flags of the current method. */
        @lazy
        get flags(): number {
            return api.methodGetFlags(this, NULL);
        }

        /** Gets the implementation flags of the current method. */
        @lazy
        get implementationFlags(): number {
            const implementationFlagsPointer = Memory.alloc(Process.pointerSize);
            api.methodGetFlags(this, implementationFlagsPointer);

            return implementationFlagsPointer.readU32();
        }

        /** */
        @lazy
        get fridaSignature(): NativeCallbackArgumentType[] {
            const types: NativeCallbackArgumentType[] = [];

            for (const parameter of this.parameters) {
                types.push(parameter.type.fridaAlias);
            }

            if (!this.isStatic || unityVersionIsBelow201830) {
                types.unshift("pointer");
            }

            if (this.isInflated) {
                types.push("pointer");
            }

            return types;
        }

        /** Gets the amount of generic parameters of this generic method. */
        @lazy
        get genericParameterCount(): number {
            if (!this.isGeneric) {
                return 0;
            }

            return this.object.method<Array>("GetGenericArguments").invoke().length;
        }

        /** Determines whether this method is external. */
        @lazy
        get isExternal(): boolean {
            return !!api.methodIsExternal(this);
        }

        /** Determines whether this method is generic. */
        @lazy
        get isGeneric(): boolean {
            return !!api.methodIsGeneric(this);
        }

        /** Determines whether this method is inflated (generic with a concrete type parameter). */
        @lazy
        get isInflated(): boolean {
            return !!api.methodIsInflated(this);
        }

        /** Determines whether this method is static. */
        @lazy
        get isStatic(): boolean {
            return !api.methodIsInstance(this);
        }

        /** Determines whether this method is synchronized. */
        @lazy
        get isSynchronized(): boolean {
            return !!api.methodIsSynchronized(this);
        }

        /** Gets the access modifier of this method. */
        @lazy
        get modifier(): string {
            return api.methodGetModifier(this).readUtf8String()!;
        }

        /** Gets the name of this method. */
        @lazy
        get name(): string {
            return api.methodGetName(this).readUtf8String()!;
        }

        /** @internal */
        @lazy
        get nativeFunction(): NativeFunction<any, any> {
            return new NativeFunction(this.virtualAddress, this.returnType.fridaAlias, this.fridaSignature as NativeFunctionArgumentType[]);
        }

        /** Gets the encompassing object of the current method. */
        @lazy
        get object(): Object {
            return new Object(api.methodGetObject(this, NULL));
        }

        /** Gets the amount of parameters of this method. */
        @lazy
        get parameterCount(): number {
            return api.methodGetParameterCount(this);
        }

        /** Gets the parameters of this method. */
        @lazy
        get parameters(): Parameter[] {
            return globalThis.Array.from(globalThis.Array(this.parameterCount), (_, i) => {
                const parameterName = api.methodGetParameterName(this, i).readUtf8String()!;
                const parameterType = api.methodGetParameterType(this, i);
                return new Parameter(parameterName, i, new Type(parameterType));
            });
        }

        /** Gets the relative virtual address (RVA) of this method. */
        @lazy
        get relativeVirtualAddress(): NativePointer {
            return this.virtualAddress.sub(module.base);
        }

        /** Gets the return type of this method. */
        @lazy
        get returnType(): Type {
            return new Type(api.methodGetReturnType(this));
        }

        /** Gets the virtual address (VA) to this method. */
        @lazy
        get virtualAddress(): NativePointer {
            return api.methodGetPointer(this);
        }

        /** Replaces the body of this method. */
        set implementation(block: (this: Class | Object, ...parameters: any[]) => T) {
            try {
                Interceptor.replace(this.virtualAddress, this.wrap(block));
            } catch (e: any) {
                switch (e.message) {
                    case "access violation accessing 0x0":
                        raise(`couldn't set implementation for method ${this.name} as it has a NULL virtual address`);
                    case `unable to intercept function at ${this.virtualAddress}; please file a bug`:
                        warn(`couldn't set implementation for method ${this.name} as it may be a thunk`);
                        break;
                    case "already replaced this function":
                        warn(`couldn't set implementation for method ${this.name} as it has already been replaced by a thunk`);
                        break;
                    default:
                        throw e;
                }
            }
        }

        /** Creates a generic instance of the current generic method. */
        inflate<R extends Method.ReturnType = T>(...classes: Class[]): Method<R> {
            if (!this.isGeneric) {
                raise(`cannot inflate method ${this.name} as it has no generic parameters`);
            }

            if (this.genericParameterCount != classes.length) {
                raise(`cannot inflate method ${this.name} as it needs ${this.genericParameterCount} generic parameter(s), not ${classes.length}`);
            }

            const types = classes.map(_ => _.type.object);
            const typeArray = array(corlib.class("System.Type"), types);

            const inflatedMethodObject = this.object.method<Object>("MakeGenericMethod", 1).invoke(typeArray);
            return new Method(api.methodGetFromReflection(inflatedMethodObject));
        }

        /** Invokes this method. */
        invoke(...parameters: Parameter.Type[]): T {
            if (!this.isStatic) {
                raise(`cannot invoke non-static method ${this.name} as it must be invoked throught a Object, not a Class`);
            }
            return this.invokeRaw(NULL, ...parameters);
        }

        /** @internal */
        invokeRaw(instance: NativePointerValue, ...parameters: Parameter.Type[]): T {
            const allocatedParameters = parameters.map(toFridaValue);

            if (!this.isStatic || unityVersionIsBelow201830) {
                allocatedParameters.unshift(instance);
            }

            if (this.isInflated) {
                allocatedParameters.push(this.handle);
            }

            try {
                const returnValue = this.nativeFunction(...allocatedParameters);
                return fromFridaValue(returnValue, this.returnType) as T;
            } catch (e: any) {
                if (e == null) {
                    raise("an unexpected native invocation exception occurred, this is due to parameter types mismatch");
                }

                switch (e.message) {
                    case "bad argument count":
                        raise(`couldn't invoke method ${this.name} as it needs ${this.parameterCount} parameter(s), not ${parameters.length}`);
                    case "expected a pointer":
                    case "expected number":
                    case "expected array with fields":
                        raise(`couldn't invoke method ${this.name} using incorrect parameter types`);
                }

                throw e;
            }
        }

        /** Gets the overloaded method with the given parameter types. */
        overload(...parameterTypes: string[]): Method<T> {
            const result = this.tryOverload<T>(...parameterTypes);

            if (result != undefined) return result;

            raise(`couldn't find overloaded method ${this.name}(${parameterTypes})`);
        }

        /** Gets the parameter with the given name. */
        parameter(name: string): Parameter {
            return this.tryParameter(name) ?? raise(`couldn't find parameter ${name} in method ${this.name}`);
        }

        /** Restore the original method implementation. */
        revert(): void {
            Interceptor.revert(this.virtualAddress);
            Interceptor.flush();
        }

        /** Gets the overloaded method with the given parameter types. */
        tryOverload<U extends Method.ReturnType = T>(...parameterTypes: string[]): Method<U> | undefined {
            return this.class.methods.find(method => {
                return (
                    method.name == this.name &&
                    method.parameterCount == parameterTypes.length &&
                    method.parameters.every((e, i) => e.type.name == parameterTypes[i])
                );
            }) as Method<U> | undefined;
        }

        /** Gets the parameter with the given name. */
        tryParameter(name: string): Parameter | undefined {
            return this.parameters.find(_ => _.name == name);
        }

        /** */
        toString(): string {
            return `\
${this.isStatic ? `static ` : ``}\
${this.returnType.name} \
${this.name}\
(${this.parameters.join(`, `)});\
${this.virtualAddress.isNull() ? `` : ` // 0x${this.relativeVirtualAddress.toString(16).padStart(8, `0`)}`}`;
        }

        /** @internal */
        withHolder(instance: Object): Method<T> {
            return new Proxy(this, {
                get(target: Method<T>, property: keyof Method<T>): any {
                    switch (property) {
                        case "invoke":
                            return target.invokeRaw.bind(target, instance.handle);
                        case "inflate":
                        case "overload":
                        case "tryOverload":
                            return function (...args: any[]) {
                                return target[property](...args)?.withHolder(instance);
                            };
                    }

                    return Reflect.get(target, property);
                }
            });
        }

        /** @internal */
        wrap(block: (this: Class | Object, ...parameters: any[]) => T): NativeCallback<any, any> {
            const startIndex = +!this.isStatic | +unityVersionIsBelow201830;
            // prettier-ignore
            return new NativeCallback((...args: any[]): any => {
                const thisObject = this.isStatic ? this.class : new Object(args[0]);
                const parameters = this.parameters.map((e, i) => fromFridaValue(args[i + startIndex], e.type));
                const result = block.call(thisObject, ...parameters) as any;
                return toFridaValue(result);
            }, this.returnType.fridaAlias, this.fridaSignature);
        }
    }

    export namespace Method {
        export type ReturnType = void | Field.Type;

        export const enum Attributes {
            MemberAccessMask = 0x0007,
            PrivateScope = 0x0000,
            Private = 0x0001,
            FamANDAssem = 0x0002,
            Assembly = 0x0003,
            Family = 0x0004,
            FamORAssem = 0x0005,
            Public = 0x0006,
            Static = 0x0010,
            Final = 0x0020,
            Virtual = 0x0040,
            HideBySig = 0x0080,
            CheckAccessOnOverride = 0x0200,
            VtableLayoutMask = 0x0100,
            ReuseSlot = 0x0000,
            NewSlot = 0x0100,
            Abstract = 0x0400,
            SpecialName = 0x0800,
            PinvokeImpl = 0x2000,
            UnmanagedExport = 0x0008,
            RTSpecialName = 0x1000,
            ReservedMask = 0xd000,
            HasSecurity = 0x4000,
            RequireSecObject = 0x8000
        }

        export const enum ImplementationAttribute {
            CodeTypeMask = 0x0003,
            IntermediateLanguage = 0x0000,
            Native = 0x0001,
            OptimizedIntermediateLanguage = 0x0002,
            Runtime = 0x0003,
            ManagedMask = 0x0004,
            Unmanaged = 0x0004,
            Managed = 0x0000,
            ForwardRef = 0x0010,
            PreserveSig = 0x0080,
            InternalCall = 0x1000,
            Synchronized = 0x0020,
            NoInlining = 0x0008,
            AggressiveInlining = 0x0100,
            NoOptimization = 0x0040,
            SecurityMitigations = 0x0400,
            MaxMethodImplVal = 0xffff
        }
    }
}
