socket.onopen();
var sessionlessId;

function openWebSocket() {
    if (socket === undefined) {
        let lHost = $("#host")[0].value;
        if (lHost.length > 0) {
            host = lHost;
        }
        let lPort = $("#port")[0].value;
        if (lPort.length > 0) {
            port = lPort;
        }
        // Session parameters
        let lApplicationKey = $("#applicationKey")[0].value;
        if (lApplicationKey.length > 0) {
            applicationKey = lApplicationKey;
        }

        let lVerificationCode = $("#verificationCode")[0].value;
        if (lVerificationCode.length > 0) {
            verificationCode = lVerificationCode;
        }

        let lSpeechSynthesisCodec = $("#speechSynthesisCodec")[0].value;

        if (lSpeechSynthesisCodec.length > 0) {
            speechSynthesisCodec = lSpeechSynthesisCodec;
        }

        let lSpeechRecognitionCodec = $("#speechRecognitionCodec")[0].value;

        if (lSpeechRecognitionCodec.length > 0) {
            speechRecognitionCodec = lSpeechRecognitionCodec;
        }

        var webSocketUrl = "wss://" + host + ":" + port + "/" + socketPath;
        // EP: Added below line
        socket = new FakeWebSocket(webSocketUrl);
        // EP: commented-out below
        //socket = new WebSocket("wss://" + host + ":" + port + "/" + socketPath); // The WebSocket must be secure "wss://"
        socket.binaryType = "arraybuffer"; // Important for receiving audio

        socket.onopen = function() {
            console.log("WebSocket connection opened.");
            console.log(webSocketUrl);
            ui_socketOpened();
            ui_socketHasOpened();
            setAllCookies();
        };

        socket.onclose = function() {
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
        };
        socket.connFailure = function() {
            if (
                confirm(
                    "Connection failed. Would you like to reset connection and session parameters?"
                )
            ) {
                reset();
                window.location.reload(true);
            } else {
                window.location.reload(true);
            }
        };

        socket.onmessage = function(event) {
            let audioContext = initAudioContext();
            let audioPlayer = new AudioPlayer(audioContext); // For the play audio command
            let audioPlayer16k = new AudioPlayer16k(audioContext);
            let audioPlayerSpeex = new AudioPlayerSpeex(audioContext);
            let audioPlayerSpeex16k = new AudioPlayerSpeex16k(audioContext);
            console.log("socket RECEIVED:");
            if (isOfType("ArrayBuffer", event.data)) {
                // The play audio command will return ArrayBuffer data to be played
                console.log("ArrayBuffer");
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
                    console.log("pcm: " + pcm);
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
                console.log(response);

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
                                console.log(audioToPlay);
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
        };
    }
}

function closeSocket() {
    if (socket !== undefined) {
        socket.close();
    }
    window.location.reload(true);
}

function initWebSocket() {
    var webSocketUrl = "wss://" + host + ":" + port + "/" + socketPath;
    // EP: Added this line
    socket = new FakeWebSocket(webSocketUrl);
    // EP: Commented-out this line:
    //socket = new WebSocket( "wss://" + host + ":" + port + "/" + socketPath); // The WebSocket must be secure "wss://"
    socket.binaryType = "arraybuffer"; // Important for receiving audio

    socket.onopen = function() {
        console.log("WebSocket connection opened.");
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
        console.log("Sending command:\n" + JSON.stringify(startSessionCommand));
        socket.send(JSON.stringify(startSessionCommand));

        currentCommand = "startSession";
        createNewLog();
    };

    // EP: Added this:
    //setTimeout("socket.onopen()", 5000);

    socket.onclose = function() {
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
    };
    socket.connFailure = function() {
        if (
            confirm("Connection failed. Would you like to reset connection and session parameters?")
        ) {
            reset();
            window.location.reload(true);
        } else {
            window.location.reload(true);
        }
    };

    socket.onmessage = function(event) {
        let audioContext = initAudioContext();
        let audioPlayer = new AudioPlayer(audioContext); // For the play audio command
        let audioPlayer16k = new AudioPlayer16k(audioContext);
        let audioPlayerSpeex = new AudioPlayerSpeex(audioContext);
        let audioPlayerSpeex16k = new AudioPlayerSpeex16k(audioContext);
        console.log("socket RECEIVED:");
        if (isOfType("ArrayBuffer", event.data)) {
            // The play audio command will return ArrayBuffer data to be played
            console.log("ArrayBuffer");
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
                console.log("pcm: " + pcm);
                if (pcm < 0) {
                    return;
                }
                console.log("pcm.length: " + pcm.length);

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
            console.log(response);

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
                        ui_interpretationEnded();
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
    };
}
