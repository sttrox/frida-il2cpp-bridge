namespace Il2Cpp {
    @recycle
    export class Class extends NativeStruct {
        /** Gets the actual size of the instance of the current class. */
        @lazy
        get actualInstanceSize(): number {
            return api.classGetActualInstanceSize(this);
        }

        /** Gets the array class which encompass the current class. */
        @lazy
        get arrayClass(): Class {
            return new Class(api.classGetArrayClass(this, 1));
        }

        /** Gets the size of the object encompassed by the current array class. */
        @lazy
        get arrayElementSize(): number {
            return api.classGetArrayElementSize(this);
        }

        /** Gets the name of the assembly in which the current class is defined. */
        @lazy
        get assemblyName(): string {
            return api.classGetAssemblyName(this).readUtf8String()!;
        }

        /** Gets the class that declares the current nested class. */
        @lazy
        get declaringClass(): Class | null {
            return new Class(api.classGetDeclaringType(this)).asNullable();
        }

        /** Gets the encompassed type of this array, reference, pointer or enum type. */
        @lazy
        get baseType(): Type | null {
            return new Type(api.classGetBaseType(this)).asNullable();
        }

        /** Gets the class of the object encompassed or referred to by the current array, pointer or reference class. */
        @lazy
        get elementClass(): Class | null {
            return new Class(api.classGetElementClass(this)).asNullable();
        }

        /** Gets the fields of the current class. */
        @lazy
        get fields(): Field[] {
            return readNativeIterator(_ => api.classGetFields(this, _)).map(_ => new Field(_));
        }

        /** Gets the flags of the current class. */
        @lazy
        get flags(): number {
            return api.classGetFlags(this);
        }

        /** Gets the full name (namespace + name) of the current class. */
        @lazy
        get fullName(): string {
            return this.namespace ? `${this.namespace}.${this.name}` : this.name;
        }

        /** Gets the amount of generic parameters of this generic class. */
        @lazy
        get genericParameterCount(): number {
            if (!this.isGeneric) {
                return 0;
            }

            return this.type.object.method<Array>("GetGenericArguments").invoke().length;
        }

        /** Determines whether the GC has tracking references to the current class instances. */
        @lazy
        get hasReferences(): boolean {
            return !!api.classHasReferences(this);
        }

        /** Determines whether ther current class has a valid static constructor. */
        @lazy
        get hasStaticConstructor(): boolean {
            const staticConstructor = this.tryMethod(".cctor");
            return staticConstructor != null && !staticConstructor.virtualAddress.isNull();
        }

        /** Gets the image in which the current class is defined. */
        @lazy
        get image(): Image {
            return new Image(api.classGetImage(this));
        }

        /** Gets the size of the instance of the current class. */
        @lazy
        get instanceSize(): number {
            return api.classGetInstanceSize(this);
        }

        /** Determines whether the current class is abstract. */
        @lazy
        get isAbstract(): boolean {
            return !!api.classIsAbstract(this);
        }

        /** Determines whether the current class is blittable. */
        @lazy
        get isBlittable(): boolean {
            return !!api.classIsBlittable(this);
        }

        /** Determines whether the current class is an enumeration. */
        @lazy
        get isEnum(): boolean {
            return !!api.classIsEnum(this);
        }

        /** Determines whether the current class is a generic one. */
        @lazy
        get isGeneric(): boolean {
            return !!api.classIsGeneric(this);
        }

        /** Determines whether the current class is inflated. */
        @lazy
        get isInflated(): boolean {
            return !!api.classIsInflated(this);
        }

        /** Determines whether the current class is an interface. */
        @lazy
        get isInterface(): boolean {
            return !!api.classIsInterface(this);
        }

        /** Determines whether the current class is a value type. */
        @lazy
        get isValueType(): boolean {
            return !!api.classIsValueType(this);
        }

        /** Gets the interfaces implemented or inherited by the current class. */
        @lazy
        get interfaces(): Class[] {
            return readNativeIterator(_ => api.classGetInterfaces(this, _)).map(_ => new Class(_));
        }

        /** Gets the methods implemented by the current class. */
        @lazy
        get methods(): Method[] {
            return readNativeIterator(_ => api.classGetMethods(this, _)).map(_ => new Method(_));
        }

        /** Gets the name of the current class. */
        @lazy
        get name(): string {
            return api.classGetName(this).readUtf8String()!;
        }

        /** Gets the namespace of the current class. */
        @lazy
        get namespace(): string {
            return api.classGetNamespace(this).readUtf8String()!;
        }

        /** Gets the classes nested inside the current class. */
        @lazy
        get nestedClasses(): Class[] {
            return readNativeIterator(_ => api.classGetNestedClasses(this, _)).map(_ => new Class(_));
        }

        /** Gets the class from which the current class directly inherits. */
        @lazy
        get parent(): Class | null {
            return new Class(api.classGetParent(this)).asNullable();
        }

        /** Gets the rank (number of dimensions) of the current array class. */
        @lazy
        get rank(): number {
            return api.classGetRank(this);
        }

        /** Gets a pointer to the static fields of the current class. */
        @lazy
        get staticFieldsData(): NativePointer {
            return api.classGetStaticFieldData(this);
        }

        /** Gets the size of the instance - as a value type - of the current class. */
        @lazy
        get valueSize(): number {
            return api.classGetValueSize(this, NULL);
        }

        /** Gets the type of the current class. */
        @lazy
        get type(): Type {
            return new Type(api.classGetType(this));
        }

        /** Allocates a new object of the current class. */
        alloc(): Object {
            return new Object(api.objectNew(this));
        }

        /** Gets the field identified by the given name. */
        field<T extends Field.Type>(name: string): Field<T> {
            return this.tryField<T>(name) ?? raise(`couldn't find field ${name} in class ${this.type.name}`);
        }

        /** Builds a generic instance of the current generic class. */
        inflate(...classes: Class[]): Class {
            if (!this.isGeneric) {
                raise(`cannot inflate class ${this.type.name} as it has no generic parameters`);
            }

            if (this.genericParameterCount != classes.length) {
                raise(`cannot inflate class ${this.type.name} as it needs ${this.genericParameterCount} generic parameter(s), not ${classes.length}`);
            }

            const types = classes.map(_ => _.type.object);
            const typeArray = array(corlib.class("System.Type"), types);

            const inflatedType = this.type.object.method<Object>("MakeGenericType", 1).invoke(typeArray);
            return new Class(api.classFromSystemType(inflatedType));
        }

        /** Calls the static constructor of the current class. */
        initialize(): void {
            api.classInit(this);
        }

        /** Determines whether an instance of `other` class can be assigned to a variable of the current type. */
        isAssignableFrom(other: Class): boolean {
            return !!api.classIsAssignableFrom(this, other);
        }

        /** Determines whether the current class derives from `other` class. */
        isSubclassOf(other: Class, checkInterfaces: boolean): boolean {
            return !!api.classIsSubclassOf(this, other, +checkInterfaces);
        }

        /** Gets the method identified by the given name and parameter count. */
        method<T extends Method.ReturnType>(name: string, parameterCount: number = -1): Method<T> {
            return this.tryMethod<T>(name, parameterCount) ?? raise(`couldn't find method ${name} in class ${this.type.name}`);
        }

        /** Gets the nested class with the given name. */
        nested(name: string): Class {
            return this.tryNested(name) ?? raise(`couldn't find nested class ${name} in class ${this.type.name}`);
        }

        /** Allocates a new object of the current class and calls its default constructor. */
        new(): Object {
            const object = this.alloc();

            const exceptionArray = Memory.alloc(Process.pointerSize);

            api.objectInit(object, exceptionArray);

            const exception = exceptionArray.readPointer();

            if (!exception.isNull()) {
                raise(new Object(exception).toString());
            }

            return object;
        }

        /** Gets the field with the given name. */
        tryField<T extends Field.Type>(name: string): Field<T> | null {
            return new Field<T>(api.classGetFieldFromName(this, Memory.allocUtf8String(name))).asNullable();
        }

        /** Gets the method with the given name and parameter count. */
        tryMethod<T extends Method.ReturnType>(name: string, parameterCount: number = -1): Method<T> | null {
            return new Method<T>(api.classGetMethodFromName(this, Memory.allocUtf8String(name), parameterCount)).asNullable();
        }

        /** Gets the nested class with the given name. */
        tryNested(name: string): Class | undefined {
            return this.nestedClasses.find(_ => _.name == name);
        }

        /** */
        toString(): string {
            const inherited = [this.parent].concat(this.interfaces);

            return `\
// ${this.assemblyName}
${this.isEnum ? `enum` : this.isValueType ? `struct` : this.isInterface ? `interface` : `class`} \
${this.type.name}\
${inherited ? ` : ${inherited.map(_ => _?.type.name).join(`, `)}` : ``}
{
    ${this.fields.join(`\n    `)}
    ${this.methods.join(`\n    `)}
}`;
        }

        /** Executes a callback for every defined class. */
        static enumerate(block: (klass: Class) => void): void {
            const callback = new NativeCallback(_ => block(new Class(_)), "void", ["pointer", "pointer"]);
            return api.classForEach(callback, NULL);
        }
    }
}
