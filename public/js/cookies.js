var cookieCrumb;

function setCookieString(cookieName, cookieValue, daysUntilExpiration) {
    var expirationDate = new Date(
        new Date().getTime() + daysUntilExpiration * 24 * 60 * 60 * 1000
    ).toUTCString(); // current time plus daysUntilExpiration, e.g. "Wed, 07 Mar 2018 19:45:10 GMT"
    var expiresAttribute = "expires=" + expirationDate;

    document.cookie = cookieName + "=" + cookieValue + ";" + expiresAttribute + ";path=/";
}

function setAllCookies() {
    var inputs = document.querySelectorAll("input[type=text]");
    for (var i = 0; i < inputs.length; i += 1) {
        setCookieString(getCookiePrefix() + inputs[i].id, inputs[i].value, 7);
    }

    $("select").each(function(index) {
        setCookieString(getCookiePrefix() + $(this).attr("id"), $(this).val(), 7);
    });

    localStorage.setItem("wsMsg", $("#wsMsg").val());
}

function getAllCookies() {
    var inputs = document.getElementsByTagName("input");
    for (var i = 0; i < inputs.length; i += 1) {
        if (getCookie(getCookiePrefix() + inputs[i].id) != null) {
            cookieCrumb = getCookie(getCookiePrefix() + inputs[i].id);

            if (cookieCrumb) {
                document.getElementById(inputs[i].id).value = cookieCrumb;
            }
        }
    }

    $("select").each(function(index) {
        if (getCookie(getCookiePrefix() + $(this).attr("id"))) {
            $(this).val(getCookie(getCookiePrefix() + $(this).attr("id")));
        }
    });
}

function eraseCookie(name) {
    setCookieString(name, "", -1);
}

function reset() {
    // REMOVE COOKIES
    document.cookie.split(";").forEach(function(cookie) {
        if (cookie.trim().startsWith(getCookiePrefix())) {
            document.cookie = cookie
                .trim()
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        }
    });

    location.reload(true);
}

function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2)
        return parts
            .pop()
            .split(";")
            .shift();
}

function getCookiePrefix() {
    return window.location.pathname + "::";
}
