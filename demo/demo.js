const goCapture = () => {
	const docText = htmlScreenCaptureJs.capture(
        'string',
        document,
        {
            attrKeyValuePairsOfIgnoredElements: {
                id: 'content-to-ignore'
            }
        });
	document.getElementById('capture-result-text').value = docText;
	displayInFrame(docText);
	document.getElementById('btn-copy').classList.remove('hidden');
	document.getElementById('capture-result-text').classList.remove('hidden');
	document.getElementById('capture-result-iframe').classList.remove('hidden');
};

const displayInFrame = (docText) => {
	var iframe = document.getElementById('capture-result-iframe');
	iframe.src = 'data:text/html;charset=utf-8,' + encodeURI(docText);
};

const goCopy = () => {
    const outputText = document.getElementById('capture-result-text');
    outputText.select();
    document.execCommand('copy');
};

const drawCanvas = () => {
    const canvas = document.getElementById('my-canvas');
    const ctx = canvas.getContext('2d');
    const grd = ctx.createRadialGradient(50, 25, 0, 50, 25, 50);
    grd.addColorStop(0, "#000");
    grd.addColorStop(1, "#0aa");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 100, 50);

    ctx.font = "16px Helvetica";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText("Canvas", canvas.width/2, canvas.height/2+5);
};

document.addEventListener('DOMContentLoaded', () => { 
    drawCanvas();
});
