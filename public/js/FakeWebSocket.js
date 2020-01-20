var socket;
let sStatus = "Unknown";
let sessionless = true;
let autoPollInterval = 5 * 1000;
let autoPollIntervalID;
let wsQueueing;
let autoUpdate;
let autoPoll;
let autoPollActive = false;
let reqDelay = 500;
let wsUrl;
let wsMsg;

$.ajaxSetup({ cache: false });

class FakeWebSocket {
    constructor(url) {
        console.info("Sending websocket open request to", url);
        let server = {};
        server.url = new URL(url);
        server.queueing = wsQueueing;
        this.sendPostRequest("/ws/open", JSON.stringify(server));
    }

    send(msg) {
        console.info("Sending message", msg);
        socket.sendPostRequest("/ws/send", msg);
    }

    close() {
        console.info("Sending websocket close request");
        this.sendPostRequest("/ws/close", {});
    }

    checkStatus() {
        console.info("Sending websocket status request");
        $.getJSON("/ws/check", function(data) {
            if (data !== undefined && data.status !== undefined) {
                $("#wsStatus").html(data.status);
                /*
                let statusText = new String(data.status);
                if (statusText.startsWith("Open")) {
                    onopen();
                } else if (statusText.startsWith("Closed")) {
                    onclose();
                }
                */
            }
        });
    }

    getStats() {
        console.info("Sending websocket stats request");
        $.getJSON("/ws/stats", function(data) {
            if (typeof data === "undefined") data = "";
            else if (typeof data === "object") data = JSON.stringify(data);
            $("#wsStats").html(data);
        });
    }

    receive() {
        console.info("Sending websocket receive request");
        $.getJSON("/ws/receive", function(data) {
            if (typeof data === "undefined") data = "";
            else if (typeof data === "object") data = JSON.stringify(data);
            else if (typeof data !== "string")
                data = "(" + typeof data + " data)";
            $("#wsData").html(data);
            console.info("Received: %s", data);
        });
    }
    postRespHandler(data, textStatus, jqXHR) {
        console.debug("Handling POST response");
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
                //onmessage(event);
            }
            // If it's a redirect, we probably got here right after sending a message. In any case, follow the redirect.
            else if (data.redirect) {
                console.debug("Redirected!", JSON.stringify(data));
                sendGetRequest(data.redirect);
            } else {
                // If the websocket was just opened, call onopen() after a 5 sec. wait.
                if (data.op !== undefined && data.op === "open") {
                    setTimeout(onopen, 2000);
                } else if (data.op !== undefined && data.op !== "open") {
                    console.debug("Data:", JSON.stringify(data));
                } else if (!wsQueueing) {
                    console.debug("Received data:", JSON.stringify(data));
                    $("#wsData").html(JSON.stringify(data));
                } else {
                    console.debug(
                        "Got here with no op data:",
                        JSON.stringify(data)
                    );
                }
            }
        } catch (err) {
            console.error("Exception caught:", err);
        }
    }

    sendPostRequest(url, msg) {
        console.debug("Sending POST request to", url, ":", msg);
        $.ajax({
            url: url,
            type: "POST",
            data: msg,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: this.postRespHandler
        });
    }

    sendGetRequest(url) {
        console.debug("Sending GET request to", url);
        $.getJSON(url, function(data) {
            try {
                if (data !== undefined) {
                    if (data.status !== undefined)
                        $("#wsStatus").html(data.status);
                    else {
                        let event = {};
                        event.data = JSON.stringify(data);
                        //onmessage(event);
                    }
                }
            } catch (err) {
                console.error("Exception caught:", err);
            }
        });
    }
} // class FakeWebSocket

function openWS() {
    wsUrl = $("#wsUrl").val();
    wsQueueing = $("#wsQueueing").prop("checked");
    console.debug("Opening WebSocket at", wsUrl);
    socket = new FakeWebSocket(wsUrl);
}

