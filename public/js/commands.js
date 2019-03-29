// Start/End session functions
var sessionless = false;


function toggleSessionless(){
  if (sessionless === false){
      sessionless = true;
  } else {
      sessionless = false;
  }

  console.log("Sessionless : " + sessionless);
}

function startButton() {
    if (sessionless === false){
        startSession();
    } else {
        openWebSocket();
    }
}

function startSession() {
    ui_startSession();
    let lHost = $('#host')[0].value;
    if (lHost.length > 0) {
        host = lHost;
    }
    let lPort = $('#port')[0].value;
    if (lPort.length > 0) {
        port = lPort;
    }
    // Session parameters
    let lApplicationKey = $('#applicationKey')[0].value;
    if (lApplicationKey.length > 0) {
        applicationKey = lApplicationKey;
    }

    let lVerificationCode = $('#verificationCode')[0].value;
    if (lVerificationCode.length > 0) {
        verificationCode = lVerificationCode;
    }


    let lSpeechSynthesisCodec = $('#speechSynthesisCodec')[0].value;

    if (lSpeechSynthesisCodec.length > 0) {

    	speechSynthesisCodec = lSpeechSynthesisCodec;

    }

    let lSpeechRecognitionCodec = $('#speechRecognitionCodec')[0].value;

    if (lSpeechRecognitionCodec.length > 0) {

    	speechRecognitionCodec = lSpeechRecognitionCodec;

    }



    let lExtraParameters = $('#startSessionExpertParams')[0].value;
    if (lExtraParameters.length > 0) {
        extraParameters = JSON.parse(lExtraParameters);
    }

    if (socket === undefined) {
        initWebSocket();
    }
    //
    //
    // setCookieString("webSocketUrl", lHost, 7);
    // setCookieString("applicationKey", lApplicationKey, 7);
    // setCookieString("verificationCode",lVerificationCode, 7);

    setAllCookies();

}
function endSession() {
    ui_endSession();
    incrementStepId();
    let endSessionCommand = {
        type: "command",
        sessionId: sessionId,
        command: {
            name: "endSession",
            id: applicationStepId
        }
    };
    currentCommands.push(endSessionCommand);
    console.log('Sending command:\n' + JSON.stringify(endSessionCommand));
    socket.send(JSON.stringify(endSessionCommand));
    currentCommand = "endSession";
    createNewLog();
}
// TTS functions
function playAudio() {
  var sessionLessParameters = {
    applicationKey : $('#applicationKey')[0].value,
    verificationCode : $('#verificationCode')[0].value,
    speechSynthesisCodec: $('#speechSynthesisCodec')[0].value,
    speechRecognitionCodec: $('#speechRecognitionCodec')[0].value
  };
    setAllCookies();
    if (!$("#playaudio_button").hasClass("disabled")) {
        $('#playaudio_results').text("");
        incrementStepId();
        let inputText = fixLineBreaks($("#playaudio_text").val());
        let type = $('#tts_type')[0];
        let voice = document.getElementById("tts_voice").value;
        let lExtraParameters = $('#speechSynthesisExpertParams')[0].value;
        if (lExtraParameters.length > 0) {
            extraParameters = JSON.parse(lExtraParameters);
        }

        let parameters = {
                             data: inputText,
                             type: type.options[type.selectedIndex].value,
                             voice: voice,
                         };

        if (sessionless){
          parameters.sessionParameters = sessionLessParameters;
        }



        Object.keys(extraParameters).forEach(function(key)
        {
            parameters[key] = extraParameters[key]
        });
        extraParameters = {};

        let ttsCommand = {
            type: "command",
            sessionId: sessionId,
            command: {
                name: "speechSynthesis",
                id: applicationStepId,
                parameters: parameters
            }
        };
        currentCommands.push(ttsCommand);
        console.log('Sending command:\n' + JSON.stringify(ttsCommand));
        socket.send(JSON.stringify(ttsCommand));
        currentCommand = "speechSynthesis";
        createNewLog();
        ui_ttsStarted();
    }
}
function stopTTS() {

    audioPlayer.stop();
    audioPlayer16k.stop();

    let ttsDirective = {
        type: "directive",
        sessionId: sessionId,
        command: {
            name: "speechSynthesis",
            id: applicationStepId
        },
        directive: {
            name: "stop"
        }
    };
    currentCommands.push(ttsDirective);
    console.log('Sending command:\n' + JSON.stringify(ttsDirective));
    socket.send(JSON.stringify(ttsDirective));
}
// Recording command functions

