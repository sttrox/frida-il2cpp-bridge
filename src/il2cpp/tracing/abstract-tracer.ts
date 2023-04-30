namespace Il2Cpp {
    export abstract class AbstractTracer {
        /** @internal */
        readonly targets: Method[] = [];

        /** @internal */
        #assemblies?: Assembly[];

        /** @internal */
        #classes?: Class[];

        /** @internal */
        #methods?: Method[];

        /** @internal */
        #assemblyFilter?: (assembly: Assembly) => boolean;

        /** @internal */
        #classFilter?: (klass: Class) => boolean;

        /** @internal */
        #methodFilter?: (method: Method) => boolean;

        /** @internal */
        #parameterFilter?: (parameter: Parameter) => boolean;

        /** Sets the application domain as the place where to find the target methods. */
        domain(): AbstractTracer.FilterAssemblies {
            return this;
        }

        /** Sets the passed `assemblies` as the place where to find the target methods. */
        assemblies(...assemblies: Assembly[]): AbstractTracer.FilterClasses {
            this.#assemblies = assemblies;
            return this;
        }

        /** Sets the passed `classes` as the place where to find the target methods. */
        classes(...classes: Class[]): AbstractTracer.FilterMethods {
            this.#classes = classes;
            return this;
        }

        /** Sets the passed `methods` as the target methods. */
        methods(...methods: Method[]): AbstractTracer.FilterParameters {
            this.#methods = methods;
            return this;
        }

        /** Filters the assemblies where to find the target methods. */
        filterAssemblies(filter: (assembly: Assembly) => boolean): AbstractTracer.FilterClasses {
            this.#assemblyFilter = filter;
            return this;
        }

        /** Filters the classes where to find the target methods. */
        filterClasses(filter: (klass: Class) => boolean): AbstractTracer.FilterMethods {
            this.#classFilter = filter;
            return this;
        }

        /** Filters the target methods. */
        filterMethods(filter: (method: Method) => boolean): AbstractTracer.FilterParameters {
            this.#methodFilter = filter;
            return this;
        }

        /** Filters the target methods. */
        filterParameters(filter: (parameter: Parameter) => boolean): Pick<AbstractTracer, "and"> {
            this.#parameterFilter = filter;
            return this;
        }

        /** Commits the current changes by finding the target methods. */
        and(): AbstractTracer.ChooseTargets & Pick<AbstractTracer, "attach"> {
            const filterMethod = (method: Method): void => {
                if (this.#parameterFilter == undefined) {
                    this.targets.push(method);
                    return;
                }

                for (const parameter of method.parameters) {
                    if (this.#parameterFilter(parameter)) {
                        this.targets.push(method);
                        break;
                    }
                }
            };

            const filterMethods = (values: Iterable<Method>): void => {
                for (const method of values) {
                    filterMethod(method);
                }
            };

            const filterClass = (klass: Class): void => {
                if (this.#methodFilter == undefined) {
                    filterMethods(klass.methods);
                    return;
                }

                for (const method of klass.methods) {
                    if (this.#methodFilter(method)) {
                        filterMethod(method);
                    }
                }
            };

            const filterClasses = (values: Iterable<Class>): void => {
                for (const klass of values) {
                    filterClass(klass);
                }
            };

            const filterAssembly = (assembly: Assembly): void => {
                if (this.#classFilter == undefined) {
                    filterClasses(assembly.image.classes);
                    return;
                }

                for (const klass of assembly.image.classes) {
                    if (this.#classFilter(klass)) {
                        filterClass(klass);
                    }
                }
            };

            const filterAssemblies = (assemblies: Iterable<Assembly>): void => {
                for (const assembly of assemblies) {
                    filterAssembly(assembly);
                }
            };

            const filterDomain = (domain: Domain): void => {
                if (this.#assemblyFilter == undefined) {
                    filterAssemblies(domain.assemblies);
                    return;
                }

                for (const assembly of domain.assemblies) {
                    if (this.#assemblyFilter(assembly)) {
                        filterAssembly(assembly);
                    }
                }
            };

            this.#methods
                ? filterMethods(this.#methods)
                : this.#classes
                ? filterClasses(this.#classes)
                : this.#assemblies
                ? filterAssemblies(this.#assemblies)
                : filterDomain(domain);

            this.#assemblies = undefined;
            this.#classes = undefined;
            this.#methods = undefined;
            this.#assemblyFilter = undefined;
            this.#classFilter = undefined;
            this.#methodFilter = undefined;
            this.#parameterFilter = undefined;

            return this;
        }

        /** Starts tracing. */
        abstract attach(): void;
    }

    export declare namespace AbstractTracer {
        export type ChooseTargets = Pick<AbstractTracer, "domain" | "assemblies" | "classes" | "methods">;

        export type FilterAssemblies = FilterClasses & Pick<AbstractTracer, "filterAssemblies">;

        export type FilterClasses = FilterMethods & Pick<AbstractTracer, "filterClasses">;

        export type FilterMethods = FilterParameters & Pick<AbstractTracer, "filterMethods">;

        export type FilterParameters = Pick<AbstractTracer, "and"> & Pick<AbstractTracer, "filterParameters">;
    }
}
