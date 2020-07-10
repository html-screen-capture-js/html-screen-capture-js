import { LogLevel, OutputType, CaptureFunction } from './types';
import { logger } from './logger';
import { base64Encode, uriEncode } from './encoder';

interface CaptureContext {
    isBody: boolean;
    baseClass: Map<string, string>;
    classMap: Map<string, string>;
    classCount: number;
    pseudoStyles: Array<string>;
    pseudoClassCount: number;
    shouldHandleImgDataUrl: boolean;
    canvas: HTMLCanvasElement | null;
    doc: HTMLDocument;
    options: {
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
        logLevel: LogLevel;
    };
}

const getClassName = (domElm: Element): string => {
    const className: any = domElm.className;
    return (className instanceof SVGAnimatedString ? className.baseVal : className) || '';
};

const getClasses = (domElm: Element): string[] => {
    const className = getClassName(domElm);
    const classNames = className ? className.split(' ') : [];
    return classNames.reduce((result: string[], c: string) => {
        if (c) {
            result.push(c);
        }
        return result;
    }, [] as string[]);
};

const handleElmCss = (context: CaptureContext, domElm: Element, newElm: Element): void => {
    const handleOrigClassAndStyle = (): void => {
        if (getClasses(newElm).length > 0) {
            newElm.setAttribute(context.options.attrKeyForSavingElementOrigClass, getClassName(newElm));
            newElm.removeAttribute('class');
        }
        if (newElm.getAttribute('style')) {
            newElm.setAttribute(context.options.attrKeyForSavingElementOrigStyle, newElm.getAttribute('style') || '');
            newElm.removeAttribute('style');
        }
    };
    const handleRegularElmStyle = (): string => {
        let classStr = 'c0 ';
        const computedStyle = getComputedStyle(domElm);
        for (let i = 0; i < computedStyle.length; i++) {
            const property = computedStyle.item(i);
            const value = computedStyle.getPropertyValue(property);
            if (value !== context.baseClass.get(property)) {
                const mapKey = property + ':' + value;
                let className: string = context.classMap.get(mapKey) || '';
                if (!className) {
                    context.classCount++;
                    className = `${context.options.prefixForNewGeneratedClasses}${context.classCount}`;
                    context.classMap.set(mapKey, className);
                }
                classStr += className + ' ';
            }
        }
        return classStr;
    };
    const handlePseudoElmsStyle = (): string => {
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
};

const getCanvasDataUrl = (context: CaptureContext, domElm: HTMLImageElement | HTMLCanvasElement): string => {
    let canvasDataUrl = '';
    try {
        if (!context.canvas) {
            context.canvas = context.doc.createElement('canvas');
        }
        context.canvas.width = domElm instanceof HTMLImageElement ? domElm.naturalWidth : domElm.offsetWidth;
        context.canvas.height = domElm instanceof HTMLImageElement ? domElm.naturalHeight : domElm.offsetHeight;
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
};

const handleInputElement = (
    domElm: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    newElm: Element,
): void => {
    newElm.setAttribute('value', domElm.value);
    const domType = domElm.getAttribute('type');
    if (domElm instanceof HTMLInputElement && (domType === 'checkbox' || domType === 'radio')) {
        if (domElm.checked) {
            (newElm as HTMLInputElement).setAttribute('checked', 'checked');
        } else {
            newElm.removeAttribute('checked');
        }
    } else if (domElm instanceof HTMLTextAreaElement && domElm.value) {
        (newElm as HTMLInputElement).innerText = domElm.value;
    } else if (domElm instanceof HTMLSelectElement && domElm.value && domElm.children) {
        for (let i = domElm.children.length - 1; i >= 0; i--) {
            if (domElm.children[i].getAttribute('value') === domElm.value) {
                newElm.children[i].setAttribute('selected', '');
            } else {
                newElm.children[i].removeAttribute('selected');
            }
        }
    }
};

const handleImageElement = (context: CaptureContext, domElm: HTMLImageElement, newElm: Element): void => {
    if (context.shouldHandleImgDataUrl) {
        const imgDataUrl = getCanvasDataUrl(context, domElm);
        if (imgDataUrl) {
            newElm.setAttribute('src', imgDataUrl);
        }
    }
};

const handleCanvasElement = (context: CaptureContext, domElm: HTMLCanvasElement, newElm: Element): void => {
    const canvasDataUrl = getCanvasDataUrl(context, domElm);
    if (canvasDataUrl) {
        newElm.setAttribute('src', canvasDataUrl);
    }
    newElm.outerHTML = newElm.outerHTML.replace(/<canvas/g, '<img');
};

const shouldIgnoreElm = (context: CaptureContext, domElm: Element): boolean => {
    let shouldIgnore = false;
    if (
        (!context.isBody && context.options.tagsOfIgnoredDocHeadElements.includes(domElm.tagName.toLowerCase())) ||
        (context.isBody && context.options.tagsOfIgnoredDocBodyElements.includes(domElm.tagName.toLowerCase()))
    ) {
        shouldIgnore = true;
    }
    if (!shouldIgnore) {
        for (let i = 0; i < domElm.attributes.length; i++) {
            if (domElm.attributes[i].specified) {
                for (const [k, v] of Object.entries(context.options.attrKeyValuePairsOfIgnoredElements)) {
                    if (k === domElm.attributes[i].name && v === domElm.attributes[i].value) {
                        shouldIgnore = true;
                        break;
                    }
                }
            }
        }
    }
    if (!shouldIgnore && context.isBody) {
        const domElmClasses = getClasses(domElm);
        for (const c of domElmClasses) {
            if (context.options.classesOfIgnoredDocBodyElements.includes(c)) {
                shouldIgnore = true;
                break;
            }
        }
    }
    return shouldIgnore;
};

const recursiveWalk = (context: CaptureContext, domElm: Element, newElm: Element, handleCss: boolean): void => {
    if (context.isBody) {
        if (
            domElm instanceof HTMLInputElement ||
            domElm instanceof HTMLTextAreaElement ||
            domElm instanceof HTMLSelectElement
        ) {
            handleInputElement(domElm, newElm);
        } else if (domElm instanceof HTMLImageElement) {
            handleImageElement(context, domElm, newElm);
        } else if (domElm instanceof HTMLCanvasElement) {
            handleCanvasElement(context, domElm, newElm);
        }
    }
    if (handleCss) {
        handleElmCss(context, domElm, newElm);
        if (context.options.tagsOfSkippedElementsForChildTreeCssHandling.includes(domElm.tagName.toLowerCase())) {
            handleCss = false;
        }
    }
    if (domElm.children) {
        for (let i = domElm.children.length - 1; i >= 0; i--) {
            if (shouldIgnoreElm(context, domElm.children[i])) {
                newElm.removeChild(newElm.children[i]);
            } else {
                recursiveWalk(context, domElm.children[i], newElm.children[i], handleCss);
            }
        }
    }
};

const createBaseClass = (context: CaptureContext) => {
    const dummyElm = context.doc.createElement('div');
    dummyElm.style['display'] = 'none';
    context.doc.body.appendChild(dummyElm);
    const computedStyle = getComputedStyle(dummyElm);
    for (let i = 0; i < computedStyle.length; i++) {
        const property = computedStyle.item(i);
        const value = computedStyle.getPropertyValue(property);
        context.baseClass.set(property, value);
    }
    context.baseClass.set('display', 'block');
    if (dummyElm.parentNode) {
        dummyElm.parentNode.removeChild(dummyElm);
    }
};

const getHtmlObject = (context: CaptureContext): HTMLElement => {
    const createNewHtml = (): HTMLElement => {
        const newHtml = context.doc.documentElement.cloneNode(false) as HTMLElement;
        handleElmCss(context, context.doc.documentElement, newHtml);
        return newHtml;
    };
    const appendNewHead = (newHtml: HTMLElement): void => {
        const newHead = context.doc.head.cloneNode(true) as HTMLElement;
        context.isBody = false;
        recursiveWalk(context, context.doc.head, newHead, false);
        newHtml.appendChild(newHead);
    };
    const appendNewBody = (newHtml: HTMLElement): void => {
        createBaseClass(context);
        const newBody = context.doc.body.cloneNode(true) as HTMLElement;
        context.isBody = true;
        recursiveWalk(context, context.doc.body, newBody, true);
        newHtml.appendChild(newBody);
    };
    const appendNewStyle = (newHtml: Element): void => {
        const style = context.doc.createElement('style');
        let cssText = '.c0{';
        context.baseClass.forEach((v, k) => {
            cssText += `${k}:${v};`;
        });
        cssText += '}';
        context.classMap.forEach((v, k) => {
            cssText += `.${v}{${k}}`;
        });
        cssText += context.pseudoStyles.join('');
        cssText += context.options.rulesToAddToDocStyle.join('');
        style.appendChild(context.doc.createTextNode(cssText));
        newHtml.children[0].appendChild(style);
    };
    const newHtml = createNewHtml();
    appendNewHead(newHtml);
    appendNewBody(newHtml);
    appendNewStyle(newHtml);
    return newHtml;
};

const prepareOutput = (newHtmlObject: HTMLElement, outputType = OutputType.OBJECT): string | HTMLElement => {
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
};

export const goCapture: CaptureFunction = (outputType, htmlDocument, options) => {
    const startTime = new Date().getTime();
    let output = null;
    const context: CaptureContext = {
        isBody: false,
        baseClass: new Map<string, string>(),
        classMap: new Map<string, string>(),
        classCount: 0,
        pseudoStyles: [],
        pseudoClassCount: 0,
        shouldHandleImgDataUrl: true,
        canvas: null,
        doc: htmlDocument || document,
        options: {
            ...{
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
                logLevel: LogLevel.WARN,
            },
            ...options,
        },
    };
    try {
        logger.setLogLevel(context.options.logLevel);
        logger.info(`goCapture() outputType: ${outputType} - start`);
        const newHtmlObject = getHtmlObject(context);
        output = prepareOutput(newHtmlObject, outputType);
    } catch (ex) {
        logger.error(`goCapture() - error - ${ex.message}`);
    } finally {
        logger.info(`goCapture() - end - ${new Date().getTime() - startTime}ms`);
    }
    return output;
};
