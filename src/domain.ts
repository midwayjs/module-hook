export type ISourceReplacer = (content: string) => string;
export type IReplaceSource = (filename: string, replacer: ISourceReplacer) => void;
export type ILoadModule = (filepath: string) => any;
export type IHookHandler = (loadModule: ILoadModule, replaceSource: IReplaceSource, version: string) => void;
export type IHook = (name: string, version: string, handler: IHookHandler) => void;