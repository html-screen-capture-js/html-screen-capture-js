import Logger from './logger';
import Encoder from './encoder';
import OutputTypeEnum from './output-type-enum';

export default class Capturer {
	constructor() {
		this._logger = new Logger();
		this._isBody = false;
		this._classMap = {};
		this._classCount = 0;
		this._shouldHandleImgDataUrl = true;
		this._canvas = null;
		this._ctx = null;
		this._doc = null;
		this._options = {};
	}
	_handleOptions(options) {
		this._options = {
			rulesToAddToDocStyle: (options && options.rulesToAddToDocStyle) || [],
			tagsOfIgnoredDocHeadElements: (options && options.tagsOfIgnoredDocHeadElements) || ['script', 'link', 'style'],
			tagsOfIgnoredDocBodyElements: (options && options.tagsOfIgnoredDocBodyElements) || ['script'],
			classesOfIgnoredDocBodyElements: (options && options.classesOfIgnoredDocBodyElements) || [],
			attrKeyValuePairsOfIgnoredElements: (options && options.attrKeyValuePairsOfIgnoredElements) || {},
			tagsOfSkippedElementsForChildTreeCssHandling: (options && options.tagsOfSkippedElementsForChildTreeCssHandling) || ['svg'],
			attrKeyForSavingElementOrigClass: (options && options.attrKeyForSavingElementOrigClass) || '_class',
			attrKeyForSavingElementOrigStyle: (options && options.attrKeyForSavingElementOrigStyle) || '_style',
			prefixForNewGeneratedClasses: (options && options.prefixForNewGeneratedClasses) || 'c',
			imageFormatForDataUrl: (options && options.imageFormatForDataUrl) || 'image/png',
			imageQualityForDataUrl: (options && options.imageQualityForDataUrl) || 0.92,
			logLevel: (options && options.logLevel) || 'warn'
		}
	}
	_getCanvasDataUrl(canvasElm) {
		let canvasDataUrl = '';
		try {
			canvasDataUrl = canvasElm.toDataURL(this._options.imageFormatForDataUrl, this._options.imageQualityForDataUrl);
		} catch(ex) {
			this._logger.warn(`getCanvasDataUrl() - ${ex.message}`);			
		}
		return canvasDataUrl;
	}
	_getImgDataUrl(imgElm) {
		let imgDataUrl = '';
		try {
			if (!this._canvas) {
				this._canvas = this._doc.createElement('canvas');
				this._ctx = this._canvas.getContext('2d');
			}
			this._canvas.width = imgElm.clientWidth;
			this._canvas.height = imgElm.clientHeight;
			this._ctx.drawImage(imgElm, 0, 0);
			imgDataUrl = this._getCanvasDataUrl(this._canvas);
		} catch(ex) {
			this._logger.warn(`getImgDataUrl() - ${ex.message}`);
			this._shouldHandleImgDataUrl = false;
		}
		return imgDataUrl;
	}	
	_getClasses(domElm) {
		const classes = [];
		const className = domElm.className instanceof SVGAnimatedString ? domElm.className.baseVal : domElm.className;
		if (className) {
			const classNames = className.split(' ');
			classNames.forEach(c => {
				if (c) {
					classes.push(c);
				}
			});
		}
		return classes;
	}
	static _getClassName(domElm) {
		const classes = domElm.className;
		return classes instanceof SVGAnimatedString ? classes.baseVal : classes;
	}
	_handleElmCss(domElm, newElm) {
		if (this._getClasses(newElm).length > 0) {
			newElm.setAttribute(this._options.attrKeyForSavingElementOrigClass, Capturer._getClassName(newElm));
			newElm.removeAttribute('class');
		}
		if (newElm.getAttribute('style')) {
			newElm.setAttribute(this._options.attrKeyForSavingElementOrigStyle, newElm.getAttribute('style'));
			newElm.removeAttribute('style');
		}
		const computedStyle = getComputedStyle(domElm);
		let classStr = '';
		for (let i = 0; i < computedStyle.length; i++) {
			const property = computedStyle.item(i);
			const value = computedStyle.getPropertyValue(property);
			const mapKey = property + ':' + value;
			let className = this._classMap[mapKey];
			if (!className) {
				this._classCount++;
				className = `${this._options.prefixForNewGeneratedClasses}${this._classCount}`;
				this._classMap[mapKey] = className;
			}
			classStr += (className + ' ');
		}
		if (classStr) {
			newElm.setAttribute('class', classStr.trim());
		}
	}
	static _handleInputs(domElm, newElm) {
		if (domElm.tagName === 'INPUT' && domElm.getAttribute('type') === 'text' && domElm.value) {
			newElm.setAttribute('value', domElm.value);
		} else if(domElm.tagName === 'TEXTAREA' && domElm.value) {
			newElm.innerText = domElm.value;
		} else if(domElm.tagName === 'INPUT' && domElm.getAttribute('type') === 'checkbox' && domElm.checked) {
			newElm.setAttribute('checked', 'checked');
		} else if (domElm.tagName === 'SELECT' && domElm.value && domElm.children) {
			newElm.setAttribute('value', domElm.value);
			for (let i = domElm.children.length - 1; i >= 0; i--) {
				if (domElm.children[i].getAttribute('value') === domElm.value) {
					newElm.children[i].setAttribute('selected', '');
				} else {
					newElm.children[i].removeAttribute('selected');
				}
			}
		} else if(domElm.value) {
			newElm.setAttribute('value', domElm.value);
		}
	}
	_appendNewStyle(newHtml) {
		const style = this._doc.createElement('style');
		let cssText = this._options.rulesToAddToDocStyle.join('');
		for (const [k, v] of Object.entries(this._classMap)) {
			cssText += `.${v}{${k}}`;
		}
		style.appendChild(this._doc.createTextNode(cssText));
		newHtml.children[0].appendChild(style);
	}
	_shouldIgnoreElm(domElm) {
		let shouldIgnoreElm = false;
		if (!this._isBody && this._options.tagsOfIgnoredDocHeadElements.includes(domElm.tagName.toLowerCase())
			|| this._isBody && this._options.tagsOfIgnoredDocBodyElements.includes(domElm.tagName.toLowerCase())) {
				shouldIgnoreElm = true;
		}
		if (!shouldIgnoreElm) {
			for (let i = 0; i < domElm.attributes.length; i++) {
				if (domElm.attributes[i].specified) {
					for (const [k, v] of Object.entries(this._options.attrKeyValuePairsOfIgnoredElements)) {
						if (k === domElm.attributes[i].name && v === domElm.attributes[i].value) {
							shouldIgnoreElm = true;
							break;
						}
					}
				}
			}
		}
		if (!shouldIgnoreElm && this._isBody) {
			const domElmClasses = this._getClasses(domElm);
			domElmClasses.forEach(c => {
				if (this._options.classesOfIgnoredDocBodyElements.includes(c)) {
					shouldIgnoreElm = true;
				}
			})
		}
		return shouldIgnoreElm;
	}
	_recursiveWalk(domElm, newElm, handleCss) {
		if (this._shouldHandleImgDataUrl && this._isBody && domElm.tagName === 'IMG') {
			const imgDataUrl = this._getImgDataUrl(domElm);
			if (imgDataUrl) {
				newElm.setAttribute('src', imgDataUrl);
			}
		}		
		if (this._isBody && domElm.tagName === 'CANVAS') {
			const canvasDataUrl = this._getCanvasDataUrl(domElm);
			if (canvasDataUrl) {
				newElm.setAttribute('src', canvasDataUrl);
			}
			newElm.outerHTML = newElm.outerHTML.replace(/<canvas/g, '<img');			
		}
		if (this._isBody) {
			Capturer._handleInputs(domElm, newElm);
		}
		if (handleCss) {
			this._handleElmCss(domElm, newElm);
			if (this._options.tagsOfSkippedElementsForChildTreeCssHandling.includes(domElm.tagName.toLowerCase())) {
				handleCss = false;
			}
		}
		if (domElm.children) {
			for (let i = domElm.children.length - 1; i >= 0; i--) {
				if (this._shouldIgnoreElm(domElm.children[i])) {
					newElm.removeChild(newElm.children[i]);
				} else {
					this._recursiveWalk(domElm.children[i], newElm.children[i], handleCss);
				}
			}
		}
	}
	_createNewHtml() {
		const newHtml = this._doc.documentElement.cloneNode(false);
		this._handleElmCss(this._doc.documentElement, newHtml);
		return newHtml;
	}
	_appendNewHead(newHtml) {
		const newHead = this._doc.head.cloneNode(true);
		this._isBody = false;
		this._recursiveWalk(this._doc.head, newHead, false);
		newHtml.appendChild(newHead);
	}
	_appendNewBody(newHtml) {
		const newBody = this._doc.body.cloneNode(true);
		this._isBody = true;
		this._recursiveWalk(this._doc.body, newBody, true);
		newHtml.appendChild(newBody);
	}
	_getHtmlObject() {
		const newHtml = this._createNewHtml();
		this._appendNewHead(newHtml);
		this._appendNewBody(newHtml);
		this._appendNewStyle(newHtml);
		return newHtml;
	}
	_prepareOutput(newHtmlObject, outputType) {
		let output = null;
		const outputTypeEnum = new OutputTypeEnum();
		const oType = (outputType || outputTypeEnum.OBJECT).toLowerCase();
		if (oType === outputTypeEnum.OBJECT) {
			output = newHtmlObject;
		} else {
			const outerHtml = (newHtmlObject ? (newHtmlObject.outerHTML) : '') || '';
			if (outerHtml) {
				if (oType === outputTypeEnum.STRING) {
					output = outerHtml;
				} else if (oType === outputTypeEnum.URI) {
					output = Encoder.uriEncode(outerHtml);
				} else if (oType === outputTypeEnum.BASE64) {
					output = Encoder.base64Encode(outerHtml);
				}
			}
			output = output || '';
		}
		if (this._logger.isDebug()) {
			this._logger.debug(`output: ${output.outerHTML ? output.outerHTML : output}`);
		}
		return output;
	}
	capture(outputType, htmlDocument, options) {
		let output = null;
		const startTime = (new Date()).getTime();
		try {
			this._handleOptions(options);
			this._doc = htmlDocument || document;
			this._logger.setLogLevel(this._options.logLevel);
			this._logger.info(`capture() outputType: ${outputType} - start`);
			const newHtmlObject = this._getHtmlObject();
			output = this._prepareOutput(newHtmlObject, outputType);
		} catch(ex) {
			this._logger.error(`capture() - error - ${ex.message}`);
		} finally {
			this._logger.info(`capture() - end - ${(new Date()).getTime() - startTime}ms`);
		}
		return output;
	}
}
