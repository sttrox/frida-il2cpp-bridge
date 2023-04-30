namespace Il2Cpp {
    export class Thread extends NativeStruct {
        /** Gets the native id of the current thread. */
        @lazy
        get id(): number {
            const id = this.internal.field<UInt64>("thread_id").value.toNumber();
            return Process.platform == "windows" ? id : posixThreadGetKernelId(ptr(id));
        }

        /** Gets the encompassing internal object (System.Threding.InternalThreead) of the current thread. */
        @lazy
        get internal(): Object {
            return this.object.tryField<Object>("internal_thread")?.value ?? this.object;
        }

        /** Determines whether the current thread is the garbage collector finalizer one. */
        @lazy
        get isFinalizer(): boolean {
            return !api.threadIsVm(this);
        }

        /** Gets the managed id of the current thread. */
        @lazy
        get managedId(): number {
            return this.object.method<number>("get_ManagedThreadId").invoke();
        }

        /** Gets the encompassing object of the current thread. */
        @lazy
        get object(): Object {
            return new Object(this);
        }

        /** @internal */
        @lazy
        private get staticData(): NativePointer {
            return this.internal.field<NativePointer>("static_data").value;
        }

        /** @internal */
        @lazy
        private get synchronizationContext(): Object {
            const get_ExecutionContext = this.object.tryMethod<Object>("GetMutableExecutionContext") ?? this.object.method("get_ExecutionContext");
            const executionContext = get_ExecutionContext.invoke();

            let synchronizationContext =
                executionContext.tryField<Object>("_syncContext")?.value ??
                executionContext.tryMethod<Object>("get_SynchronizationContext")?.invoke() ??
                this.tryLocalValue(corlib.class("System.Threading.SynchronizationContext"));

            if (synchronizationContext == null || synchronizationContext.isNull()) {
                if (this.managedId == 1) {
                    raise(`couldn't find the synchronization context of the main thread, perhaps this is early instrumentation?`);
                } else {
                    raise(`couldn't find the synchronization context of thread #${this.managedId}, only the main thread is expected to have one`);
                }
            }

            return synchronizationContext;
        }

        /** Detaches the thread from the application domain. */
        detach(): void {
            return api.threadDetach(this);
        }

        /** Schedules a callback on the current thread. */
        schedule<T>(block: () => T | Promise<T>, delayMs: number = 0): Promise<T> {
            const Post = this.synchronizationContext.method("Post");

            return new Promise(resolve => {
                const object = delegate(corlib.class("System.Threading.SendOrPostCallback"), () => {
                    const result = block();
                    setImmediate(() => resolve(result));
                });

                if (delayMs > 0) {
                    setTimeout(() => Post.invoke(object, NULL), delayMs);
                } else {
                    Post.invoke(object, NULL);
                }
            });
        }

        /** @internal */
        tryLocalValue(klass: Class): Object | undefined {
            for (let i = 0; i < 16; i++) {
                const base = this.staticData.add(i * Process.pointerSize).readPointer();
                if (!base.isNull()) {
                    const object = new Object(base.readPointer()).asNullable();
                    if (object?.class?.isSubclassOf(klass, false)) {
                        return object;
                    }
                }
            }
        }
    }

    /** Gets the attached threads. */
    export declare const attachedThreads: Thread[];
    getter(Il2Cpp, "attachedThreads", () => {
        return readNativeList(api.threadGetAllAttachedThreads).map(_ => new Thread(_));
    });

    /** Gets the current attached thread, if any. */
    export declare const currentThread: Thread | null;
    getter(Il2Cpp, "currentThread", () => {
        return new Thread(api.threadCurrent()).asNullable();
    });

    /** Gets the current attached thread, if any. */
    export declare const mainThread: Thread;
    getter(Il2Cpp, "mainThread", () => {
        // I'm not sure if this is always the case. Alternatively, we could pick the thread
        // with the lowest managed id, but I'm not sure that always holds true, either.
        return attachedThreads[0];
    });

    /** @internal */
    let posixThreadKernelIdOffset = -1;

    /** @internal */
    function posixThreadGetKernelId(posixThread: NativePointer): number {
        if (posixThreadKernelIdOffset == -1) {
            const currentPosixThread = ptr(currentThread!.internal.field<UInt64>("thread_id").value.toNumber());
            const currentThreadId = Process.getCurrentThreadId();

            for (let i = 0; i < 1024; i++) {
                if (currentPosixThread.add(i).readS32() == currentThreadId) {
                    posixThreadKernelIdOffset = i;
                    break;
                }
            }

            if (posixThreadKernelIdOffset == -1) {
                raise(`couldn't find the offset for determining the kernel id of a posix thread`);
            }
        }

        return posixThread.add(posixThreadKernelIdOffset).readS32();
    }
}
