/**
 * Created by Harikrishnan on 12/5/14.
 */
var overlayCount = 0;

function addWaitingOverlay() {
    if (overlayCount == 0) {
        var overlay = document.createElement("div");
        overlay.setAttribute("id", "overlay");
        overlay.setAttribute("class", "overlay");
        document.body.appendChild(overlay);
    }
    overlayCount++;
}

function removeWaitingOverlay() {
    overlayCount--;
    if (overlayCount <= 0) {
        document.body.removeChild(document.getElementById("overlay"));
    }
}

function getAsStr (element){
    var str = element;
    if (typeof element == "number"){
        str = element + "";
    }
    else if (typeof element != "string"){
        str = element.toString();
    }
    return str;
}
function isEmptyString(str) {
    if (typeof str != "string"){
        str = getAsStr(str);
    }
    if (str == undefined)
    {
        return false;
    }
    return (!str || /^\s*$/.test(str) || str.length === 0 || !str.trim() || str.trim().length === 0 );
}

function getURLParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function closeView() {
    window.open('', '_self', '');
    window.close();
}

function isLoggedIn(checkServer) {
    var session = $.cookie(consts.SESSION_STORE_NAME) == undefined ? undefined : JSON.parse($.cookie(consts.SESSION_STORE_NAME));
    return session != undefined;
}

function getUser() {
    var cookie = $.cookie(consts.SESSION_STORE_NAME);
    if (cookie == undefined) {
        return undefined;
    }
    else {
        return JSON.parse(cookie);
    }
}
function setUser(user) {
    $.cookie(consts.SESSION_STORE_NAME, JSON.stringify(user));
}

function signout() {
    addWaitingOverlay();
    doPost("/signout", {}, function (resp) {
        if (resp.status != 200) {
            console.log(resp);
        }
        removeWaitingOverlay();
        window.location = window.actualSite + "/";
    }, function (err) {
        console.log(err);
        removeWaitingOverlay();
        window.location = window.actualSite + "/";
    });
    $.removeCookie(consts.SESSION_STORE_NAME);
}

function getNewSalt() {
    var range = {min: 1000, max: 9999};
    return Math.round((Math.random() * (range.max - range.min)) + range.min);
}

function signin(email, password) {
    var user = {
        emailid: email,
        password: password
    };
    addWaitingOverlay();
    doPost("/getSalt", {email: user.emailid}, function (resp) {
        removeWaitingOverlay();
        if (resp.status != 200) {
            bootbox.alert("Invalid username or password. Please try again.");
            console.log(resp);
        }
        else {
            user.md5_secret = MD5(resp.salt + ":" + user.password);
            delete user.password;
            doPost("/signin", user, function (resp) {
                if (resp.status == 401) {
                    bootbox.alert("Invalid username or password. Please try again.");
                }
                else if (resp.status == 200) {
                    setUser(resp.user);
                    var redir = getURLParameterByName("redir");
                    if (redir == null) {
                        redir = "/console";
                    }
                    else {
                        redir = "/" + redir;
                    }
                    window.location.assign(window.actualSite + redir);
                }
                else {
                    bootbox.alert("Server Error: " + resp.status + "(" + resp.msg + "). Please try again.");
                    console.log(resp);
                }
            }, function (err) {
                bootbox.alert("Server Error: " + err.error);
            });
        }
    }, function (err) {
        removeWaitingOverlay();
        bootbox.alert("Server Error: " + err.error);
    });
}

