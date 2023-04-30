namespace Il2Cpp {
    /** Creates a filter which includes `element`s whose type can be assigned to `klass` variables. */
    export function is<T extends Class | Object | Type>(klass: Class): (element: T) => boolean {
        return (element: T): boolean => {
            if (element instanceof Class) {
                return klass.isAssignableFrom(element);
            } else {
                return klass.isAssignableFrom(element.class);
            }
        };
    }

    /** Creates a filter which includes `element`s whose type corresponds to `klass` type. */
    export function isExactly<T extends Class | Object | Type>(klass: Class): (element: T) => boolean {
        return (element: T): boolean => {
            if (element instanceof Class) {
                return element.equals(klass);
            } else {
                return element.class.equals(klass);
            }
        };
    }
}