let audioRecorder;
var shouldStopRecording = true;






function record() {
  var sessionLessParameters = {
    applicationKey : $('#applicationKey')[0].value,
    verificationCode : $('#verificationCode')[0].value,
    speechSynthesisCodec: $('#speechSynthesisCodec')[0].value,
    speechRecognitionCodec: $('#speechRecognitionCodec')[0].value
  };
    let audioContext = initAudioContext();
    setAllCookies();

    shouldStopRecording = false;
    console.log("Recorder started.");
    console.log("Recorder started.");

    // IMPORTANT Make sure you create a new AudioRecorder before you start recording to avoid any bugs !!!
    if(speechRecognitionCodec==="pcm_16_8k"){
        audioRecorder = new AudioRecorder(audioContext,8000);
    }else if(speechRecognitionCodec==="pcm_16_16k"){
        audioRecorder = new AudioRecorder(audioContext,16000);
    }else if(speechRecognitionCodec==="speex_nb"){
        audioRecorder = new AudioRecorder(audioContext,8000);
    }else if(speechRecognitionCodec==="speex_wb"){
        audioRecorder = new AudioRecorder(audioContext,16000);
    }else if(speechRecognitionCodec==="opus_wb"){
        audioRecorder = new AudioRecorder(audioContext,16000);
    }


    audioRecorder.start().then(
        // This callback is called when "def.resolve" is called in the AudioRecorder.
        // def.resolve
        function () {
            console.log("Recorder stopped.");
        },

        // def.reject
        function () {
            console.log("Recording failed!!!");
        },
        // def.notify
        function (data) { // When the recorder receives audio data
            console.log("Audio data received...");

            if (shouldStopRecording) {
                return;
            }
            var frames;

            if(speechRecognitionCodec==="speex_nb"){
                var encoder = new SpeexEncoder({mode: 0, quality: 6, bits_size:91});
                encoder.init();
                encoder.set("SAMPLING_RATE", 8000);

                var pcm = data[0];
                var pcmCount = 0;
                var encBuffer = new Int16Array(encoder.frame_size);
                var encCount = 0;



                while (pcmCount < pcm.length) {
                    var encRemain = encBuffer.length - encCount;
                    var mx = Math.min(encRemain, pcm.length - pcmCount);
                    for (var i = 0; i < mx; i++) {
                        encBuffer[encCount] = pcm[pcmCount];
                        encCount++;
                        pcmCount++;
                    }
                    if (encCount == encBuffer.length) {
                        var speex = encoder.process(encBuffer);
                        encCount = 0;
                        console.log("speex: " + speex);
                        if (!speex) {
                            continue;
                        }
                        console.log("speex[0].length: " + speex[0].length);

                        /*   var str = "";
                         for (var i = 0; i < speex[0].length; i++) {
                         str += int8toHex(speex[0][i]);
                         }
                         console.log(str);*/

                        frames = speex[0];
                        socket.send(frames.buffer);


                    }
                }



            }
            else if(speechRecognitionCodec==="speex_wb"){


                var encoder = new SpeexEncoder({mode: 1, quality: 8, bits_size: 70});
                encoder.init();
                encoder.set("COMPLEXITY", 3);
                encoder.set("SAMPLING_RATE", 16000);
                var pcm = data[0];
                var pcmCount = 0;
                var encBuffer = new Int16Array(encoder.frame_size);
                var encCount = 0;

                while (pcmCount < pcm.length) {
                    var encRemain = encBuffer.length - encCount;
                    var mx = Math.min(encRemain, pcm.length - pcmCount);
                    for (var i = 0; i < mx; i++) {
                        encBuffer[encCount] = pcm[pcmCount];
                        encCount++;
                        pcmCount++;
                    }
                    if (encCount == encBuffer.length) {
                        var speex = encoder.process(encBuffer);
                        encCount = 0;
                        console.log("speex: " + speex);
                        if (!speex) {
                            continue;
                        }
                        console.log("speex[0].length: " + speex[0].length);

                     /*   var str = "";
                        for (var i = 0; i < speex[0].length; i++) {
                            str += int8toHex(speex[0][i]);
                        }
                        console.log(str);*/

                        frames = speex[0];
                        socket.send(frames.buffer);



                        //TO decode speex after recording
                        var oldAudio = fullArray;

                        fullArray = new Int16Array(oldAudio.length + frames.length);

                        fullArray.set(oldAudio);

                        fullArray.set(frames, oldAudio.length);
                    }
                }



            }else if(speechRecognitionCodec==="opus_wb"){

            }else{
                frames = data[0]; // Int16Array
                socket.send(frames.buffer);
            }



        }
    );
}

