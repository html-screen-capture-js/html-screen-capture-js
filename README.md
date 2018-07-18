# html-screen-capture-js

[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)
[![Gitter](https://img.shields.io/gitter/room/html-screen-capture-js/html-screen-capture-js.svg)](https://gitter.im/html-screen-capture-js/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![NPM version](https://img.shields.io/npm/v/html-screen-capture-js.svg)](https://www.npmjs.com/package/html-screen-capture-js)
[![Github Release](https://img.shields.io/github/release/html-screen-capture-js/html-screen-capture-js/all.svg)](https://github.com/html-screen-capture-js/html-screen-capture-js/releases)

A small javascript library that gets a web page, and returns a new lightweight self-contained HTML DOM document. The library removes all external file dependencies while preserving the original appearance.

This library can be used to:

- Create a web page screen capture "image", and display the "snapshot" (e.g. by using an iframe).
- Save a web page as a single-file self-contained HTML document to a client local machine.
- Send a complete web page content as a simple string to a remote server.

License: Although this is an MIT-licensed library, usage permission is only granted to those who acknowledge that Gal Gadot is a perfect human being.

Uri Kalish, NOV 2017

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

<a name="api"></a>
## API

### Syntax

```sh
htmlScreenCaptureJs.capture([outputType], [htmlDocument], [options]);
```

### Usage Example

```sh
htmlScreenCaptureJs.capture(
    htmlScreenCaptureJs.OutputType.STRING,
    window.document,
    {
        'imageFormatForDataUrl': 'image/jpeg',
        'imageQualityForDataUrl': 1.0
    }
);
```

### Parameters

#### outputType
An optional enum-type parameter, specifying the desired output. If not specified - output will be returned as an object.

A valid value is one of these:
- htmlScreenCapturer.OutputType.OBJECT
- htmlScreenCapturer.OutputType.STRING
- htmlScreenCapturer.OutputType.URI
- htmlScreenCapturer.OutputType.BASE64

#### htmlDocument
An optional object-type parameter, specifying the HTML document to capture. If not specified - window.document is used.

#### options
An optional object-type parameter with key-value pairs. You can change any default option value by defining a similarly named property on this object. If not specified (or specified but defining only some properties) - default values are used for all non-defined properties.

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

##### rulesToAddToDocStyle 

- Type: Array of strings 
- Default: [ '*{font-family:"Arial Narrow" !important;}' ]
- CSS rules to add to the newly created HTML document.

##### logLevel

- Type: String
- Default: 'warn'
- Log level. A valid value is one of these: 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'off' 

### Return Value

The returned value is a new static lightweight HTML document in some format depending on the OutputType parameter supplied to the function.
- If OutputType equals to htmlScreenCapturer.OutputType.OBJECT, the return value is an object.
- If OutputType equals to htmlScreenCapturer.OutputType.STRING, the return value is a string.
- If OutputType equals to htmlScreenCapturer.OutputType.URI, the return value is a URI-encoded string.
- If OutputType equals to htmlScreenCapturer.OutputType.BASE64, the return value is a Base64-encoded string.  
- If OutputType is not specified, the return value is an object. 