function getAssocArrayLength(obj) {
    return Object.keys(obj).length;
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function isNumber(s) {
    return /^\d+(\.\d+)?$/.test(s);
}

function signup(id, name, email, password) {
    var random = getNewSalt();
    var user = {
        id: id,
        name: name,
        email: email,
        password: password
    };
    user.salt = random;
    user.md5_secret = MD5(user.salt + ":" + user.password);
    delete user.password;
    addWaitingOverlay();
    doPost("/signup", user, function (resp) {
        removeWaitingOverlay();
        if (resp.status != 200) {
            bootbox.alert("Server Error: " + resp.status + "(" + resp.msg + "). Please try again later.", function () {
                window.location = window.actualSite + "/";
            });
            console.log(resp);
        }
        else {
            bootbox.alert("Thank you for registering with us. From now on you can login with your email ID and password.", function () {
                $("#emailid").val($("#email").val());
                $("#password").val($("#signuppassword").val());
                $("#signin").click();
            });
        }
    }, function (err) {
        removeWaitingOverlay();
        bootbox.alert("Server Error: " + err.error);
    });
}

function isThereInDataSet(dataset, id){
    for (var i = 0; i < dataset.length; i++) {
        if (dataset[i].DT_RowId == id) {
            return true;
        }
    }
    return false;
}

function removeFromDataset(dataset, id) {
    for (var i = 0; i < dataset.length; i++) {
        if (dataset[i].DT_RowId == id) {
            dataset.splice(i, 1);
            break;
        }
    }
}

function updateDataSet(dataset, id, index, value) {
    for (var i = 0; i < dataset.length; i++) {
        if (dataset[i].DT_RowId == id) {
            dataset[i][index] = value;
            break;
        }
    }
}

function getFromDataSet(dataset, id, index) {
    for (var i = 0; i < dataset.length; i++) {
        if (dataset[i].DT_RowId == id) {
            return dataset[i][index];
        }
    }
    return null;
}

var base64 = {
    keyStr: "ABCDEFGHIJKLMNOP" +
        "QRSTUVWXYZabcdef" +
        "ghijklmnopqrstuv" +
        "wxyz0123456789+/" +
        "=",
    encode: function (input) {
        input = escape(input);
        var output = "";
        var chr1, chr2, chr3 = "";
        var enc1, enc2, enc3, enc4 = "";
        var i = 0;
        do {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output = output +
                base64.keyStr.charAt(enc1) +
                base64.keyStr.charAt(enc2) +
                base64.keyStr.charAt(enc3) +
                base64.keyStr.charAt(enc4);
            chr1 = chr2 = chr3 = "";
            enc1 = enc2 = enc3 = enc4 = "";
        } while (i < input.length);
        return output;
    },

    decode: function (input) {
        var output = "";
        var chr1, chr2, chr3 = "";
        var enc1, enc2, enc3, enc4 = "";
        var i = 0;
        var base64test = /[^A-Za-z0-9\+\/\=]/g;
        if (base64test.exec(input)) {
            alert("There were invalid base64 characters in the input text.\n" +
                "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                "Expect errors in decoding.");
        }
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        do {
            enc1 = base64.keyStr.indexOf(input.charAt(i++));
            enc2 = base64.keyStr.indexOf(input.charAt(i++));
            enc3 = base64.keyStr.indexOf(input.charAt(i++));
            enc4 = base64.keyStr.indexOf(input.charAt(i++));
            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;
            output = output + String.fromCharCode(chr1);
            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }
            chr1 = chr2 = chr3 = "";
            enc1 = enc2 = enc3 = enc4 = "";
        } while (i < input.length);
        return unescape(output);
    }
};

var poll = {
    poller: new ShelloidPoller("POST", window.actualSite + "/poll"),
    pollids: [],
    addLongPollHandler: function (channel, lastUpdateIdParam, successHandler) {
        var errHandler = function (channel, err, lastUpdateId) {
            console.log("Poll error (" + channel + "): ", err);
            setTimeout(function () {
                if (poll.pollids[channel] != undefined && poll.pollids[channel] != null) // for avoiding conflicts with remove just before timeout
                {
                    addPoll(lastUpdateId);
                    console.log("Retrying poll....");
                }
                else {
                    console.log("Not retrying poll....");
                }
            }, 3000);
        };
        var addPoll = function (lastUpdateId) {
            if (poll.pollids[channel] != undefined && poll.pollids[channel] != null) {
                poll.removeLongPollHandler(channel);
            }
            poll.pollids[channel] = poll.poller.add(channel, lastUpdateId, successHandler, errHandler);
        };
        addPoll(lastUpdateIdParam);
    },
    removeLongPollHandler: function (channel) {
        if (poll.pollids[channel] != undefined || poll.pollids[channel] != null) {
            poll.poller.remove(channel, poll.pollids[channel]);
            delete poll.pollids[channel];
        }
    }
};