function stopRecording() {
    shouldStopRecording = true;
    audioRecorder.stop();
    audioRecorder = undefined;


}

// ASR functions
function startSRRecording() {
  var sessionLessParameters = {
    applicationKey : $('#applicationKey')[0].value,
    verificationCode : $('#verificationCode')[0].value,
    speechSynthesisCodec: $('#speechSynthesisCodec')[0].value,
    speechRecognitionCodec: $('#speechRecognitionCodec')[0].value
  };
    ui_startSRRecording();
    incrementStepId();
    let language = document.getElementById("sr_language").value;
    //let engine = document.getElementById("sr_engine").value;
    //
    //
    // Optional parameters
    let endPointDetection = (document.getElementById("sr_endpointDetection").value === 'true');
    var speechDetector;
    var considerNegativeRatios;
    var voiceThreshold;
    var beginNoiseSampleFrames;
    if (document.getElementById("sr_adaptive").checked)
    {
        speechDetector = "adaptive";

        if (document.getElementById("sr_considerNegativeRatiosTrue").checked)
        {
           considerNegativeRatios = true;
        }
        else
        {
            considerNegativeRatios = false;
        }

        voiceThreshold = parseFloat(document.getElementById('sr_voiceThreshold').value);
        beginNoiseSampleFrames = parseInt(document.getElementById("sr_beginNoiseSampleFrames").value);
    }
    else if (document.getElementById("sr_legacy").checked)
    {
        speechDetector = "legacy";
    }
    let endOfSpeechHistoryFrames = parseInt(document.getElementById("sr_endOfSpeechHistoryFrames").value);
    let endOfSpeechVoicedFrames = parseInt(document.getElementById("sr_endOfSpeechVoicedFrames").value);
    let startOfSpeechHistoryFrames = parseInt(document.getElementById("sr_startOfSpeechHistoryFrames").value);
    let startOfSpeechVoicedFrames = parseInt(document.getElementById("sr_startOfSpeechVoicedFrames").value);
    let stopOnEndOfSpeech = (document.getElementById("sr_stopOnEndOfSpeech").value === 'true');
    let wordStream = (document.getElementById("sr_wordstream").value === 'true');
    // Dynamic Vocabulary parameters
    let packageUrl = document.getElementById("dv_package_url").value;
    let activeWordSets = [];
    let array = $("#dv_array").tagit("assignedTags");
    for (let i = 0; i < array.length; i++) {
        if(array[i].length > 0) {
                activeWordSets.push(array[i]);
        }
    }

    let lExtraParameters = $('#speechRecognitionExpertParams')[0].value;
    if (lExtraParameters.length > 0) {
        extraParameters = JSON.parse(lExtraParameters);
    }

    let parameters = {
                         //engine: engine,
                         language: language,
                         endPointDetection: endPointDetection,
                         voiceThreshold: voiceThreshold,
                         beginNoiseSampleFrames: beginNoiseSampleFrames,
                         startOfSpeechHistoryFrames: startOfSpeechHistoryFrames,
                         startOfSpeechVoicedFrames: startOfSpeechVoicedFrames,
                         endOfSpeechHistoryFrames: endOfSpeechHistoryFrames,
                         endOfSpeechVoicedFrames: endOfSpeechVoicedFrames,
                         stopOnEndOfSpeech: stopOnEndOfSpeech,
                         wordStream: wordStream,
//                          applicationVocabularyPackage: packageUrl, // url to the package
                     };

      if (sessionless){
        parameters.sessionParameters = sessionLessParameters;
      }

       if ( activeWordSets.length > 0 ) {
           console.log("Adding dynamic Vocabularies");
           parameters.activeDynamicVocabularySets = activeWordSets;
       }

       //TODO: re enable with new VAD
       if (speechDetector === "adaptive")
       {
           parameters.considerNegativeRatios = considerNegativeRatios;
           parameters.speechDetector = speechDetector;
           parameters.voiceThreshold = voiceThreshold;
           parameters.beginNoiseSampleFrames = beginNoiseSampleFrames;
       }

    if(activeWordSets.length > 0) {

        parameters["activeDynamicVocabularySets"] = activeWordSets

    }


        Object.keys(extraParameters).forEach(function(key)
        {
            parameters[key] = extraParameters[key]
        });
        extraParameters = {};

    let srCommand = {
        type: "command",
        command: {
            name: "speechRecognition",
            id: applicationStepId,
            parameters: parameters
        }
    };

    if (!sessionless){
      srCommand.sessionId = sessionId
    }

    currentCommands.push(srCommand);
    console.log('Sending command:\n' + JSON.stringify(srCommand));
    socket.send(JSON.stringify(srCommand));
    currentCommand = "speechRecognition";
    createNewLog();
    record();
}
// Stop directive
function stopSRRecording() {
  console.log("SESSION ID IS " + sessionlessId);
    ui_stopSRRecording();
    let srDirective = {
        type: "directive",
        command: {
            name: "speechRecognition",
            id: applicationStepId
        },
        directive: {
            name: "stop"
        }
    };

    if (!sessionless){
      srDirective.sessionId = sessionId
    } else {
      srDirective.sessionId = sessionlessId;
    }

    currentCommands.push(srDirective);
    console.log('Sending command:\n' + JSON.stringify(srDirective));
    socket.send(JSON.stringify(srDirective));
    stopRecording();
}
$(document).on('click', '#cancel_sr_button:not(.disabled)', function () {
    cancelSR();
    return false;
});
// Cancel directive
function cancelSR() {
    ui_stopSRRecording();
    let srDirective = {
        type: "directive",
        command: {
            name: "speechRecognition",
            id: applicationStepId
        },
        directive: {
            name: "cancel"
        }
    };


    if (!sessionless){
      srDirective.sessionId = sessionId
    } else {
      srDirective.sessionId = sessionlessId;
    }

    currentCommands.push(srDirective);
    console.log('Sending command:\n' + JSON.stringify(srDirective));
    socket.send(JSON.stringify(srDirective));
    stopRecording();
}

