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

const drawCanvas = () => {
    const canvas = document.getElementById('my-canvas');
    const ctx = canvas.getContext('2d');
    const grd = ctx.createRadialGradient(50, 50, 0, 50, 50, 50);
    grd.addColorStop(0, "#000");
    grd.addColorStop(1, "#0aa");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 100, 100);

    ctx.font = "16px Helvetica";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText("Canvas", canvas.width/2, canvas.height/2+5);
};

document.addEventListener('DOMContentLoaded', () => { 
    drawCanvas();
});
