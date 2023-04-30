namespace Il2Cpp {
    export class MemorySnapshot extends NativeStruct {
        /** Captures a memory snapshot. */
        static capture(): MemorySnapshot {
            return new MemorySnapshot();
        }

        /** Creates a memory snapshot with the given handle. */
        constructor(handle: NativePointer = api.memorySnapshotCapture()) {
            super(handle);
        }

        /** Gets any initialized class. */
        @lazy
        get classes(): Class[] {
            return readNativeIterator(_ => api.memorySnapshotGetClasses(this, _)).map(_ => new Class(_));
        }

        /** Gets the objects tracked by this memory snapshot. */
        @lazy
        get objects(): Object[] {
            // prettier-ignore
            return readNativeList(_ => api.memorySnapshotGetObjects(this, _)).filter(_ => !_.isNull()).map(_ => new Object(_));
        }

        /** Frees this memory snapshot. */
        free(): void {
            api.memorySnapshotFree(this);
        }
    }

    /** */
    export function memorySnapshot<T>(block: (memorySnapshot: Omit<MemorySnapshot, "free">) => T): T {
        const memorySnapshot = MemorySnapshot.capture();
        const result = block(memorySnapshot);
        memorySnapshot.free();
        return result;
    }
}
