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

export class Capturer {
    isBody = false;
    classMap: Map<string, string> = new Map<string, string>();
    classCount = 0;
    pseudoStyles: Array<string> = [];
    pseudoClassCount = 0;
    shouldHandleImgDataUrl = true;
    canvas: HTMLCanvasElement | null = null;
    ctx: CanvasRenderingContext2D | null = null;
    doc: HTMLDocument = window.document;
    options: CaptureOptions = defaultOptions;

    getCanvasDataUrl(canvasElm: HTMLCanvasElement): string {
        let canvasDataUrl = '';
        try {
            canvasDataUrl = canvasElm.toDataURL(
                this.options.imageFormatForDataUrl,
                this.options.imageQualityForDataUrl,
            );
        } catch (ex) {
            logger.warn(`getCanvasDataUrl() - ${ex.message}`);
        }
        return canvasDataUrl;
    }
    getImgDataUrl(imgElm: HTMLImageElement): string {
        let imgDataUrl = '';
        try {
            if (!this.canvas) {
                this.canvas = this.doc.createElement('canvas');
                this.ctx = this.canvas.getContext('2d');
            }
            this.canvas.width = imgElm.clientWidth;
            this.canvas.height = imgElm.clientHeight;
            this.ctx && this.ctx.drawImage(imgElm, 0, 0);
            imgDataUrl = this.getCanvasDataUrl(this.canvas);
        } catch (ex) {
            logger.warn(`getImgDataUrl() - ${ex.message}`);
            this.shouldHandleImgDataUrl = false;
        }
        return imgDataUrl;
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

    private handleElmCss(domElm: Element, newElm: Element): void {
        if (Capturer.getClasses(newElm).length > 0) {
            newElm.setAttribute(this.options.attrKeyForSavingElementOrigClass, Capturer.getClassName(newElm));
            newElm.removeAttribute('class');
        }
        if (newElm.getAttribute('style')) {
            newElm.setAttribute(this.options.attrKeyForSavingElementOrigStyle, newElm.getAttribute('style') || '');
            newElm.removeAttribute('style');
        }
        const computedStyle = getComputedStyle(domElm);
        let classStr = '';

        for (let i = 0; i < computedStyle.length; i++) {
            const property = computedStyle.item(i);
            const value = computedStyle.getPropertyValue(property);
            const mapKey = property + ':' + value;
            let className: string = this.classMap.get(mapKey) || '';
            if (!className) {
                this.classCount++;
                className = `${this.options.prefixForNewGeneratedClasses}${this.classCount}`;
                this.classMap.set(mapKey, className);
            }
            classStr += className + ' ';
        }

        for (const pseudoType of ['::before', '::after']) {
            const computedStyle = getComputedStyle(domElm, pseudoType);
            if (!['none', 'normal'].includes(computedStyle.content)) {
                this.pseudoClassCount++;
                const className = `${this.options.prefixForNewGeneratedPseudoClasses}${this.pseudoClassCount}`;
                classStr += className + ' ';
                this.pseudoStyles.push(`.${className}${pseudoType}{`);
                for (let i = 0; i < computedStyle.length; i++) {
                    const property = computedStyle.item(i);
                    const value = computedStyle.getPropertyValue(property);
                    this.pseudoStyles.push(`${property}:${value};`);
                }
                this.pseudoStyles.push('}');
            }
        }

        if (classStr) {
            newElm.setAttribute('class', classStr.trim());
        }
    }

    private static handleInputs(domElm: Element, newElm: Element): void {
        if (!(domElm instanceof HTMLInputElement)) {
            return;
        }
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

    private appendNewStyle(newHtml: Element): void {
        const style = this.doc.createElement('style');
        let cssText = this.options.rulesToAddToDocStyle.join('');
        this.classMap.forEach((v, k) => {
            cssText += `.${v}{${k}}`;
        });
        cssText += cssText += this.pseudoStyles.join('');
        style.appendChild(this.doc.createTextNode(cssText));
        newHtml.children[0].appendChild(style);
    }

    private shouldIgnoreElm(domElm: Element): boolean {
        let shouldIgnoreElm = false;
        if (
            (!this.isBody && this.options.tagsOfIgnoredDocHeadElements.includes(domElm.tagName.toLowerCase())) ||
            (this.isBody && this.options.tagsOfIgnoredDocBodyElements.includes(domElm.tagName.toLowerCase()))
        ) {
            shouldIgnoreElm = true;
        }
        if (!shouldIgnoreElm) {
            for (let i = 0; i < domElm.attributes.length; i++) {
                if (domElm.attributes[i].specified) {
                    for (const [k, v] of Object.entries(this.options.attrKeyValuePairsOfIgnoredElements)) {
                        if (k === domElm.attributes[i].name && v === domElm.attributes[i].value) {
                            shouldIgnoreElm = true;
                            break;
                        }
                    }
                }
            }
        }
        if (!shouldIgnoreElm && this.isBody) {
            const domElmClasses = Capturer.getClasses(domElm);
            domElmClasses.forEach((c: string) => {
                if (this.options.classesOfIgnoredDocBodyElements.includes(c)) {
                    shouldIgnoreElm = true;
                }
            });
        }
        return shouldIgnoreElm;
    }

    private recursiveWalk(domElm: Element, newElm: Element, handleCss: boolean): void {
        if (this.shouldHandleImgDataUrl && this.isBody && domElm instanceof HTMLImageElement) {
            const imgDataUrl = this.getImgDataUrl(domElm);
            if (imgDataUrl) {
                newElm.setAttribute('src', imgDataUrl);
            }
        }
        if (this.isBody && domElm instanceof HTMLCanvasElement) {
            const canvasDataUrl = this.getCanvasDataUrl(domElm);
            if (canvasDataUrl) {
                newElm.setAttribute('src', canvasDataUrl);
            }
            newElm.outerHTML = newElm.outerHTML.replace(/<canvas/g, '<img');
        }
        if (this.isBody) {
            Capturer.handleInputs(domElm, newElm);
        }
        if (handleCss) {
            this.handleElmCss(domElm, newElm);
            if (this.options.tagsOfSkippedElementsForChildTreeCssHandling.includes(domElm.tagName.toLowerCase())) {
                handleCss = false;
            }
        }
        if (domElm.children) {
            for (let i = domElm.children.length - 1; i >= 0; i--) {
                const child = domElm.children[i];

                if (this.shouldIgnoreElm(child)) {
                    newElm.removeChild(newElm.children[i]);
                } else {
                    this.recursiveWalk(domElm.children[i], newElm.children[i], handleCss);
                }
            }
        }
    }

    private createNewHtml(): HTMLElement {
        const newHtml = this.doc.documentElement.cloneNode(false) as HTMLElement;
        this.handleElmCss(this.doc.documentElement, newHtml);
        return newHtml;
    }

    private appendNewHead(newHtml: HTMLElement): void {
        const newHead = this.doc.head.cloneNode(true) as HTMLElement;
        this.isBody = false;
        this.recursiveWalk(this.doc.head, newHead, false);
        newHtml.appendChild(newHead);
    }

    private appendNewBody(newHtml: HTMLElement): void {
        const newBody = this.doc.body.cloneNode(true) as HTMLElement;
        this.isBody = true;
        this.recursiveWalk(this.doc.body, newBody, true);
        newHtml.appendChild(newBody);
    }

    private getHtmlObject(): HTMLElement {
        const newHtml = this.createNewHtml();
        this.appendNewHead(newHtml);
        this.appendNewBody(newHtml);
        this.appendNewStyle(newHtml);
        return newHtml;
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

    capture(outputType: OutputType, htmlDocument: HTMLDocument, options: CaptureOptions): CapturerOutput {
        let output = null;
        const startTime = new Date().getTime();
        try {
            this.options = { ...defaultOptions, ...options };
            this.doc = htmlDocument || document;
            logger.setLogLevel(this.options.logLevel);
            logger.info(`capture() outputType: ${outputType} - start`);
            const newHtmlObject = this.getHtmlObject();
            output = Capturer.prepareOutput(newHtmlObject, outputType);
        } catch (ex) {
            logger.error(`capture() - error - ${ex.message}`);
        } finally {
            logger.info(`capture() - end - ${new Date().getTime() - startTime}ms`);
        }
        return output;
    }
}
