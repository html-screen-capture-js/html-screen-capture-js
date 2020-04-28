import { OutputType, LogLevel, Options, CaptureOutput, CaptureFunction } from './types';
import { goCapture } from './capturer';

export { OutputType, LogLevel, Options, CaptureOutput, CaptureFunction } from './types';
export const capture: CaptureFunction = (outputType, htmlDocument, options) => {
    return goCapture(outputType, htmlDocument, options);
};
