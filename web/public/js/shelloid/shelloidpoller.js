function ShelloidPoller(method, url) {
    this.subscriptions = {};
    this.ajaxRequest = undefined;
    this.channels = [];
    this.method = method;
    this.lastUpdateId = -1;
    this.url = url;
}
/* successCallback(channel, message), errorCallback(channel, message) once error occurred, it wont retry */
ShelloidPoller.prototype.add = function (channel, lastUpdateId, successCallback, errorCallback) {
    this.subscriptions[channel] = {successCallback: successCallback, errorCallback: errorCallback};
    if (this.ajaxRequest) {
        abortPollRequest(this.ajaxRequest);
    }
    if (this.channels[channel] == undefined) {
        this.channels.push(channel);
        if(this.lastUpdateId == -1) {
            this.lastUpdateId = lastUpdateId;
        }
        this.ajaxRequest = createRequest(this, this.method, this.url, {channel: this.channels, lastUpdateId: this.lastUpdateId});
    }
    return true;
};

ShelloidPoller.prototype.remove = function (ch) {
    if (this.subscriptions[ch]) {
        delete this.subscriptions[ch];
        delete this.channels.splice(this.channels.indexOf(ch), 1);
    }
    if (this.ajaxRequest) {
        abortPollRequest(this.ajaxRequest);
    }
    if (this.channels.length > 0) {
        this.ajaxRequest = createRequest(this, this.method, this.url, {channel: this.channels, lastUpdateId: this.lastUpdateId});
    }
};

function processSuccessMessage(poller, channel, message) {
    var fn = function (ch, msg){
        var subs = poller.subscriptions[ch];
        if ((subs != undefined) && (subs != null)) {
            subs.successCallback(ch, msg);
        }
    };

    if (message.from != undefined && message.from == "db"){
        var max = -1;
        if (message.list != undefined) {
            message.list.forEach(function (value, index) {
                if (value.id > max) {
                    max = value.id;
                }
                var channel = value.updateType + ":" + value.refId;
                delete value.id;
                delete value.updateType;
                value.from = "db";
                fn(channel, value);
            });
        }
        if (max > poller.lastUpdateId){
            poller.lastUpdateId = max;
        }
    }
    else {
        fn(channel, message);
    }
    poller.ajaxRequest = createRequest(poller, poller.method, poller.url, {channel: poller.channels, lastUpdateId: poller.lastUpdateId});
}

function processTimeoutMessage(poller) {
    //console.log("Timeout occurred. Retrying...");

    if (getUser() != undefined) {
        doPost("/isSessionActive", {}, function (resp) {
            if (resp.sessionActive == false) {
                window.location = window.actualSite + "/?msgId=1";
            }
        });
        setTimeout(function () {
            poller.ajaxRequest = createRequest(poller, poller.method, poller.url, {channel: poller.channels, lastUpdateId: poller.lastUpdateId});
        },3000);
    } else {
        window.location = window.actualSite + "/?msgId=1";
    }
}

function processErrorMessage(poller, channel, textStatus, errorThrown) {
    //console.log("Poller Err (" + channel + "): ", textStatus, errorThrown);
    if (poller.subscriptions[channel].errorCallback != undefined) {
        poller.subscriptions[channel].errorCallback(channel, textStatus + ":" + errorThrown, poller.lastUpdateId);
    }
    poller.remove(channel);
}

function abortPollRequest(ajax){
    window.abortPollRequestVar = true;
    ajax.abort();
}

function createRequest(poller, method, url, data) {
    if (poller.ajaxRequest) {
        abortPollRequest(poller.ajaxRequest);
    }
    return $.ajax({
        type: method,
        url: url,
        dataType: "json",
        data: data,
        timeout: 10000,
        success: function (msg, textStatus, jqXHR) {
            if (msg.channel == undefined) {
                data.channel.forEach(function (value, index) {
                    processSuccessMessage(poller, value, msg);
                });
            }
            else {
                processSuccessMessage(poller, msg.channel, msg);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            if (textStatus == "timeout") {
                processTimeoutMessage(poller);
            }
            else if (textStatus != "abort") {
                if (errorThrown.indexOf("Time-out") > 0) {
                    processTimeoutMessage(poller);
                } else {
                    if (errorThrown == "Forbidden"){
                        window.location = window.actualSite + "/?msgId=1"
                    }
                    else {
                        data.channel.forEach(function (value, index) {
                            processErrorMessage(poller, value, textStatus, errorThrown);
                        });
                    }
                }
            } else if(!window.abortPollRequestVar){
                data.channel.forEach(function (value, index) {
                    processErrorMessage(poller, value, textStatus, errorThrown);
                });
            }else{
                window.abortPollRequestVar = false;
            }
        }
    });
}
