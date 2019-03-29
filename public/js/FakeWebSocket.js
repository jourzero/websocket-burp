var wsStatus = "Unknown";

$.ajaxSetup({cache: false});

class FakeWebSocket {
    constructor(url) {
        console.info("Sending websocket open request to", url);
        let server = {};
        server.url = new URL(url);
        this.sendPostRequest("/websocket/open", JSON.stringify(server));
    }

    send(msg) {
        //let data = {};
        //data.message = msg;
        console.info("Sending message", msg);
        this.sendPostRequest("/websocket/send", msg);
    }

    close() {
        console.info("Sending websocket close request");
        this.sendPostRequest("/websocket/close", "Close");
    }

    checkStatus() {
        console.info("Sending websocket status request");
        $.getJSON("/websocket/check", function(data) {
            if (data !== undefined && data.status !== undefined) {
                $("#wsStatus").html(data.status);
                let statusText = new String(data.status);
                if (statusText.startsWith("Open")) {
                    onopen();
                }
            }
        });
    }

    dequeue() {
        console.info("Sending websocket dequeue request");
        $.getJSON("/websocket/dequeue", function(data) {
            //if (data !== undefined) $("#wsData").html(JSON.stringify(data));
            if (data !== undefined) $("#wsData").html(data);
        });
    }

    postRespHandler(data, textStatus, jqXHR) {
        try {
            // Assume that the data is for onmessage() if it's not a string or an object (audio)
            if (
                data === undefined ||
                (typeof data !== "string" && typeof data !== "object") ||
                data.type !== undefined
            ) {
                let event = {};
                if (data !== undefined && data.type !== undefined) {
                    event.data = JSON.stringify(data);
                } else event.data = data;
                onmessage(event);
            }
            // If it's a redirect, we probably got here right after sending a message. In any case, follow the redirect.
            if (data.redirect) {
                console.debug("Redirected!", JSON.stringify(data));
                sendGetRequest(data.redirect);
            } else {
                // If the websocket was just opened, call onopen() after a 5 sec. wait.
                if (data.op !== undefined && data.op === "open") {
                    setTimeout("onopen()", 2000);
                }
            }
        } catch (err) {
            console.error("Exception caught:", err);
        }
    }

    sendPostRequest(url, msg) {
        console.debug("Sending POST request to", url, ":", msg);
        $.post(url, msg, this.postRespHandler, "json");

        /*
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);

        //Send the proper header information along with the request
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        xhr.onreadystatechange = function() {
            // Call a function when the state changes.
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                // Request finished. Do processing here.
            }
        };
        //xhr.send(JSON.stringify(msg));
        xhr.send(msg);
        */
    }

    sendGetRequest(url) {
        console.debug("Sending GET request to", url);
        $.getJSON(url, function(data) {
            try {
                if (data !== undefined) {
                    if (data.status !== undefined) wsStatus = data.status;
                    else {
                        let event = {};
                        event.data = JSON.stringify(data);
                        onmessage(event);
                    }
                }
            } catch (err) {
                console.error("Exception caught:", err);
            }
        });
    }

    poll() {
        this.sendGetRequest("/websocket/receive");
    }
} // class FakeWebSocket

// Poll for new messages every 15 seconds
setInterval("socket.poll()", 15000);

function openWS() {
    let wsUrl = $("#wsUrl").val();
    console.debug("Opening WebSocket at", wsUrl);
    socket = new FakeWebSocket(wsUrl);
}

function sendToWS() {
    let msg = $("#wsMsg").val();
    console.debug("Sending message", msg);
    socket.send(msg);
}

function checkWS() {
    console.debug("Checking status.");
    socket.checkStatus();
}

function dequeueWS() {
    console.debug("Dequeuing all received WebSocket data.");
    socket.dequeue();
}

function closeWS() {
    closeSocket();
    console.debug("WebSocket connection closed.");
}

