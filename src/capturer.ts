import { logger, LogLevels } from './logger';
import { base64Encode, uriEncode } from './encoder';

export enum OutputType {
    OBJECT = 'object',
    STRING = 'string',
    URI = 'uri',
    BASE64 = 'base64',
}
export interface CaptureOptions {
    rulesToAddToDocStyle: string[];
    tagsOfIgnoredDocHeadElements: string[];
    tagsOfIgnoredDocBodyElements: string[];
    classesOfIgnoredDocBodyElements: string[];
    attrKeyValuePairsOfIgnoredElements: {};
    tagsOfSkippedElementsForChildTreeCssHandling: string[];
    attrKeyForSavingElementOrigClass: string;
    attrKeyForSavingElementOrigStyle: string;
    prefixForNewGeneratedClasses: string;
    prefixForNewGeneratedPseudoClasses: string;
    imageFormatForDataUrl: string;
    imageQualityForDataUrl: number;
    logLevel: LogLevels;
}

export type CapturerOutput = string | HTMLElement | null;

const defaultOptions = {
    rulesToAddToDocStyle: [],
    tagsOfIgnoredDocHeadElements: ['script', 'link', 'style'],
    tagsOfIgnoredDocBodyElements: ['script'],
    classesOfIgnoredDocBodyElements: [],
    attrKeyValuePairsOfIgnoredElements: {},
    tagsOfSkippedElementsForChildTreeCssHandling: ['svg'],
    attrKeyForSavingElementOrigClass: '_class',
    attrKeyForSavingElementOrigStyle: '_style',
    prefixForNewGeneratedClasses: 'c',
    prefixForNewGeneratedPseudoClasses: 'p',
    imageFormatForDataUrl: 'image/png',
    imageQualityForDataUrl: 0.92,
    logLevel: LogLevels.WARN,
};

interface CapturerContext {
    isBody: boolean;
    classMap: Map<string, string>;
    classCount: number;
    pseudoStyles: Array<string>;
    pseudoClassCount: number;
    shouldHandleImgDataUrl: boolean;
    canvas: HTMLCanvasElement | null;
    doc: HTMLDocument;
    options: CaptureOptions;
}

export class Capturer {
    context: CapturerContext = {
        isBody: false,
        classMap: new Map<string, string>(),
        classCount: 0,
        pseudoStyles: [],
        pseudoClassCount: 0,
        shouldHandleImgDataUrl: true,
        canvas: null,
        doc: window.document,
        options: defaultOptions,
    };

    capture(outputType: OutputType, htmlDocument: HTMLDocument, options: CaptureOptions): CapturerOutput {
        const startTime = new Date().getTime();
        let output = null;
        const context = this.context;
        try {
            context.options = { ...defaultOptions, ...options };
            context.doc = htmlDocument || document;
            logger.setLogLevel(context.options.logLevel);
            logger.info(`capture() outputType: ${outputType} - start`);
            const newHtmlObject = Capturer.getHtmlObject(context);
            output = Capturer.prepareOutput(newHtmlObject, outputType);
        } catch (ex) {
            logger.error(`capture() - error - ${ex.message}`);
        } finally {
            logger.info(`capture() - end - ${new Date().getTime() - startTime}ms`);
        }
        return output;
    }

    private static getHtmlObject(context: CapturerContext): HTMLElement {
        const createNewHtml = (): HTMLElement => {
            const newHtml = context.doc.documentElement.cloneNode(false) as HTMLElement;
            Capturer.handleElmCss(context, context.doc.documentElement, newHtml);
            return newHtml;
        };
        const appendNewHead = (newHtml: HTMLElement): void => {
            const newHead = context.doc.head.cloneNode(true) as HTMLElement;
            context.isBody = false;
            Capturer.recursiveWalk(context, context.doc.head, newHead, false);
            newHtml.appendChild(newHead);
        };
        const appendNewBody = (newHtml: HTMLElement): void => {
            const newBody = context.doc.body.cloneNode(true) as HTMLElement;
            context.isBody = true;
            Capturer.recursiveWalk(context, context.doc.body, newBody, true);
            newHtml.appendChild(newBody);
        };
        const appendNewStyle = (newHtml: Element): void => {
            const style = context.doc.createElement('style');
            let cssText = context.options.rulesToAddToDocStyle.join('');
            context.classMap.forEach((v, k) => {
                cssText += `.${v}{${k}}`;
            });
            cssText += cssText += context.pseudoStyles.join('');
            style.appendChild(context.doc.createTextNode(cssText));
            newHtml.children[0].appendChild(style);
        };
        const newHtml = createNewHtml();
        appendNewHead(newHtml);
        appendNewBody(newHtml);
        appendNewStyle(newHtml);
        return newHtml;
    }

