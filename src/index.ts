import { goCapture, OutputType, CapturerOutput, CaptureOptions } from './capturer';

export { CaptureOptions, OutputType } from './capturer';
export { LogLevel } from './logger';
export const capture = (
    outputType: OutputType,
    htmlDocument: HTMLDocument,
    options: CaptureOptions,
): CapturerOutput => {
    return goCapture(outputType, htmlDocument, options);
};
