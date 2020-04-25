import OutputTypeEnum from './output-type-enum';
import Capturer from './capturer';

export const OutputType = new OutputTypeEnum();

export function capture(outputType, htmlDocument, options) {
	return (new Capturer()).capture(outputType, htmlDocument, options);
}