function sendToWS() {
    let delay = 0;
    let messages = $("#wsMsg")
        .val()
        .split("\n");
    messages.forEach(msg => {
        if (msg != "" && !msg.startsWith("#") && !msg.startsWith("//")) {
            window.setTimeout(socket.send, delay, msg);
            //socket.send(msg);
            delay += reqDelay;
        }
    });
}

function checkWS() {
    console.debug("Checking status.");
    socket.checkStatus();
}

function statsWS() {
    console.debug("Getting stats.");
    socket.getStats();
}

function receiveWS() {
    if (typeof socket === "undefined") return;
    console.debug("Receiving one WebSocket message.");
    socket.receive();
    if (autoUpdate) {
        checkWS();
        statsWS();
    }
}

function closeWS() {
    console.debug("Closing WebSocket connection.");
    socket.close();

    // Update UI if autoUpdate is enabled
    if (autoUpdate) {
        checkWS();
        statsWS();
    }
    //onclose();
    setButtonsBeforeOpen();
}

function onopen() {
    console.debug("WebSocket connection opened.");
    setButtonsAfterOpen();
    getSettings();

    if (autoUpdate) {
        checkWS();
        statsWS();
    }
}

function onclose() {
    setButtonsBeforeOpen();

    if (autoUpdate) {
        checkWS();
        statsWS();
    }
}

// Re-read the values of checkboxes
function getSettings() {
    wsMsg = $("#wsMsg").val();
    wsQueueing = $("#wsQueueing").prop("checked");
    autoUpdate = $("#autoUpdate").prop("checked");
    autoPoll = $("#autoPoll").prop("checked");
}

// Save All Values
function saveAllValues() {
    console.log("Saving all UI values to localStorage");
    localStorage.setItem("wsMsg", $("#wsMsg").val());
    localStorage.setItem("wsUrl", $("#wsUrl").val());
    localStorage.setItem("wsQueueing", $("#wsQueueing").prop("checked"));
    localStorage.setItem("autoUpdate", $("#autoUpdate").prop("checked"));
    localStorage.setItem("autoPoll", $("#autoPoll").prop("checked"));
}

// Restore All Values
function restoreAllValues() {
    console.log("Restoring all UI values from localStorage");
    $("#wsUrl").val(localStorage.getItem("wsUrl"));
    $("#wsMsg").val(localStorage.getItem("wsMsg"));
    $("#wsQueueing").prop(
        "checked",
        localStorage.getItem("wsQueueing") === "true"
    );
    $("#autoUpdate").prop(
        "checked",
        localStorage.getItem("autoUpdate") === "true"
    );
    $("#autoPoll").prop("checked", localStorage.getItem("autoPoll") === "true");
}

function setButtonsBeforeOpen() {
    $("#button-open-ws").attr("disabled", null);
    $("#button-check-ws").attr("disabled", "");
    $("#button-stats-ws").attr("disabled", "");
    $("#button-send-ws").attr("disabled", "");
    $("#button-receive-ws").attr("disabled", "");
    $("#button-close-ws").attr("disabled", "");
}

function setButtonsAfterOpen() {
    $("#button-open-ws").attr("disabled", "");
    $("#button-check-ws").attr("disabled", null);
    $("#button-stats-ws").attr("disabled", null);
    $("#button-send-ws").attr("disabled", null);
    $("#button-receive-ws").attr("disabled", null);
    $("#button-close-ws").attr("disabled", null);
}

function setupAutoPoll() {
    // Poll for new messages if autoPoll is enabled
    if (autoPoll && !autoPollActive) {
        console.log("Activating autopoll");
        autoPollActive = true;
        autoPollIntervalID = window.setInterval(receiveWS, autoPollInterval);
    }

    if (!autoPoll && autoPollActive) {
        // Stop autopoll
        console.log("Deactivating autopoll");
        autoPollActive = false;
        window.clearInterval(autoPollIntervalID);
    }
}

restoreAllValues();
getSettings();
setButtonsBeforeOpen();
setupAutoPoll();