function onopen() {
    console.debug("WebSocket connection opened.");
    ui_socketOpened();
    ui_socketHasOpened();
    setAllCookies();

    if (sessionless === false) {
        let version = $("#api_version")[0];
        let parameters = {
            applicationKey: applicationKey,
            verificationCode: verificationCode,
            speechSynthesisCodec: speechSynthesisCodec,
            speechRecognitionCodec: speechRecognitionCodec
        };
        Object.keys(extraParameters).forEach(function(key) {
            parameters[key] = extraParameters[key];
        });
        extraParameters = {};

        let startSessionCommand = {
            version: version.options[version.selectedIndex].value,
            type: "command",
            command: {
                name: "startSession",
                id: applicationStepId,
                parameters: parameters
            }
        };
        currentCommands.push(startSessionCommand);
        console.debug("Sending command:\n" + JSON.stringify(startSessionCommand));
        socket.send(JSON.stringify(startSessionCommand));

        currentCommand = "startSession";
        createNewLog();
    }
}

function onclose() {
    if (confirm("Would you like to open logs of the expired session in another window?")) {
        let log = {
            sessionId: sessionId,
            commands: commands,
            results: results
        };
        let content = JSON.stringify(log, null, 2);
        let uriContent = "data:application/json; charset=utf-8 ," + content;
        window.open().document.write("<pre>" + content + "</pre>");
    }
    if (!alert("WebSocket connection closed.")) {
        window.location.reload(true);
    }
}

function connFailure() {
    if (confirm("Connection failed. Would you like to reset connection and session parameters?")) {
        reset();
        window.location.reload(true);
    } else {
        window.location.reload(true);
    }
}

