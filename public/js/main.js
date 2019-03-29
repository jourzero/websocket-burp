// Instance host
let host = "webapi.domain.mobi";

// jetty-Latest
let port = 443;
let fullArray = new Uint8Array(0);
let speexRecording = 0; //Different frames of the speex recording

// socket path
// let socketPath = "webapi-platform-1.0.0-SNAPSHOT/websocket";
let socketPath = "webapi-platform/websocket";
// Audio handlers
//opus decoder

// TTS audio
let audioToPlay = new Int16Array(0);
// The current command (used when receiving endOfSpeech and startOfSpeech)
let currentCommand;
// Current session id
let sessionId;
// // Application step id / Command id
let applicationStepId = "1";
// Session parameters
// let applicationKey = "applicationKey";
let applicationKey = "companyName_appName";
let verificationCode = "1111111112222222223333333334444444455555555556666666667777777777";
let speechSynthesisCodec = "pcm_16_8k";

let speechRecognitionCodec = "pcm_16_8k";

// Extra parameters
let extraParameters = {};

// The WebSocket
let socket;
// Logs
let commands = [];
let results = [];
let currentCommands = [];
let currentResults = [];

function adaptiveCheck() {
    if (document.getElementById("sr_adaptive").checked) {
        document.getElementById("ifAdaptive").style.display = "block";
    } else document.getElementById("ifAdaptive").style.display = "none";
}
