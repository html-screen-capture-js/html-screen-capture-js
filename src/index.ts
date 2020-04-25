import { goCapture, OutputType, CapturerOutput, CaptureOptions } from './capturer';

export const capture = (
    outputType: OutputType,
    htmlDocument: HTMLDocument,
    options: CaptureOptions,
): CapturerOutput => {
    return goCapture(outputType, htmlDocument, options);
};
