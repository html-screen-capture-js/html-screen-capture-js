export enum OutputType {
    OBJECT = 'object',
    STRING = 'string',
    URI = 'uri',
    BASE64 = 'base64',
}
export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    FATAL = 'fatal',
    OFF = 'off',
}
export interface Options {
    rulesToAddToDocStyle?: string[];
    tagsOfIgnoredDocHeadElements?: string[];
    tagsOfIgnoredDocBodyElements?: string[];
    classesOfIgnoredDocBodyElements?: string[];
    attrKeyValuePairsOfIgnoredElements?: {};
    tagsOfSkippedElementsForChildTreeCssHandling?: string[];
    attrKeyForSavingElementOrigClass?: string;
    attrKeyForSavingElementOrigStyle?: string;
    prefixForNewGeneratedClasses?: string;
    prefixForNewGeneratedPseudoClasses?: string;
    imageFormatForDataUrl?: string;
    imageQualityForDataUrl?: number;
    logLevel?: LogLevel;
}
export type CaptureOutput = HTMLElement | string | null;
export type CaptureFunction = (outputType?: OutputType, htmlDocument?: HTMLDocument, options?: Options) => CaptureOutput;
