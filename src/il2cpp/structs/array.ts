namespace Il2Cpp {
    export class Array<T extends Field.Type = Field.Type> extends NativeStruct implements Iterable<T> {
        /** Gets the Il2CppArray struct size, possibly equal to `Process.pointerSize * 4`. */
        @lazy
        static get headerSize(): number {
            return corlib.class("System.Array").instanceSize;
        }

        /** @internal Gets a pointer to the first element of the current array. */
        @lazy
        get elements(): Pointer<T> {
            return new Pointer(api.arrayGetElements(this), this.elementType);
        }

        /** Gets the size of the object encompassed by the current array. */
        @lazy
        get elementSize(): number {
            return this.elementType.class.arrayElementSize;
        }

        /** Gets the type of the object encompassed by the current array. */
        @lazy
        get elementType(): Type {
            return this.object.class.type.class.baseType!;
        }

        /** Gets the total number of elements in all the dimensions of the current array. */
        @lazy
        get length(): number {
            return api.arrayGetLength(this);
        }

        /** Gets the encompassing object of the current array. */
        @lazy
        get object(): Object {
            return new Object(this);
        }

        /** Gets the element at the specified index of the current array. */
        get(index: number): T {
            if (index < 0 || index >= this.length) {
                raise(`cannot get element at index ${index} as the array length is ${this.length}`);
            }

            return this.elements.get(index);
        }

        /** Sets the element at the specified index of the current array. */
        set(index: number, value: T) {
            if (index < 0 || index >= this.length) {
                raise(`cannot set element at index ${index} as the array length is ${this.length}`);
            }

            this.elements.set(index, value);
        }

        /** */
        toString(): string {
            return this.isNull() ? "null" : `[${this.elements.read(this.length, 0)}]`;
        }

        /** Iterable. */
        *[Symbol.iterator](): IterableIterator<T> {
            for (let i = 0; i < this.length; i++) {
                yield this.elements.get(i);
            }
        }
    }

    /** Creates a new empty array of the given length. */
    export function array<T extends Field.Type>(klass: Class, length: number): Array<T>;

    /** Creates a new array with the given elements. */
    export function array<T extends Field.Type>(klass: Class, elements: T[]): Array<T>;

    /** @internal */
    export function array<T extends Field.Type>(klass: Class, lengthOrElements: number | T[]): Array<T> {
        const length = typeof lengthOrElements == "number" ? lengthOrElements : lengthOrElements.length;
        const array = new Array<T>(api.arrayNew(klass, length));

        if (globalThis.Array.isArray(lengthOrElements)) {
            array.elements.write(lengthOrElements);
        }

        return array;
    }
}
