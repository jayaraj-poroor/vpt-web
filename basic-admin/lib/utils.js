/**
 * Created by Harikrishnan on 18-07-2014.
 */

var deasync = require('deasync');
exports.sendToDevice = function(deviceId, msg, successCallBack, errCallBack){
    acquireRedis(function (err, redis) {
        if (err) {
            console.log("Redis acquire Error: ", err);
            errCallBack("Server too busy");
        }
        else {
            redis.rpush("dev" + deviceId, JSON.stringify(msg), function (err, obj) {
                if (err) {
                    console.log("Redis Error: ", err);
                    errCallBack("Can't push message.");
                    releaseRedis(redis);
                }
                else {
                    var publishFn = function (ip){
                        redis.publish(ip, JSON.stringify({type: "NEW_MSG", device_id: deviceId+""}), function (err, data) {
                            if (err) {
                                console.log("Redis Error: ", err);
                                errCallBack("Can't publish the message");
                            }
                            else {
                                successCallBack();
                            }
                            releaseRedis(redis);
                        });
                    };
                    if (global.config.SINGLE_SERVER_IP == undefined) {
                        redis.hget("deviceMap", deviceId, function (err, data) {
                            if (err) {
                                console.log("Redis Error: ", err);
                                errCallBack("Can't get the devices server.");
                                releaseRedis(redis);
                            }
                            else {
                                if (data == null) {
                                    successCallBack();
                                }
                                else {
                                    publishFn(data);
                                }
                            }
                        });
                    } else {
                        publishFn(global.config.SINGLE_SERVER_IP);
                    }
                }
            });
        }
    });
};

exports.getDeviceDetails = function (id) {
    var done = false;
    var info = undefined;
    easydb(dbPool)
        .query(function () {
            return {
                query: "SELECT devices.name AS deviceName, users.name AS userName FROM devices INNER JOIN users ON devices.owner_id = users.id WHERE devices.id = ?",
                params: [id]
            };
        })
        .success(function (rows) {
            if (rows.length > 0) {
                info = rows[0];
            }
            else {
                throw new Error("Can't find device");
            }
            done = true;
        })
        .error(function (err) {
            done = true;
            console.log(err);
            throw err;
        }).execute();
    while (!done) {
        deasync.runLoopOnce();
    }
    return info;
}