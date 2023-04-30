namespace Il2Cpp {
    @recycle
    export class Image extends NativeStruct {
        /** Gets the assembly in which the current image is defined. */
        @lazy
        get assembly(): Assembly {
            return new Assembly(api.imageGetAssembly(this));
        }

        /** Gets the amount of classes defined in this image. */
        @lazy
        get classCount(): number {
            return api.imageGetClassCount(this);
        }

        /** Gets the classes defined in this image. */
        @lazy
        get classes(): Class[] {
            if (unityVersionIsBelow201830) {
                const types = this.assembly.object.method<Array<Object>>("GetTypes").invoke(false);
                // In Unity 5.3.8f1, getting System.Reflection.Emit.OpCodes type name
                // without iterating all the classes first somehow blows things up at
                // app startup, hence the `Array.from`.
                return globalThis.Array.from(types).map(_ => new Class(api.classFromSystemType(_)));
            } else {
                return globalThis.Array.from(globalThis.Array(this.classCount), (_, i) => new Class(api.imageGetClass(this, i)));
            }
        }

        /** Gets the name of this image. */
        @lazy
        get name(): string {
            return api.imageGetName(this).readUtf8String()!;
        }

        /** Gets the class with the specified name defined in this image. */
        class(name: string): Class {
            return this.tryClass(name) ?? raise(`couldn't find class ${name} in assembly ${this.name}`);
        }

        /** Gets the class with the specified name defined in this image. */
        tryClass(name: string): Class | null {
            const dotIndex = name.lastIndexOf(".");
            const classNamespace = Memory.allocUtf8String(dotIndex == -1 ? "" : name.slice(0, dotIndex));
            const className = Memory.allocUtf8String(name.slice(dotIndex + 1));

            return new Class(api.classFromName(this, classNamespace, className)).asNullable();
        }
    }

    /** Gets the COR library. */
    export declare const corlib: Image;
    // prettier-ignore
    getter(Il2Cpp, "corlib", () => {
        return new Image(api.getCorlib());
    }, lazy);
}
