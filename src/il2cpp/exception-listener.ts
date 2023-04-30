namespace Il2Cpp {
    /** */
    export function installExceptionListener(targetThread: "current" | "all" = "current"): InvocationListener {
        const currentThread = api.threadCurrent();

        return Interceptor.attach(module.getExportByName("__cxa_throw"), function (args) {
            if (targetThread == "current" && !api.threadCurrent().equals(currentThread)) {
                return;
            }

            inform(new Object(args[0].readPointer()));
        });
    }
}