// Dynamic Vocabulary functions
$(document).on('click', '#upload_dv_btn', function () {
    uploadDynamicVocab();
    return false;
});
function uploadDynamicVocab() {
    var sessionLessParameters = {
        applicationKey : $('#applicationKey')[0].value,
        verificationCode : $('#verificationCode')[0].value,
        speechSynthesisCodec: $('#speechSynthesisCodec')[0].value,
        speechRecognitionCodec: $('#speechRecognitionCodec')[0].value
    };
    incrementStepId();
    let dynamicVocabularies = [];
    if ($('#vocab-tabs li').size() >= 1) {
        $('#vocab-tabs li').each(function () {
            let index = $(this).children('a').attr('href').replace("#vocab", "");
            if ($('vocab-name' + index + '').val() !== "") {
                let vocabulary;
                let id = $('#vocab-name' + index + '').val();
                let type = $('#vocab-type' + index + '').val();
                let data = $('#vocab-data' + index + '').val();
                if (type === "application/x-webapi-wordset") {
                    vocabulary = {
                        id: id,
                        type: type,
                        body: JSON.parse(data)
                    };
                } else {
                    vocabulary = {
                        id: id,
                        type: type,
                        url: data
                    };
                }
                dynamicVocabularies.push(vocabulary);
            }
        });
    }
    let lExtraParameters = $('#dynamicVocabularyExpertParams')[0].value;
    if (lExtraParameters.length > 0) {
        extraParameters = JSON.parse(lExtraParameters);
    }

    let parameters = {
                         dynamicVocabularies: dynamicVocabularies
                     };
    Object.keys(extraParameters).forEach(function(key)
    {
        parameters[key] = extraParameters[key]
    });
    extraParameters = {};

    let uploadDVCommand = {
        type: "command",
        command: {
            name: "uploadDynamicVocabulary",
            id: applicationStepId,
            parameters: parameters
        }
    };

    if (sessionless){
        uploadDVCommand.command.parameters.sessionParameters = sessionLessParameters;
    } else {
        uploadDVCommand.sessionId = sessionId;
    }
    currentCommands.push(uploadDVCommand);
    console.log("Uploading dynamic vocabularies: \n\n" + JSON.stringify(uploadDVCommand, null, 2));
    socket.send(JSON.stringify(uploadDVCommand));
    currentCommand = "UploadDynamicVocabulary";
    createNewLog();
}
$(document).on('click', '#btnAddVocabulary', function () {
    createNewVocabularyTab();
    return false;
});
function createNewVocabularyTab() {
    let vocabularyNumber = $('#vocab-tabs li').size() + 1;
    // create new tab
    $('<li role="presentation"><a href="#vocab' + vocabularyNumber + '" aria-controls="vocab' + vocabularyNumber + '" role="tab" data-toggle="tab">Vocabulary ' + vocabularyNumber + ' <button class="close" title="Delete this vocabulary" type="button">\u00D7</button></a></li>').appendTo('#vocab-tabs');
    // create new tab content
    $('<div role="tabpanel" class="tab-pane active" id="vocab' + vocabularyNumber + '"><div class="form-group"><label for="vocab-name' + vocabularyNumber + '" class="col-sm-2 control-label">Vocabulary Name</label><div class="col-sm-3"><input type="text" class="form-control" id="vocab-name' + vocabularyNumber + '"></div></div><br/><div class="form-group"><label for="vocab-type' + vocabularyNumber + '" class="col-sm-2 control-label">Type</label><div class="col-sm-3"><select class="form-control" id="vocab-type' + vocabularyNumber + '"><option value="application/x-webapi-wordset" selected="selected">wordset </option><option value="application/x-webapi-wordset-pkg">package</option><option value="application/x-webapi-domainlm">domainlm</option></select></div></div><br/><div class="form-group"><label for="vocab-data' + vocabularyNumber + '" class="col-sm-2 control-label">Body/Url</label><div class="col-sm-6"><textarea class="form-control" rows="3" id="vocab-data' + vocabularyNumber + '" placeholder="paste or type your json or package url here..."></textarea></div></div><div class="form-group"><label for="helpBlock' + vocabularyNumber + '" class="col-sm-2 control-label"></label><div class="col-sm-6"><span id="helpBlock' + vocabularyNumber + '" class="help-block">ex: {"place-name":[{"literal":"Los Angeles","spoken":["l a","los angeles"]},{"literal":"San Francisco"}],"hockey-team":[{"literal":"Montreal Canadiens","spoken":["montreal canadiens","habs"]},{"literal":"Boston Bruins"}]}</span></div></div></div>').appendTo('#collapseDynamicVocab .tab-content');
    // force clear cashed values and set them default
    $('#vocab-name' + vocabularyNumber + '').val("");
    $('#vocab-type' + vocabularyNumber + '').val("application/x-webapi-wordset");
    $('#vocab-data' + vocabularyNumber + '').val("");
    $('#vocab-tabs a:last').tab('show');
}
function nleCommand() {
    ui_interpretation();
    let input = document.getElementById("interpretationInput").value;
    let activeWordsets = [];
    let array = $("#int_dv_array").tagit("assignedTags");
    for (let i = 0; i < array.length; i++) {
        if(array[i].length > 0) {
                activeWordSets.push(array[i]);
        }
    }



    let parameters = {
        interpretationData: input
    };

    if (activeWordsets.length > 0){
        parameters.activeDynamicVocabularySets = activeWordsets;
    }


    let lExtraParameters = $('#nleExpertParams')[0].value;
    if (lExtraParameters.length > 0) {
        extraParameters = JSON.parse(lExtraParameters);
    }

    Object.keys(extraParameters).forEach(function(key)
    {
        parameters[key] = extraParameters[key]
    });
    extraParameters = {};

    let nleCommand = {
        type: "command",
        sessionId: sessionId,
        command: {
            name: "interpretation",
            id: applicationStepId,
            parameters: parameters
        }
    };

    currentCommands.push(nleCommand);

    socket.send(JSON.stringify(nleCommand));

    console.log("Sending Command " + JSON.stringify(nleCommand));

    currentCommand = "interpretationCommand";


}
$(document).on('click', '#vocab-tabs li a .close', function () {
    let tabId = $(this).parents('li').children('a').attr('href');
    $(this).parents('li').remove('li');
    $(tabId).remove();
    if ($('#vocab-tabs a:last')) {
        $('#vocab-tabs a:last').tab('show');
    }
    return false;
});
