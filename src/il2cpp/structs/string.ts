namespace Il2Cpp {
    export class String extends NativeStruct {
        /** Gets the content of this string. */
        get content(): string | null {
            return api.stringChars(this).readUtf16String(this.length);
        }

        /** Sets the content of this string. */
        set content(value: string | null) {
            api.stringChars(this).writeUtf16String(value ?? "");
            api.stringSetLength(this, value?.length ?? 0);
        }

        /** Gets the length of this string. */
        get length(): number {
            return api.stringLength(this);
        }

        /** Gets the encompassing object of the current string. */
        get object(): Object {
            return new Object(this);
        }

        /** */
        toString(): string {
            return this.isNull() ? "null" : `"${this.content}"`;
        }
    }

    /** Creates a new string with the specified content. */
    export function string(content: string | null): String {
        return new String(api.stringNew(Memory.allocUtf8String(content ?? "")));
    }
}
