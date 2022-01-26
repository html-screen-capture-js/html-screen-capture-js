# html-screen-capture-js

[![NPM downloads](https://img.shields.io/npm/dm/html-screen-capture-js?color=brightgreen)](https://www.npmjs.com/package/html-screen-capture-js)
[![License](https://img.shields.io/badge/License-MIT-brightgreen.svg?label=license)](https://opensource.org/licenses/MIT)
[![Types](https://img.shields.io/npm/types/html-screen-capture-js?color=brightgreen)](https://www.typescriptlang.org/)
[![NPM version](https://img.shields.io/npm/v/html-screen-capture-js.svg?color=blue)](https://www.npmjs.com/package/html-screen-capture-js)
[![Github Release](https://img.shields.io/github/release/html-screen-capture-js/html-screen-capture-js/all.svg?color=blue)](https://github.com/html-screen-capture-js/html-screen-capture-js/releases)
[![Stars](https://img.shields.io/github/stars/html-screen-capture-js/html-screen-capture-js?color=blue)](https://github.com/html-screen-capture-js/html-screen-capture-js/stargazers)
[![Contributers](https://img.shields.io/github/contributors/html-screen-capture-js/html-screen-capture-js?color=blue)](https://github.com/html-screen-capture-js/html-screen-capture-js/graphs/contributors)

A tiny, highly-customizable, single-function javascript/typescript library that captures a webpage and returns a new lightweight, self-contained HTML document. The library removes all external file dependencies while preserving the original appearance of the page. At only 12KB, it offers unparalleled speed and peerless reliability.

This library can be used to:

- Create a web page screen capture "image", and display the "snapshot" (e.g. by using an iframe).
- Strip an html document from its external dependencies, as a step in a bigger process.
- Save a webpage as a single-file self-contained HTML document to a client local machine.
- Send a complete webpage content as a simple string to a remote server.
- Take multiple snapshots of a visitor's actions on a page for compliance purposes (e.g. sign up consents and the like).

License:

- Free (MIT).

<a name="demo"></a>
## Try the Demo

Go to the [demo page](https://dazzling-morse-a38f6a.netlify.app) and click the capture button


<a name="technicalOverview"></a>
## Technical Overview

The code gets an HTML document as a parameter, and returns a new lightweight, self-contained HTML
document object that preserves the appearance of the original page. The newly generated document strips out all
scripts; CSS classes/styles are replaced by new in-document classes; and all
image sources are replaced by inlined base64-encoded versions. The result is a single HTML document
that looks like the original web page, but has no external dependencies like *.js, *.css, *.png, etc.
It can easily be displayed, saved, archived or transferred. Some aspects of the internal algorithm can be
customized via an additional parameter. The source code is written in ES6, and transpiled to ES5.

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

<a name="contribution"></a>
## Code Contribution

You are all welcome to join the adventure.

<a name="api"></a>
## API

### Syntax

```sh
capture([outputType], [htmlDocument], [options]);
```

### Parameters

#### outputType
An optional enum-type parameter, specifying the desired output. If not specified (falsey) - output will be returned as an object.

- Valid values: 'object' | 'string'

#### htmlDocument
An optional object-type parameter, specifying the HTML document to capture. If not specified (falsey) - window.document is used.

#### options
An optional object-type parameter. You can change any default option value by defining a similarly
named property within the object. If not specified (falsey), or specified but defining only some of
the properties, default values are used for all non-defined properties.

##### rulesToAddToDocStyle 

- Type: Array of strings 
- Default: [ ] //an empty array
- CSS rules to add to the newly created HTML document.

#### cssSelectorsOfIgnoredElements

- Type: Array of strings
- Default: [ 'script', 'link', 'style' ]
- Elements matching any of these CSS-style selectors will not be cloned to the newly created HTML document.

##### computedStyleKeyValuePairsOfIgnoredElements

- Type: Object
- Default: { display: 'none' }
- Each property name is a css style property, and its value is a css style value. Elements with these definitions in their computed style will not be cloned to the newly created HTML document.

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

##### prefixForNewGeneratedPseudoClasses

- Type: String
- Default: 'p'
- The prefix to use for all newly created pseudo classes - the suffix is a number.

##### imageFormatForDataUrl

- Type: String
- Default: 'image/png'
- The image format to use when images are replaced with base64 data. A valid value is any type supported by canvas.toDataURL().

##### imageQualityForDataUrl

- Type: Number
- Default: 0.92
- The image quality to use when images are replaced with base64 data; relevant only for some image formats.
  A valid value is any number between 0 and 1. 

##### logLevel

- Type: String
- Default: 'warn'
- Valid values: 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'off' 

### Return Value

The returned value is a static HTML document in the format specified by the OutputType
parameter supplied to the function. Valid options are below:
- "htmlScreenCaptureJs.OutputType.OBJECT"; the return value is an object. (Default)
- "htmlScreenCaptureJs.OutputType.STRING"; the return value is a string.

### Usage Example

#### By global variable (for ES5)

```sh
var str = htmlScreenCaptureJs.capture(
    'string',
    window.document,
    {
        rulesToAddToDocStyle: [
            '*,*::before,*::after{font-family:Arial,sans-serif !important;}',
        ],
        imageFormatForDataUrl: 'image/jpeg',
        imageQualityForDataUrl: 1.0
    }
);
```

#### By ES6 import

```sh
import { capture, OutputType } from 'html-screen-capture-js';
...
const str = capture(
    OutputType.STRING,
    window.document,
    {
        rulesToAddToDocStyle: [
            '*,*::before,*::after{font-family:Arial,sans-serif !important;}',
        ],
        imageFormatForDataUrl: 'image/jpeg',
        imageQualityForDataUrl: 1.0
    }
);
```

### Real-Life ES6 Usage Example

```sh
import {capture, OutputType} from 'html-screen-capture-js';

...
// capture the webpage
const htmlDocStr = capture(
	OutputType.STRING,
	window.document,
	{
		rulesToAddToDocStyle: [
            		'@import url("https://fonts.googleapis.com/css?family=Roboto&display=swap")'			
		],
		cssSelectorsOfIgnoredElements: [
	    		'.modal-dialog-backdrop',
	    		'.modal-dialog--error'
	  	]
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

### Self-Help When Missing a Feature

If the library is missing a feature you need, you can help yourself:

```sh
// Set the output type parameter to OutputType.OBJECT (instead of the more common OutputType.STRING).
const htmlDocObj = capture(OutputType.OBJECT, ..., ...);

// Since the function now returns a DOM document object, you can further manipulate it via js.
...
...
...

// Once done, convert to a string.
const htmlDocStr = htmlDocObj.outerHTML;

// Continue as usual (sending the string to a server, etc.)
...
...
...
```

Obviously, you can also create a new enhancement request type issue [here](https://github.com/html-screen-capture-js/html-screen-capture-js/issues)
