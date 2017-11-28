import Logger from './logger';
import Encoder from './encoder';
import OutputTypeEnum from './output-type-enum';

export default class Capturer {
	constructor() {
		this._logger = new Logger();
		this._isHead = true;
		this._classMap = {};
		this._classCount = 0;
		this._shouldHandleImgDataUrl = true;
		this._canvas = null;
		this._ctx = null;
		this._doc = null;
		this._options = {
			tagsOfIgnoredDocHeadElements: ['script', 'link', 'style'],
			tagsOfIgnoredDocBodyElements: ['script'],
			classesOfIgnoredDocBodyElements: [],
			attrKeyValuePairsOfIgnoredElements: {},
			tagsOfSkippedElementsForChildTreeCssHandling: ['svg'],
			attrKeyForSavingElementOrigClass: '_class',
			attrKeyForSavingElementOrigStyle: '_style',
			prefixForNewGeneratedClasses: 'c',
			imageFormatForDataUrl: 'image/png',
			imageQualityForDataUrl: 0.92,
			rulesToAddToDocStyle: ['*{font-family:"Arial Narrow" !important;}']
		};
	}
	_overrideOptions(options) {
		if (options) {
			for (let def in options) {
				if (options.hasOwnProperty(def)) {
					this._options[def] = options[def];
				}
			}
		}
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
			imgDataUrl = this._canvas.toDataURL(this._options.imageFormatForDataUrl, this._options.imageQualityForDataUrl);
		} catch(ex) {
			this._logger.warn(`getImgDataUrl() - ${ex.message}`);
			this._shouldHandleImgDataUrl = false;
		}
		return imgDataUrl;
	}
	_getClasses(domElm) {
		let classes = [];
		let className = domElm.className instanceof SVGAnimatedString ? domElm.className.baseVal : domElm.className;
		if (className) {
			let classNames = className.split(' ');
			classNames.forEach(c => {
				if (c) {
					classes.push(c);
				}
			});
		}
		return classes;
	}
	_getClassName(domElm) {
		let classes = domElm.className;
		return classes instanceof SVGAnimatedString ? classes.baseVal : classes;
	}
	_handleElmCss(domElm, newElm) {
		if (this._getClasses(newElm).length > 0) {
			if (this._options.attrKeyForSavingElementOrigClass) {
				newElm.setAttribute(this._options.attrKeyForSavingElementOrigClass, this._getClassName(newElm));
			}
			newElm.removeAttribute('class');
		}
		if (newElm.getAttribute('style')) {
			if (this._options.attrKeyForSavingElementOrigStyle) {
				newElm.setAttribute(this._options.attrKeyForSavingElementOrigStyle, newElm.getAttribute('style'));
			}
			newElm.removeAttribute('style');
		}
		let computedStyle = getComputedStyle(domElm);
		let classStr = '';
		for (let i = 0; i < computedStyle.length; i++) {
			let property = computedStyle.item(i);
			let value = computedStyle.getPropertyValue(property);
			let mapKey = property + ':' + value;
			let className = this._classMap[mapKey];
			if (!className) {
				this._classCount++;
				className = (this._options.prefixForNewGeneratedClasses ? this._options.prefixForNewGeneratedClasses : 'c') + this._classCount;
				this._classMap[mapKey] = className;
			}
			classStr += (className + ' ');
		}
		if (classStr) {
			newElm.setAttribute('class', classStr.trim());
		}
	}
	_appendNewStyle(newHtml) {
		let style = this._doc.createElement('style');
		style.type = 'text/css';
		let cssText = this._options.rulesToAddToDocStyle ? this._options.rulesToAddToDocStyle.join('') : '';
		for (let def in this._classMap) {
			if (this._classMap.hasOwnProperty(def)) {
				cssText += ('.' + this._classMap[def] + '{' + def + '}');
			}
		}
		if (style.styleSheet) {
			style.styleSheet.cssText = cssText;
		} else {
			style.appendChild(this._doc.createTextNode(cssText));
		}
		newHtml.children[0].appendChild(style);
	}
	_shouldIgnoreElm(domElm) {
		let shouldRemoveElm = false;
		if (this._isHead && this._options.tagsOfIgnoredDocHeadElements && this._options.tagsOfIgnoredDocHeadElements.indexOf(domElm.tagName.toLowerCase()) > -1 ||
		!this._isHead && this._options.tagsOfIgnoredDocBodyElements && this._options.tagsOfIgnoredDocBodyElements.indexOf(domElm.tagName.toLowerCase()) > -1) {
			shouldRemoveElm = true;
		}
		if (!shouldRemoveElm && this._options.attrKeyValuePairsOfIgnoredElements) {
			for (let attrKey in this._options.attrKeyValuePairsOfIgnoredElements) {
				if (this._options.attrKeyValuePairsOfIgnoredElements.hasOwnProperty(attrKey)) {
					for (let i = 0; i < domElm.attributes.length; i++) {
						if (domElm.attributes[i].specified && domElm.attributes[i].value === this._options.attrKeyValuePairsOfIgnoredElements[attrKey]) {
							shouldRemoveElm = true;
						}
					}
				}
			}
		}
		if (!shouldRemoveElm && !this._isHead && this._options.classesOfIgnoredDocBodyElements) {
			let domElmClasses = this._getClasses(domElm);
			domElmClasses.forEach(c => {
				if (!shouldRemoveElm && this._options.classesOfIgnoredDocBodyElements.indexOf(c) > -1) {
					shouldRemoveElm = true;
				}
			})
		}
		return shouldRemoveElm;
	}
	_recursiveWalk(domElm, newElm, handleCss) {
		if (this._shouldHandleImgDataUrl && !this._isHead && domElm.tagName.toLowerCase() === 'img') {
			let imgDataUrl = this._getImgDataUrl(domElm);
			if (imgDataUrl) {
				newElm.setAttribute('src', imgDataUrl);
			}
		}
		if (handleCss) {
			this._handleElmCss(domElm, newElm);
			if (this._options.tagsOfSkippedElementsForChildTreeCssHandling && this._options.tagsOfSkippedElementsForChildTreeCssHandling.indexOf(domElm.tagName.toLowerCase()) > -1) {
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
		let newHtml = this._doc.documentElement.cloneNode(false);
		this._handleElmCss(this._doc.documentElement, newHtml);
		return newHtml;
	}
	_appendNewHead(newHtml) {
		let newHead = this._doc.head.cloneNode(true);
		this._isHead = true;
		this._recursiveWalk(this._doc.head, newHead, false);
		newHtml.appendChild(newHead);
	}
	_appendNewBody(newHtml) {
		let newBody = this._doc.body.cloneNode(true);
		this._isHead = false;
		this._recursiveWalk(this._doc.body, newBody, true);
		newHtml.appendChild(newBody);
	}
	_getHtmlObject() {
		let newHtml = this._createNewHtml();
		this._appendNewHead(newHtml);
		this._appendNewBody(newHtml);
		this._appendNewStyle(newHtml);
		return newHtml;
	}
	_prepareOutput(newHtmlObject, outputType) {
		let output = null;
		let outputTypeEnum = new OutputTypeEnum();
		if (!outputType || (outputType === outputTypeEnum.OBJECT)) {
			output = newHtmlObject;
		} else {
			let outerHtml = (newHtmlObject ? (newHtmlObject.outerHTML) : '') || '';
			if (outerHtml) {
				if (outputType === outputTypeEnum.STRING) {
					output = outerHtml;
				} else if (outputType === outputTypeEnum.URI) {
					output = Encoder.uriEncode(outerHtml);
				} else if (outputType === outputTypeEnum.BASE64) {
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
		let startTime = (new Date()).getTime();
		try {
			this._overrideOptions(options);
			this._doc = htmlDocument || document;
			this._logger.setLogLevel(this._options.logLevel);
			this._logger.info(`capture() outputType: ${outputType} - start`);
			let newHtmlObject = this._getHtmlObject();
			output = this._prepareOutput(newHtmlObject, outputType);
		} catch(ex) {
			this._logger.error(`capture() - error - ${ex.message}`);
		} finally {
			this._logger.info(`capture() - end - ${(new Date()).getTime() - startTime}ms`);
		}
		return output;
	}
}
