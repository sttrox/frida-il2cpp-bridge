namespace Il2Cpp {
    export const gc = {
        /** Gets the heap size in bytes. */
        get heapSize(): Int64 {
            return api.gcGetHeapSize();
        },

        /** Determines whether the garbage collector is disabled. */
        get isEnabled(): boolean {
            return !api.gcIsDisabled();
        },

        /** Determines whether the garbage collector is incremental. */
        get isIncremental(): boolean {
            return !!api.gcIsIncremental();
        },

        /** Gets the number of nanoseconds the garbage collector can spend in a collection step. */
        get maxTimeSlice(): Int64 {
            return api.gcGetMaxTimeSlice();
        },

        /** Gets the used heap size in bytes. */
        get usedHeapSize(): Int64 {
            return api.gcGetUsedSize();
        },

        /** Enables or disables the garbage collector. */
        set isEnabled(value: boolean) {
            value ? api.gcEnable() : api.gcDisable();
        },

        /** Sets the number of nanoseconds the garbage collector can spend in a collection step. */
        set maxTimeSlice(nanoseconds: number | Int64) {
            api.gcSetMaxTimeSlice(nanoseconds);
        },

        /** Returns the heap allocated objects of the specified class. This variant reads GC descriptors. */
        choose(klass: Class): Object[] {
            const matches: Object[] = [];

            const callback = (objects: NativePointer, size: number) => {
                for (let i = 0; i < size; i++) {
                    matches.push(new Object(objects.add(i * Process.pointerSize).readPointer()));
                }
            };

            const chooseCallback = new NativeCallback(callback, "void", ["pointer", "int", "pointer"]);

            if (UnityVersion.gte(unityVersion, "2021.2.0")) {
                const realloc = (handle: NativePointer, size: UInt64) => {
                    if (!handle.isNull() && size.compare(0) == 0) {
                        free(handle);
                        return NULL;
                    } else {
                        return alloc(size);
                    }
                };

                const reallocCallback = new NativeCallback(realloc, "pointer", ["pointer", "size_t", "pointer"]);

                this.stopWorld();

                const state = api.livenessAllocateStruct(klass, 0, chooseCallback, NULL, reallocCallback);
                api.livenessCalculationFromStatics(state);
                api.livenessFinalize(state);

                this.startWorld();

                api.livenessFreeStruct(state);
            } else {
                const onWorld = new NativeCallback(() => {}, "void", []);
                const state = api.livenessCalculationBegin(klass, 0, chooseCallback, NULL, onWorld, onWorld);

                api.livenessCalculationFromStatics(state);
                api.livenessCalculationEnd(state);
            }

            return matches;
        },

        /** Forces a garbage collection of the specified generation. */
        collect(generation: 0 | 1 | 2): void {
            api.gcCollect(generation < 0 ? 0 : generation > 2 ? 2 : generation);
        },

        /** Forces a garbage collection. */
        collectALittle(): void {
            api.gcCollectALittle();
        },

        /** Resumes all the previously stopped threads. */
        startWorld(): void {
            return api.gcStartWorld();
        },

        /** Performs an incremental garbage collection. */
        startIncrementalCollection(): void {
            return api.gcStartIncrementalCollection();
        },

        /** Stops all threads which may access the garbage collected heap, other than the caller. */
        stopWorld(): void {
            return api.gcStopWorld();
        }
    };
}
