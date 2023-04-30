namespace Il2Cpp {
    export class GCHandle {
        /** @internal */
        constructor(readonly handle: number) {}

        /** Gets the object associated to this handle. */
        get target(): Object | null {
            return new Object(api.gcHandleGetTarget(this.handle)).asNullable();
        }

        /** Frees this handle. */
        free(): void {
            return api.gcHandleFree(this.handle);
        }
    }
}
