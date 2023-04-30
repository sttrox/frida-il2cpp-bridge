namespace Il2Cpp {
    @recycle
    export class Assembly extends NativeStruct {
        /** Gets the image of this assembly. */
        @lazy
        get image(): Image {
            return new Image(api.assemblyGetImage(this));
        }

        /** Gets the name of this assembly. */
        @lazy
        get name(): string {
            return this.image.name.replace(".dll", "");
        }

        /** Gets the encompassing object of the current assembly. */
        @lazy
        get object(): Object {
            return corlib.class("System.Reflection.Assembly").method<Object>("Load").invoke(string(this.name));
        }
    }
}
