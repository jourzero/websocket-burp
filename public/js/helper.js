var hexChars = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
function int8toHex(i) {
        var yx = (i >> 4) & 0xf;
        var xy = i & 0xf;
        return hexChars[yx] + hexChars[xy];
}
function int16toHex(i) {
        var yxxx = (i >> 12) & 0xf;
        var xyxx = (i >> 8) & 0xf;
        var xxyx = (i >> 4) & 0xf;
        var xxxy = i & 0xf;
        return hexChars[xxyx] + hexChars[xxxy] + hexChars[yxxx] + hexChars[xyxx];
}
// Logging functions
function getLogs() {
    if ($('#logId').val() === "all") {
        $('#log_commands').text(JSON.stringify(commands, null, 4));
        $('#log_results').text(JSON.stringify(results, null, 4));
    } else {
        let logIndex = $('#logId').val() - 1;
        $('#log_commands').text(JSON.stringify(commands[logIndex], null, 4));
        $('#log_results').text(JSON.stringify(results[logIndex], null, 4));
    }
}
function incrementStepId() {
   if (!applicationStepId.includes("responses/")) {
      let newStepId = parseInt(applicationStepId) + 1;
      applicationStepId = newStepId.toString();
      $('.applicationStepId').val(applicationStepId);
    }
}
function createNewLog() {
    $('<option value="' + applicationStepId + '">' + applicationStepId + ': ' + currentCommand + '</option>').appendTo('#logId');
}


function ArrayBufferToString(buffer) {
    return BinaryToString(String.fromCharCode.apply(null, Array.prototype.slice.apply(new Uint8Array(buffer))));
}

function StringToArrayBuffer(string) {
    return StringToUint8Array(string).buffer;
}

function BinaryToString(binary) {
    var error;

    try {
        return decodeURIComponent(escape(binary));
    } catch (_error) {
        error = _error;
        if (error instanceof URIError) {
            return binary;
        } else {
            throw error;
        }
    }
}

function StringToBinary(string) {
    var chars, code, i, isUCS2, len, _i;

    len = string.length;
    chars = [];
    isUCS2 = false;
    for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        code = String.prototype.charCodeAt.call(string, i);
        if (code > 255) {
            isUCS2 = true;
            chars = null;
            break;
        } else {
            chars.push(code);
        }
    }
    if (isUCS2 === true) {
        return unescape(encodeURIComponent(string));
    } else {
        return String.fromCharCode.apply(null, Array.prototype.slice.apply(chars));
    }
}
function StringToUint8Array(string) {
    var binary, binLen, buffer, chars, i, _i;
    binary = StringToBinary(string);
    binLen = binary.length;
    buffer = new ArrayBuffer(binLen);
    chars  = new Uint8Array(buffer);
    for (i = _i = 0; 0 <= binLen ? _i < binLen : _i > binLen; i = 0 <= binLen ? ++_i : --_i) {
        chars[i] = String.prototype.charCodeAt.call(binary, i);
    }
    return chars;
}