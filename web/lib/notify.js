var subscriptions = {};//channel name : {callback fn, timestamp, timeout fn, if timeout is not specified it wont be timed out, user has to explicitly remove the subscribe}

var redis = null;
var scheduledForRemove = [];

exports.init = function () {
    redis = global.subscribeRedisClient;
    redis.on('message', process_message);
    setTimeout(process_timeout, config.NOTIFY_TIMEOUT * 1000);
};

exports.notify_add = function (channels, callback, timeoutCallBack) {
    var sub = {callback: callback, ts: new Date().valueOf(), timeout: timeoutCallBack, registerInfo: []};
    var add = function (ch) {

        if ((typeof subscriptions[ch])  == 'undefined') {
            subscriptions[ch] = [];
        }
        var idx = subscriptions[ch].push(sub) - 1;
        sub.registerInfo.push({ch: ch, index: idx});
        redis.subscribe(ch);
    };
    if (typeof channels == "string") {
        add(channels);
    }
    else {
        channels.forEach(function (ch) {
            add(ch);
        });
    }
};

exports.notify_remove = function (channel, index, noRecurse) {
    var fn = function (ch){
        if (subscriptions[ch]) {
            var sub = subscriptions[ch][index];
            if (sub != null && !noRecurse) {
                sub.registerInfo.forEach(function (regInfo) {
                    if(regInfo.ch != ch) {
                        exports.notify_remove(regInfo.ch, regInfo.index, true);
                    }
                });
            }
            if (subscriptions[ch]) {
                subscriptions[ch].splice(index, 1);
                if (subscriptions[ch] == undefined || subscriptions[ch].length == 0) {
                    redis.unsubscribe(ch);
                    delete subscriptions[ch];
                }
            }
        }
    };
    if (typeof channel == "string") {
        fn(channel);
    }
    else {
        channel.forEach(function (value, index){
            fn(value);
        });
    }

};

function process_message(channel, message) {
    var relevantIndices = [];
    if (subscriptions[channel]) {
        var msg = JSON.parse(message);
        var length = subscriptions[channel].length;
        for (var i = 0; i < length; i++) {
            if (subscriptions[channel] != undefined) {
                if (subscriptions[channel][i] != undefined) {
                    if(subscriptions[channel][i].callback(channel, msg, i)){
                        relevantIndices.push(i);
                    }
                }
            }
        }
        for(var j=0;j< relevantIndices.length;j++){
            exports.notify_remove(channel, relevantIndices[j]);
            for(var k=j+1;k<relevantIndices.length;k++){
                relevantIndices[k]--;
            }
        }
    }
}

function process_timeout() {
    var now = new Date().valueOf();
    for (var ch in subscriptions) {
        if (subscriptions.hasOwnProperty(ch)) {
            subscriptions[ch].every(function (value, index, ar) {
                if ((now - value.ts) >= config.NOTIFY_TIMEOUT) {
                    if ((value.timeout != undefined) || (value.timeout != null)) {
                        value.timeout();
                    }
                    exports.notify_remove(ch, index);
                    return true;
                } else {
                    return false;
                }
            });
        }
    }
    setTimeout(process_timeout, config.NOTIFY_TIMEOUT * 1000);
}