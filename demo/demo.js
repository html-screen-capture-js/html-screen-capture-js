const goCapture = () => {
    document.getElementById('output').value = htmlScreenCaptureJs.capture(
        'string',
        document,
        {
            attrKeyValuePairsOfIgnoredElements: {
                id: 'capture-controls'
            }            
        });
    document.getElementById('btn-copy').removeAttribute('disabled');
};

const goCopy = () => {
    const outputText = document.getElementById('output');
    outputText.select();
    document.execCommand('copy');
};
