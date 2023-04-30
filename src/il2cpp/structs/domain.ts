namespace Il2Cpp {
    @recycle
    export class Domain extends NativeStruct {
        /** Gets the assemblies that have been loaded into the execution context of the application domain. */
        @lazy
        get assemblies(): Assembly[] {
            let handles = readNativeList(_ => api.domainGetAssemblies(this, _));

            if (handles.length == 0) {
                const assemblyObjects = this.object.method<Array<Object>>("GetAssemblies").overload().invoke();
                handles = globalThis.Array.from(assemblyObjects).map(_ => _.field<NativePointer>("_mono_assembly").value);
            }

            return handles.map(_ => new Assembly(_));
        }

        /** Gets the encompassing object of the application domain. */
        @lazy
        get object(): Object {
            return new Object(api.domainGetObject());
        }

        /** Opens and loads the assembly with the given name. */
        assembly(name: string): Assembly {
            return this.tryAssembly(name) ?? raise(`couldn't find assembly ${name}`);
        }

        /** Attached a new thread to the application domain. */
        attach(): Thread {
            return new Thread(api.threadAttach(this));
        }

        /** Opens and loads the assembly with the given name. */
        tryAssembly(name: string): Assembly | null {
            return new Assembly(api.domainAssemblyOpen(this, Memory.allocUtf8String(name))).asNullable();
        }
    }

    /** Gets the application domain. */
    export declare const domain: Domain;
    // prettier-ignore
    getter(Il2Cpp, "domain", () => {
        return new Domain(api.domainGet());
    }, lazy);
}
