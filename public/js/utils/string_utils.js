function uploadDVnameChanged() {
    var name = document.getElementById("upload_dv_name").value;
    if (name === "other") {
        $("#otherDVname")[0].removeAttribute("style");
    } else {
        $("#otherDVname")[0].setAttribute("style", "display:none;");
    }
}

function setOnlyActive(navbar_id) {
    var lis;
    if (navbar_id === "navbar_commands") {
        lis = ["li.secondaryTab"];
    }
    else {
        return;
    }
    // remove the 'active' keyword of the class of all <li>
    var len = lis.length;
    for (var i=0; i<len; i++) {
        var value = $(lis[i]).attr("class").replace("active", "");
        $(lis[i]).attr("class", value);
    }
}

function textChangedList(inputIds, buttonId){
    for(var i = 0; i < inputIds.length; i++){
        if ($(inputIds[i]).val().trim() === "") {
            return $(buttonId).addClass("disabled");
        }
    }
    return $(buttonId).removeClass("disabled");
}

function textChanged(inputId, buttonId) {
    inputIds = ['#'+inputId];
    buttonId = "#"+buttonId;
    textChangedList(inputIds, buttonId);
}

function fixLineBreaks(string) {
    var replaceWith = '\r\n';

    if (string.indexOf('\r\n') > -1) {  	// Windows encodes returns as \r\n
        // Good nothing to do
    } else if (string.indexOf('\n') > -1) { 	// Unix encodes returns as \n
        string = replaceAll(string, '\n', replaceWith);
    } else if (string.indexOf('\r') > -1) { 	// Macintosh encodes returns as \r
        string = replaceAll(string, '\r', replaceWith);
    }
    return string;
}

function replaceAll(string, find, replace) {
    return string.replace(new RegExp(find, 'g'), replace);
}