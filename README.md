# html-screen-capture-js

[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)
[![NPM version](https://img.shields.io/npm/v/html-screen-capture-js.svg)](https://www.npmjs.com/package/html-screen-capture-js)
[![Github Release](https://img.shields.io/github/release/html-screen-capture-js/html-screen-capture-js/all.svg)](https://github.com/html-screen-capture-js/html-screen-capture-js/releases)

A tiny 11KB highly-customizable javascript library that gets a webpage, and returns a new lightweight self-contained HTML DOM document. The library removes all external file dependencies while preserving the original appearance.

This library can be used to:

- Create a web page screen capture "image", and display the "snapshot" (e.g. by using an iframe).
- Strip an html document from its external dependencies, as a step in a bigger process.
- Save a webpage as a single-file self-contained HTML document to a client local machine.
- Send a complete webpage content as a simple string to a remote server.

License:

- Free (MIT).

<a name="demo"></a>
## Try the Demo

Simply clone/download the repository and execute cmd:
```sh
run-demo.bat
```
It will install all the required npm dependencies, build the library, and open the demo page in Chrome.

<a name="technicalOverview"></a>
## Technical Overview

The code gets an HTML document as a parameter, and returns a new lightweight self-contained HTML document object that preserves the original appearance.
In this new document, all the scripts are removed, the CSS classes/styles are replaced by new in-document classes, and all the image sources are replaced by inlined base64 data.
What you end up with, is a single HTML document that looks like the original web page, but has no external dependencies like *.js, *.css, *.png, etc. so it can easily be displayed, saved, or transferred.
Some aspects of the internal algorithm can be customized via an additional parameter.
The source code is written in ES6, and transpiled to ES5.

<a name="installation"></a>
## Installation

You can get this library from these sources:

- From [GitHub](https://github.com/html-screen-capture-js/html-screen-capture-js)

- From [npm](https://www.npmjs.com/package/html-screen-capture-js)

[![NPM](https://nodei.co/npm/html-screen-capture-js.png?compact=true)](https://www.npmjs.com/package/html-screen-capture-js)

<a name="artifacts"></a>
## Artifacts

- html-screen-capture.js
- html-screen-capture.min.js

<a name="feedback"></a>
## Feedback and Bugs

[Leave feedback or report a bug](https://github.com/html-screen-capture-js/html-screen-capture-js/issues)

<a name="api"></a>
## API

### Syntax

```sh
capture([outputType], [htmlDocument], [options]);
```

### Parameters

#### outputType
An optional enum-type parameter, specifying the desired output. If not specified (falsey) - output will be returned as an object.

A valid value is one of these:
- htmlScreenCapturer.OutputType.OBJECT
- htmlScreenCapturer.OutputType.STRING
- htmlScreenCapturer.OutputType.URI
- htmlScreenCapturer.OutputType.BASE64

#### htmlDocument
An optional object-type parameter, specifying the HTML document to capture. If not specified (falsey) - window.document is used.

#### options
An optional object-type parameter with key-value pairs. You can change any default option value by defining a similarly named property on this object. If not specified (falsey), or specified but defining only some of the properties - default values are used for all non-defined properties.

##### rulesToAddToDocStyle 

- Type: Array of strings 
- Default: [ ] //an empty array
- CSS rules to add to the newly created HTML document.

##### tagsOfIgnoredDocHeadElements

- Type: Array of strings
- Default: [ 'script', 'link', 'style' ]
- Head elements with these tag names will not be cloned to the newly created HTML document.

##### tagsOfIgnoredDocBodyElements

- Type: Array of strings
- Default: [ 'script' ]
- Body elements with these tag names will not be cloned to the newly created HTML document.

##### classesOfIgnoredDocBodyElements

- Type: Array of strings
- Default: [ ] //an empty array
- Body elements with these class names will not be cloned to the newly created HTML document.

##### attrKeyValuePairsOfIgnoredElements

- Type: Object
- Default: { } //an empty object
- Each property name is an HTML attribute key, and its value is an HTML attribute value. Elements with these attribute name and value will not be cloned to the newly created HTML document.

##### tagsOfSkippedElementsForChildTreeCssHandling

- Type: Array of strings 
- Default: [ 'svg' ]
- Children of elements with these tag names will not undergo CSS class/style manipulations.

##### attrKeyForSavingElementOrigClass

- Type: String 
- Default: '_class'
- A non-existing HTML attribute name for saving the original element classes.

##### attrKeyForSavingElementOrigStyle

- Type: String 
- Default: '_style'
- A non-existing HTML attribute name for saving the original element style.

##### prefixForNewGeneratedClasses

- Type: String
- Default: 'c'
- The prefix to use for all newly created classes - the suffix is a number.

##### imageFormatForDataUrl

- Type: String
- Default: 'image/png'
- The image format to use when images are replaced with base64 data. A valid value is any type supported by canvas.toDataURL().

##### imageQualityForDataUrl

- Type: Number
- Default: 0.92
- The image quality to use when images are replaced with base64 data - relevant only for some image formats. A valid value is any number between 0 and 1. 

##### logLevel

- Type: String
- Default: 'warn'
- Log level. A valid value is one of these: 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'off' 

### Return Value

The returned value is a new static lightweight HTML document in some format depending on the OutputType parameter supplied to the function.
- If OutputType equals to htmlScreenCaptureJs.OutputType.OBJECT, the return value is an object.
- If OutputType equals to htmlScreenCaptureJs.OutputType.STRING, the return value is a string.
- If OutputType equals to htmlScreenCaptureJs.OutputType.URI, the return value is a URI-encoded string.
- If OutputType equals to htmlScreenCaptureJs.OutputType.BASE64, the return value is a Base64-encoded string.  
- If OutputType is not specified, the return value is an object. 

### Usage Example

#### By ES6 import

```sh
import { capture, OutputType } from 'html-screen-capture-js';
...
const obj = capture();
const str = capture(OutputType.STRING);
const str = capture(OutputType.STRING, document, {'imageFormatForDataUrl': 'image/jpeg', 'imageQualityForDataUrl': 1.0});
```

#### By global variable (for ES5)

```sh
const obj = htmlScreenCaptureJs.capture();
const str = htmlScreenCaptureJs.capture(OutputType.STRING);
const str = htmlScreenCaptureJs.capture(OutputType.STRING, document, {'imageFormatForDataUrl': 'image/jpeg', 'imageQualityForDataUrl': 1.0});
```

### Real-Life Usage Example

```sh
import {capture, OutputType} from 'html-screen-capture-js';

...
// capture the webpage
const htmlDocStr = capture(
	OutputType.STRING,
	window.document,
	{
		rulesToAddToDocStyle: [
			'*, *::before, *::after {letter-spacing: -0.3px !important;}',
		],
		classesOfIgnoredDocBodyElements: [
			'modal-dialog--error',
			'modal-dialog-backdrop',
		],		
	}
);

// zip and convert
const jsZip = new JSZip();
jsZip.file('screen-capture.html', htmlDocStr);
const screenCaptureZipFile = await jsZip.generateAsync({type: 'blob', compression: 'DEFLATE'});
const screenCaptureZipFileBase64 = await this.convertBlobToBase64(screenCaptureZipFile);

// post to the server
$.ajax({
	type: 'POST',
	url: url,
	headers: headers,
	contentType: 'application/json',
	dataType: 'json',
	data: JSON.stringify({screenshot: screenCaptureZipFileBase64}),
});
```
