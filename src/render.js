const {desktopCapturer, remote} = require("electron")
const {dialog, Menu} = remote;
let mediaRecorder;
const recordedChunks = [];

const startBtn = document.getElementById("startBtn")
const stopBtn = document.getElementById("stopBtn")
const videoSelectBtn = document.getElementById("videoSelectBtn")
const videoElement = document.querySelector('video')

videoSelectBtn.onclick = getVideoSources

startBtn.onclick = e => {
    mediaRecorder.start();
    startBtn.classList.add('is-danger');
    startBtn.innerText = 'Recording';
};

stopBtn.onclick = e => {
    mediaRecorder.stop();
    startBtn.classList.remove('is-danger');
    startBtn.innerText = 'Start';
}

//change the Video Source Window to record
async function selectSource(source) {
    videoSelectBtn.innerText = source.name;

    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: "desktop",
                chromeMediaSourceId: source.id
            }
        }
    }

    // create a Stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints)

    //preview the Source in a Video Element
    videoElement.srcObject = stream;
    videoElement.play();

    // create the Media Recorder
    const options = {mimeType: 'video/webm; codecs=vp9'};
    mediaRecorder = new MediaRecorder(stream, options);

    // register Event Handlers
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(e) {
    console.log("Video Data Available");
    recordedChunks.push(e.data);
}

const {writeFile} = require("fs");

// Saves the video file on stop
async function handleStop(e) {
    const blob = new Blob(recordedChunks, {type: 'video/webm; codes=vp9'})

    const buffer = Buffer.from(await blob.arrayBuffer());

    const {filePath} = await dialog.showSaveDialog({
        buttonLabel: "Save video",
        defaultPath: `vid-${Date.now()}.webm`
    })
    console.log("filePath", filePath);

    writeFile(filePath, buffer, () => console.log("Video saved successfully"));

}


async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ["window", "screen"]
    })

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => selectSource(source)
            }
        })
    )

    videoOptionsMenu.popup();
}
