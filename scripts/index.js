const article = document.querySelector("article");

function sendRecordedFile(blob) {
    // Save the audio file to the server
    const formData = new FormData();
    formData.append('audio', blob, 'recording.ogg');

    fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData
    }).then(response => response.text())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
}

function addStartRecordVoiceEvent(mediaRecorder) {
    mediaRecorder.start();
    console.log("recorder started");
    const startRecordButton = document.querySelector('#start-record-voice');
    const stopRecordButton = document.querySelector('#stop-record-voice');
    startRecordButton.disabled = true;
    stopRecordButton.disabled = false;
}

function addStopRecordVoiceEvent(mediaRecorder) {
    const startRecordButton = document.querySelector('#start-record-voice');
    const stopRecordButton = document.querySelector('#stop-record-voice');
    stopRecordButton.addEventListener("click", () => {
        mediaRecorder.stop();
        console.log("recorder stopped");
        startRecordButton.disabled = false;
        stopRecordButton.disabled = true;
    })
}

function initRecording() {
    console.log("Starting voice recording...");
    const mediaConstraints = {audio: true, video:false};
    navigator.mediaDevices.getUserMedia(mediaConstraints)
        .then(stream => {
            const mediaRecorder = new MediaRecorder(stream);
            let chunks = [];

            addStartRecordVoiceEvent(mediaRecorder);
            addStopRecordVoiceEvent(mediaRecorder);

            mediaRecorder.ondataavailable = (e) => {
                chunks.push(e.data);
            }

            mediaRecorder.onstop = (e) => {
                console.log("data available after MediaRecorder.stop() called.");

                const blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
                chunks = [];

                const audioURL = window.URL.createObjectURL(blob);
                console.log("recorder stopped and data available: ", audioURL);

                sendRecordedFile(blob);
            };
        });
}

function addRecordVoiceEvents() {
    const startRecordButton = document.querySelector('#start-record-voice');
    startRecordButton.addEventListener("click", initRecording);
}


function insertExtensionHTML() {
    const resourcePath = chrome.runtime.getURL('/transcript-index.html');
    fetch(resourcePath)
        .then(response => response.text())
        .then(data => {
            const newElement = document.createElement("div");
            newElement.innerHTML = data;
            const badge = document.querySelector("#timer-id");
            badge.insertAdjacentElement("afterend", newElement);

            addRecordVoiceEvents();
        })
        .catch(error => console.log(error));
}

function addTimerExample() {
    const text = article.textContent;
    const wordMatchRegExp = /[^\s]+/g; // Regular expression
    const words = text.matchAll(wordMatchRegExp);
    // matchAll returns an iterator, convert to array to get word count
    const wordCount = [...words].length;
    const readingTime = Math.round(wordCount / 200);
    const badge = document.createElement("p");
    // Use the same styling as the publish information in an article's header
    badge.id = "timer-id";
    badge.classList.add("color-secondary-text", "type--caption");
    badge.textContent = `⏱️ ${readingTime} min read`;

    // Support for API reference docs
    const heading = article.querySelector("h1");
    // Support for article docs with date
    const date = article.querySelector("time")?.parentNode;
    (date ?? heading).insertAdjacentElement("afterend", badge);
}


if (article) {
    addTimerExample();
    insertExtensionHTML();
}