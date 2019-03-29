$(document).ready(function () {
    $('.secondaryTab').hide();
});

function ui_startSession() {
    $('#label-start-end').text('Communicating with the server...');
}

function ui_socketOpened() {
  $("#button-websocket")
  .toggleClass('btn-primary btn-danger')
  .text("Websocket Opened")
  .attr('onclick', 'closeSocket()')
  .blur();
}

function ui_endSession() {
    $('#label-start-end').text('Communicating with the server...');
}

function ui_sessionlessChecked() {
    toggleSessionless();
}

function ui_socketHasOpened() {
  $('#label-start-end').text('You currently have an active websocket session.');
  $('#button-start-end').toggleClass('btn-primary btn-danger').text('Close Websocket').attr('onclick','closeSocket()');

  $('#host')[0].setAttribute("readonly", "");
  $('#port')[0].setAttribute("readonly", "");
  $('#api_version')[0].setAttribute("disabled", "");
  $('#applicationKey')[0].setAttribute("readonly", "");
  $('#verificationCode')[0].setAttribute("readonly", "");

  $('.secondaryTab').fadeIn();
}

function ui_sessionHasStarted() {
    $('#button-start-end')
        .toggleClass('btn-primary btn-danger')
        .text("End session")
        .attr('onclick', 'endSession()')
        .blur();
    $('#label-start-end').text('You currently have an active session.');

    $('#host')[0].setAttribute("readonly", "");
    $('#port')[0].setAttribute("readonly", "");
    $('#api_version')[0].setAttribute("disabled", "");
    $('#applicationKey')[0].setAttribute("readonly", "");
    $('#verificationCode')[0].setAttribute("readonly", "");

    $('.secondaryTab').fadeIn();
}

function ui_sessionHasEnded() {
    $('#button-start-end')
        .toggleClass('btn-primary btn-danger')
        .text("Start session")
        .attr('onclick', 'startSession()')
        .blur();
    $('#label-start-end').text('You currently have no active session.');

    $('#host')[0].removeAttribute("readonly");
    $('#port')[0].removeAttribute("readonly");
    $('#api_version')[0].removeAttribute("disabled");
    $('#applicationKey')[0].removeAttribute("readonly");
    $('#verificationCode')[0].removeAttribute("readonly");

    $('.secondaryTab').fadeOut();
}

// TTS ui functions.

function ui_ttsStarted() {
    $('#playaudio_results').text("");
    $('#playaudio_button')
        .toggleClass('btn-primary btn-danger')
        .text("Stop")
        .attr('onclick', 'stopTTS()')
        .blur();
}

function ui_ttsStopped() {
    $('#playaudio_button')
        .toggleClass('btn-primary btn-danger')
        .text("Play audio")
        .attr('onclick', 'playAudio()')
        .blur();
}

// Speech recognition ui functions.

function ui_startSRRecording() {
    $('#sr_results').text("");
    $('#sr_engine')[0].setAttribute("disabled", "");

    $('#sr_button')
        .toggleClass('btn-primary btn-danger')
        .text("Stop")
        .attr('onclick', 'stopSRRecording()')
        .blur();
    $('#cancel_sr_button').removeClass("disabled").addClass("btn-danger");
}

function ui_stopSRRecording() {
    $('#sr_button')
        .removeClass("btn-danger")
        .addClass("btn-primary")
        .text("Start recording")
        .attr('onclick', 'startSRRecording()')
        .blur();
    $('#cancel_sr_button').addClass("disabled").removeClass("btn-danger");

    $('#sr_engine')[0].removeAttribute("disabled");
}

function ui_interpretation() {
    $("#int_span").toggleClass("glyphicon glyphicon-refresh glyphicon-refresh-animate");
}

function ui_interpretationEnded() {
    $("#int_span").removeClass();

}