    private static recursiveWalk(context: CapturerContext, domElm: Element, newElm: Element, handleCss: boolean): void {
        if (context.isBody) {
            if (domElm instanceof HTMLInputElement) {
                Capturer.handleInputElement(domElm, newElm);
            } else if (domElm instanceof HTMLImageElement) {
                Capturer.handleImageElement(context, domElm, newElm);
            } else if (domElm instanceof HTMLCanvasElement) {
                Capturer.handleCanvasElement(context, domElm, newElm);
            }
        }
        if (handleCss) {
            Capturer.handleElmCss(context, domElm, newElm);
            if (context.options.tagsOfSkippedElementsForChildTreeCssHandling.includes(domElm.tagName.toLowerCase())) {
                handleCss = false;
            }
        }
        if (domElm.children) {
            for (let i = domElm.children.length - 1; i >= 0; i--) {
                if (Capturer.shouldIgnoreElm(context, domElm.children[i])) {
                    newElm.removeChild(newElm.children[i]);
                } else {
                    Capturer.recursiveWalk(context, domElm.children[i], newElm.children[i], handleCss);
                }
            }
        }
    }

    private static handleInputElement(domElm: HTMLInputElement, newElm: Element): void {
        const domType = domElm.getAttribute('type');
        if (domElm instanceof HTMLInputElement && domType === 'text' && domElm.value) {
            newElm.setAttribute('value', domElm.value);
        } else if (domElm instanceof HTMLTextAreaElement && domElm.value) {
            (newElm as HTMLInputElement).innerText = domElm.value;
        } else if (domElm instanceof HTMLInputElement && (domType === 'checkbox' || domType === 'radio')) {
            if (domElm.checked) {
                (newElm as HTMLInputElement).setAttribute('checked', 'checked');
            } else {
                newElm.removeAttribute('checked');
            }
        } else if (domElm instanceof HTMLSelectElement && domElm.value && domElm.children) {
            newElm.setAttribute('value', domElm.value);
            for (let i = domElm.children.length - 1; i >= 0; i--) {
                if (domElm.children[i].getAttribute('value') === domElm.value) {
                    newElm.children[i].setAttribute('selected', '');
                } else {
                    newElm.children[i].removeAttribute('selected');
                }
            }
        } else if (domElm.value) {
            newElm.setAttribute('value', domElm.value);
        }
    }

    private static handleImageElement = (context: CapturerContext, domElm: HTMLImageElement, newElm: Element) => {
        if (context.shouldHandleImgDataUrl) {
            const imgDataUrl = Capturer.getCanvasDataUrl(context, domElm);
            if (imgDataUrl) {
                newElm.setAttribute('src', imgDataUrl);
            }
        }
    };

    private static handleCanvasElement = (context: CapturerContext, domElm: HTMLCanvasElement, newElm: Element) => {
        const canvasDataUrl = Capturer.getCanvasDataUrl(context, domElm);
        if (canvasDataUrl) {
            newElm.setAttribute('src', canvasDataUrl);
        }
        newElm.outerHTML = newElm.outerHTML.replace(/<canvas/g, '<img');
    };

