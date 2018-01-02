export declare class ModuleHook {
    static instance: any;
    static getInstance(): ModuleHook;
    handlers: Map<any, any>;
    sourceReplacer: Map<any, any>;
    hooked: Set<any>;
    constructor();
    register(name: any, version: any, handler: any): void;
    private registerSourceReplacer(filepath, replacer);
    private findBasePath(name, filepath);
    private signature(name, version);
    doHook: (name: any, version: any, base: any) => any;
    hookRequire(): void;
}