function onmessage(event) {
    console.debug("In onmessage() with data:", JSON.stringify(event));
    let audioContext = initAudioContext();
    let audioPlayer = new AudioPlayer(audioContext); // For the play audio command
    let audioPlayer16k = new AudioPlayer16k(audioContext);
    let audioPlayerSpeex = new AudioPlayerSpeex(audioContext);
    let audioPlayerSpeex16k = new AudioPlayerSpeex16k(audioContext);
    console.debug("socket RECEIVED:");
    if (isOfType("ArrayBuffer", event.data)) {
        // The play audio command will return ArrayBuffer data to be played
        console.debug("ArrayBuffer");
        let newAudio;

        if (speechSynthesisCodec === "speex_nb") {
            var speexDecoder = new SpeexDecoder({
                mode: 0,
                quality: 6,
                lpcm: true,
                bits_size: 45.5
            });
            speexDecoder.init();

            var speex = event.data;
            var speexFloatArray = new Uint8Array(speex, 0, speex.byteLength);

            var pcm = speexDecoder.process(speexFloatArray);
            decCount = 0;
            console.debug("pcm: " + pcm);
            if (pcm < 0) {
                return;
            }
            //Playing the audio
            audioToPlay = new Int16Array(pcm);
        } else if (speechSynthesisCodec === "speex_wb") {
            var speexDecoder = new SpeexDecoder({
                mode: 1,
                quality: 8,
                bits_size: 139,
                lpcm: true
            });
            speexDecoder.init();

            var speex = event.data;

            var speexFloatArray = new Uint8Array(speex, 0, speex.byteLength);

            var pcm = speexDecoder.process(speexFloatArray);
            decCount = 0;
            // console.log("pcm: " + pcm);
            if (pcm < 0) {
                return;
            }
            //  console.log("pcm.length: " + pcm.length);

            //Playing the audio
            audioToPlay = pcm;
        } else if (speechSynthesisCodec === "opus_wb") {
            var channels = 1;
            Decoder.on("decode", function(pcmData) {
                newAudio = new Int16Array(pcmData);

                let oldAudio = audioToPlay;

                audioToPlay = new Int16Array(oldAudio.length + newAudio.length);

                audioToPlay.set(oldAudio);

                audioToPlay.set(newAudio, oldAudio.length);
            });
            Decoder.decode(event.data);
        } else {
            newAudio = new Int16Array(event.data);

            let oldAudio = audioToPlay;

            audioToPlay = new Int16Array(oldAudio.length + newAudio.length);

            audioToPlay.set(oldAudio);

            audioToPlay.set(newAudio, oldAudio.length);
        }
        // Append received buffer to audioToPlay
    } else {
        // event.data should be text and you can parse it
        let response = JSON.parse(event.data);
        console.debug(response);

        if (response.sessionId != null) {
            sessionlessId = response.sessionId;
        }

        if (response.result) {
            let result = response.result;
            if (currentCommand === "startSession") {
                currentResults.push(response);
                commands.push(currentCommands);
                results.push(currentResults);
                currentCommands = [];
                currentResults = [];
                if (result.status.toUpperCase() === "SUCCESS") {
                    ui_sessionHasStarted();
                    sessionId = response.sessionId;
                    $(".applicationStepId").val(applicationStepId);
                } else {
                    alert(JSON.stringify(response, null, 4));
                    socket.connFailure();
                }
            } else if (currentCommand === "endSession") {
                currentResults.push(response);
                commands.push(currentCommands);
                results.push(currentResults);
                currentCommands = [];
                currentResults = [];
                if (result.status.toUpperCase() === "SUCCESS") {
                    ui_sessionHasEnded();
                    // In case socket is not closed by the Server, close it from Client side
                    if (socket !== undefined) {
                        socket.close();
                    }
                } else {
                    alert(JSON.stringify(response, null, 4));
                }
            } else if (currentCommand === "speechSynthesis") {
                if (result.status.toUpperCase() === "SUCCESS") {
                    // Play TTS audio

                    //Here we modify for the good playing of other codecs.

                    if (speechSynthesisCodec === "pcm_16_8k") {
                        audioPlayer.play(audioToPlay);
                    } else if (speechSynthesisCodec === "pcm_16_16k") {
                        console.debug(audioToPlay);
                        audioPlayer16k.play(audioToPlay);
                    } else if (speechSynthesisCodec === "speex_nb") {
                        audioPlayerSpeex.play(audioToPlay); // here removed the divided by 32768
                    } else if (speechSynthesisCodec === "speex_wb") {
                        audioPlayerSpeex16k.play(audioToPlay);
                    } else if (speechSynthesisCodec === "opus_wb") {
                        audioPlayer16k.play(audioToPlay);
                    }

                    // Clear buffer
                    audioToPlay = new Int16Array(0);
                }
                currentResults.push(response);
                commands.push(currentCommands);
                results.push(currentResults);
                currentCommands = [];
                currentResults = [];
                $("#playaudio_results").text(JSON.stringify(response, null, 4));
                ui_ttsStopped();
            } else if (currentCommand === "speechRecognition") {
                if (result.final) {
                    // final result
                    currentResults.push(response);
                    commands.push(currentCommands);
                    results.push(currentResults);
                    currentCommands = [];
                    currentResults = [];
                    $("#sr_results").text(JSON.stringify(response, null, 4));
                    ui_stopSRRecording();
                    if (audioRecorder) {
                        stopRecording();
                    }
                } else {
                    // partial result
                    currentResults.push(response);
                    $("#sr_results").text(JSON.stringify(response, null, 4));
                }
            } else if (currentCommand === "UploadDynamicVocabulary") {
                if (result.final) {
                    currentResults.push(response);
                    commands.push(currentCommands);
                    results.push(currentResults);
                    currentCommands = [];
                    currentResults = [];
                    $("#config_results").text(JSON.stringify(response, null, 4));
                } else {
                    // Runtime response
                    currentResults.push(response);
                    $("#config_results").text(JSON.stringify(response, null, 4));
                }
            } else if (currentCommand === "interpretationCommand") {
                if (result.final) {
                    currentResults.push(response);
                    commands.push(currentCommands);
                    results.push(currentResults);
                    currentCommands = [];
                    currentResults = [];
                    $("#nle_results").text(JSON.stringify(response, null, 4));
                }
            }
        } else if (response.event) {
            currentResults.push(response);
            $("#sr_results").text(JSON.stringify(response, null, 4));
        } else {
            alert(JSON.stringify(response, null, 4));
        }
    }
}
