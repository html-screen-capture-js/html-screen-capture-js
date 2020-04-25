import { goCapture, OutputType, CapturerOutput, CaptureOptions } from './capturer';

declare global {
    interface Window {
        htmlScreenCaptureJs: {
            capture: (outputType: OutputType, htmlDocument: HTMLDocument, options: CaptureOptions) => CapturerOutput;
        };
    }
}

export const capture = (
    outputType: OutputType,
    htmlDocument: HTMLDocument,
    options: CaptureOptions,
): CapturerOutput => {
    return goCapture(outputType, htmlDocument, options);
};

window.htmlScreenCaptureJs = {
    capture,
};
