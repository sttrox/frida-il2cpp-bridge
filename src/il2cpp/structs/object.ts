namespace Il2Cpp {
    export class Object extends NativeStruct {
        /** Gets the Il2CppObject struct size, possibly equal to `Process.pointerSize * 2`. */
        @lazy
        static get headerSize(): number {
            return corlib.class("System.Object").instanceSize;
        }

        /** Gets the class of this object. */
        @lazy
        get class(): Class {
            return new Class(api.objectGetClass(this));
        }

        /** Gets the size of the current object. */
        @lazy
        get size(): number {
            return api.objectGetSize(this);
        }

        /** Acquires an exclusive lock on the current object. */
        enter(): void {
            return api.monitorEnter(this);
        }

        /** Release an exclusive lock on the current object. */
        exit(): void {
            return api.monitorExit(this);
        }

        /** Gets the field with the given name. */
        field<T extends Field.Type>(name: string): Field<T> {
            return this.class.field<T>(name).withHolder(this);
        }

        /** Gets the method with the given name. */
        method<T extends Method.ReturnType>(name: string, parameterCount: number = -1): Method<T> {
            return this.class.method<T>(name, parameterCount).withHolder(this);
        }

        /** Notifies a thread in the waiting queue of a change in the locked object's state. */
        pulse(): void {
            return api.monitorPulse(this);
        }

        /** Notifies all waiting threads of a change in the object's state. */
        pulseAll(): void {
            return api.monitorPulseAll(this);
        }

        /** Creates a reference to this object. */
        ref(pin: boolean): GCHandle {
            return new GCHandle(api.gcHandleNew(this, +pin));
        }

        /** Gets the correct virtual method from the given virtual method. */
        virtualMethod<T extends Method.ReturnType>(method: Method): Method<T> {
            return new Method<T>(api.objectGetVirtualMethod(this, method)).withHolder(this);
        }

        /** Attempts to acquire an exclusive lock on the current object. */
        tryEnter(timeout: number): boolean {
            return !!api.monitorTryEnter(this, timeout);
        }

        /** Gets the field with the given name. */
        tryField<T extends Field.Type>(name: string): Field<T> | undefined {
            return this.class.tryField<T>(name)?.withHolder(this);
        }

        /** Gets the field with the given name. */
        tryMethod<T extends Method.ReturnType>(name: string, parameterCount: number = -1): Method<T> | undefined {
            return this.class.tryMethod<T>(name, parameterCount)?.withHolder(this);
        }

        /** Releases the lock on an object and attempts to block the current thread until it reacquires the lock. */
        tryWait(timeout: number): boolean {
            return !!api.monitorTryWait(this, timeout);
        }

        /** */
        toString(): string {
            return this.isNull() ? "null" : this.method<String>("ToString").invoke().content ?? "null";
        }

        /** Unboxes the value type out of this object. */
        unbox(): ValueType {
            return new ValueType(api.objectUnbox(this), this.class.type);
        }

        /** Releases the lock on an object and blocks the current thread until it reacquires the lock. */
        wait(): void {
            return api.monitorWait(this);
        }

        /** Creates a weak reference to this object. */
        weakRef(trackResurrection: boolean): GCHandle {
            return new GCHandle(api.gcHandleNewWeakRef(this, +trackResurrection));
        }
    }
}
