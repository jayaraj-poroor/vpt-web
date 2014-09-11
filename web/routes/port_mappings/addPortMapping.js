/*Copyright (c) Shelloid Systems LLP. All rights reserved.
The use and distribution terms for this software are covered by the
GNU Affero General Public License 3.0 (http://www.gnu.org/licenses/agpl-3.0.html)
which can be found in the file LICENSE at the root of this distribution.
By using this software in any fashion, you are agreeing to be bound by
the terms of this license.
You must not remove this notice, or any other, from this software.
*/

/**
 * Created by Harikrishnan on 6/6/14.
 */

exports.index = function (req, res) {
    if (req.user) {
        var port = parseInt(req.body.portMappingNumber);
        if (req.body.portMappingNodesFrom == undefined || req.body.portMappingNumber == undefined ||
            req.body.portMappingNodesTo == undefined || req.body.portMappingProtocolTcp == undefined || port <= 0 || port > 65535 || (req.body.portMappingNodesFrom == req.body.portMappingNodesTo)) {
            res.send({msg: "Please provide valid data.", status: 500});
        }
        else {
            var response;
            var toDeviceOwner;
            var insertId;
            easydb(dbPool)
                .query(function () {
                    return {
                        query: "SELECT name FROM devices where owner_id = ? AND id = ?",
                        params: [req.user.id, req.body.portMappingNodesFrom]
                    };
                })
                .success(function (rows) {
                    if (rows.length == 0) {
                        throw new Error("You don't have any permission to create a port map on this device");
                    }
                })
                .query(function () {
                    return {
                        query: "INSERT INTO port_maps (`svc_dev_id` ,`svc_port` ,`mapped_dev_id` ,`mapped_port` ,`protocol`) VALUES (?, ?, ?, -1, ?)",
                        params: [req.body.portMappingNodesFrom, req.body.portMappingNumber, req.body.portMappingNodesTo, req.body.portMappingProtocolTcp == true ? "TCP" : "UDP", new Date()]
                    };
                })
                .success(function (rows) {
                    var fromDevInfo = utils.getDeviceDetails(req.body.portMappingNodesFrom);
                    var toDevInfo = utils.getDeviceDetails(req.body.portMappingNodesTo);
                    insertId = rows.insertId;
                    utils.sendToDevice(req.body.portMappingNodesFrom, {type: "OPEN_PORT", portMapId: rows.insertId + "", svcPort: req.body.portMappingNumber}, function () {
                        res.send({status: 200, insertId: rows.insertId, svcDevUserName: fromDevInfo.userName, mappedDevUserName: toDevInfo.userName});
                    }, function (err) {
                        res.send({msg: err, status: 201});
                    });
                })
                .query(function () {
                    return {
                        query: "SELECT owner_id FROM devices where id = ?",
                        params: [req.body.portMappingNodesTo]
                    };
                })
                .success(function (rows) {
                    if (rows.length > 0) {
                        toDeviceOwner = rows[0].owner_id;
                    } else {
                        throw new Error("Invalid to node specified: " + req.body.portMappingNodesTo);
                    }
                })
                .query(function () {
                    return {
                        query: "INSERT INTO device_updates (updateType, refId, update_ts, params) VALUES ('newPortMap', ?, CURRENT_TIMESTAMP, ?)",
                        params: [toDeviceOwner, insertId]
                    };
                })
                .error(function (err) {
                    console.log(err);
                    res.send({msg: err, status: 500});
                })
                .done(function (){
                    acquireRedis(function (err, redis) {
                        if (err) {
                            console.log("Redis acquire Error: ", err);
                        }
                        else {
                            redis.publish("newPortMap:" + toDeviceOwner, getMessageAsString({type:"OTHER_MESSAGES", portMapId: insertId}).toString('hex'));
                        }
                    });
                })
                .execute({transaction: true});
        }
    }
    else {
        res.send(403);
    }
};
