namespace Il2Cpp {
    /** Creates a delegate object of the given delegate class. */
    export function delegate<P extends Parameter.Type[], R extends Method.ReturnType>(klass: Class, block: (...args: P) => R): Object {
        const SystemDelegate = corlib.class("System.Delegate");
        const SystemMulticastDelegate = corlib.class("System.MulticastDelegate");

        if (!SystemDelegate.isAssignableFrom(klass)) {
            raise(`cannot create a delegate for ${klass.type.name} as it's a non-delegate class`);
        }

        if (klass.equals(SystemDelegate) || klass.equals(SystemMulticastDelegate)) {
            raise(`cannot create a delegate for neither ${SystemDelegate.type.name} nor ${SystemMulticastDelegate.type.name}, use a subclass instead`);
        }

        const delegate = klass.alloc();
        const key = delegate.handle.toString();

        const Invoke = delegate.tryMethod("Invoke") ?? raise(`cannot create a delegate for ${klass.type.name}, there is no Invoke method`);
        delegate.method(".ctor").invoke(delegate, Invoke.handle);

        const callback = Invoke.wrap((...args: any[]): any => {
            delete _callbacksToKeepAlive[key];
            return block(...(args as any));
        });

        delegate.field("method_ptr").value = callback;
        delegate.field("invoke_impl").value = callback;
        _callbacksToKeepAlive[key] = callback;

        return delegate;
    }

    /** @internal Used to prevent eager garbage collection against NativeCallbacks. */
    export const _callbacksToKeepAlive: Record<string, NativeCallback<"void", []> | undefined> = {};
}
