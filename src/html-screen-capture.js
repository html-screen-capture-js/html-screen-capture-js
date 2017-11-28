import OutputTypeEnum from './output-type-enum';
import Capturer from './capturer';

class HtmlScreenCapturer {
	constructor() {
		this.OutputType = new OutputTypeEnum();
	}
	capture(outputType, htmlDocument, options) {
		return (new Capturer()).capture(outputType, htmlDocument, options);
	}
}
module.exports = new HtmlScreenCapturer();