    private static getCanvasDataUrl(context: CapturerContext, domElm: HTMLImageElement | HTMLCanvasElement): string {
        let canvasDataUrl = '';
        try {
            if (!context.canvas) {
                context.canvas = context.doc.createElement('canvas');
            }
            context.canvas.width = domElm.clientWidth;
            context.canvas.height = domElm.clientHeight;
            const ctx = context.canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(domElm, 0, 0);
            }
            canvasDataUrl = context.canvas.toDataURL(
                context.options.imageFormatForDataUrl,
                context.options.imageQualityForDataUrl,
            );
        } catch (ex) {
            logger.warn(`getCanvasDataUrl() - ${ex.message}`);
        }
        return canvasDataUrl;
    }

    private static handleElmCss(context: CapturerContext, domElm: Element, newElm: Element): void {
        const handleOrigClassAndStyle = () => {
            if (Capturer.getClasses(newElm).length > 0) {
                newElm.setAttribute(context.options.attrKeyForSavingElementOrigClass, Capturer.getClassName(newElm));
                newElm.removeAttribute('class');
            }
            if (newElm.getAttribute('style')) {
                newElm.setAttribute(
                    context.options.attrKeyForSavingElementOrigStyle,
                    newElm.getAttribute('style') || '',
                );
                newElm.removeAttribute('style');
            }
        };
        const handleRegularElmStyle = () => {
            let classStr = '';
            const computedStyle = getComputedStyle(domElm);
            for (let i = 0; i < computedStyle.length; i++) {
                const property = computedStyle.item(i);
                const value = computedStyle.getPropertyValue(property);
                const mapKey = property + ':' + value;
                let className: string = context.classMap.get(mapKey) || '';
                if (!className) {
                    context.classCount++;
                    className = `${context.options.prefixForNewGeneratedClasses}${context.classCount}`;
                    context.classMap.set(mapKey, className);
                }
                classStr += className + ' ';
            }
            return classStr;
        };
        const handlePseudoElmsStyle = () => {
            let classStr = '';
            for (const pseudoType of ['::before', '::after']) {
                const computedStyle = getComputedStyle(domElm, pseudoType);
                if (!['none', 'normal'].includes(computedStyle.content)) {
                    context.pseudoClassCount++;
                    const className = `${context.options.prefixForNewGeneratedPseudoClasses}${context.pseudoClassCount}`;
                    classStr += className + ' ';
                    context.pseudoStyles.push(`.${className}${pseudoType}{`);
                    for (let i = 0; i < computedStyle.length; i++) {
                        const property = computedStyle.item(i);
                        const value = computedStyle.getPropertyValue(property);
                        context.pseudoStyles.push(`${property}:${value};`);
                    }
                    context.pseudoStyles.push('}');
                }
            }
            return classStr;
        };
        handleOrigClassAndStyle();
        let classStr = handleRegularElmStyle();
        classStr += handlePseudoElmsStyle();
        newElm.setAttribute('class', classStr.trim());
    }

    private static getClasses(domElm: Element): string[] {
        const className = Capturer.getClassName(domElm);
        const classNames = className ? className.split(' ') : [];
        return classNames.reduce((result: string[], c: string) => {
            if (c) {
                result.push(c);
            }
            return result;
        }, [] as string[]);
    }

    private static getClassName(domElm: Element): string {
        const className = domElm instanceof SVGAnimateElement ? domElm.className.baseVal : domElm.className;
        return className || '';
    }

    private static shouldIgnoreElm(context: CapturerContext, domElm: Element): boolean {
        if (
            (!context.isBody && context.options.tagsOfIgnoredDocHeadElements.includes(domElm.tagName.toLowerCase())) ||
            (context.isBody && context.options.tagsOfIgnoredDocBodyElements.includes(domElm.tagName.toLowerCase()))
        ) {
            return true;
        }
        for (let i = 0; i < domElm.attributes.length; i++) {
            if (domElm.attributes[i].specified) {
                for (const [k, v] of Object.entries(context.options.attrKeyValuePairsOfIgnoredElements)) {
                    if (k === domElm.attributes[i].name && v === domElm.attributes[i].value) {
                        return true;
                    }
                }
            }
        }
        if (context.isBody) {
            const domElmClasses = Capturer.getClasses(domElm);
            domElmClasses.forEach((c: string) => {
                if (context.options.classesOfIgnoredDocBodyElements.includes(c)) {
                    return true;
                }
            });
        }
        return false;
    }

    private static prepareOutput(newHtmlObject: HTMLElement, outputType = OutputType.OBJECT): string | HTMLElement {
        let output = null;
        if (outputType === OutputType.OBJECT) {
            output = newHtmlObject;
        } else {
            const outerHtml = (newHtmlObject ? newHtmlObject.outerHTML : '') || '';
            if (outerHtml) {
                if (outputType === OutputType.STRING) {
                    output = outerHtml;
                } else if (outputType === OutputType.URI) {
                    output = uriEncode(outerHtml);
                } else if (outputType === OutputType.BASE64) {
                    output = base64Encode(outerHtml);
                }
            }
            output = output || '';
        }
        if (logger.isDebug()) {
            logger.debug(`output: ${output instanceof HTMLElement ? output.outerHTML : output}`);
        }
        return output;
    }
}
