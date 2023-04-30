namespace Il2Cpp {
    /** Dumps the application. */
    export function dump(fileName?: string, path?: string): void {
        fileName = fileName ?? `${application.identifier ?? "unknown"}_${application.version ?? "unknown"}.cs`;

        const destination = `${path ?? application.dataPath}/${fileName}`;
        const file = new File(destination, "w");

        for (const assembly of domain.assemblies) {
            inform(`dumping ${assembly.name}...`);

            for (const klass of assembly.image.classes) {
                file.write(`${klass}\n\n`);
            }
        }

        file.flush();
        file.close();
        ok(`dump saved to ${destination}`);
    }
}
