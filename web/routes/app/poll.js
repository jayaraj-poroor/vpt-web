/*Copyright (c) Shelloid Systems LLP. All rights reserved.
The use and distribution terms for this software are covered by the
GNU Affero General Public License 3.0 (http://www.gnu.org/licenses/agpl-3.0.html)
which can be found in the file LICENSE at the root of this distribution.
By using this software in any fashion, you are agreeing to be bound by
the terms of this license.
You must not remove this notice, or any other, from this software.
*/
/**
 * Created by Harikrishnan on 18/6/14.
 */
var clientChannelMap = [];
exports.poll = function (req, res) {
    if (req.user) {
        notify.notify_add(req.body.channel, function (channel, msg, index) {
            msg.channel = channel;
            if ((msg.users == undefined) || (msg.users.indexOf(req.user.id) != -1) || (msg.users.indexOf("*") != "-1")) {
                delete msg.users;
                msg.channel = channel;
                res.send(msg);
            }
            return true;
        }, function () {
            res.send(408);
        });
        var query = "";
        var params = "";
        if ((req.body.lastUpdateId == undefined) || (req.body.lastUpdateId == -1)) {
            query = "SELECT refId, status, id, updateType, params FROM device_updates WHERE id IN (SELECT max(id) FROM device_updates GROUP BY refId, updateType) ORDER BY id ASC";
            params = [];
            easydb(dbPool)
                .query(function () {
                    return {
                        query: query,
                        params: params
                    };
                })
                .success(function (rows) {
                    if (rows.length > 0) {
                        res.send({status: 200, from: "db", list: rows});
                    }
                    else {
                        res.send({status: 200, from: "db", lastUpdateId: 0});
                    }
                })
                .query(function () {
                    return {
                        query: "DELETE FROM device_updates WHERE update_ts < CURRENT_TIMESTAMP - ?",
                        params: [30 * 60 * 1000]
                    };
                })
                .error(function (err) {
                    console.log(err);
                }).execute();
        }
        else {
            var subQueryRefId = "(SELECT distinct 'a' ";
            var subQueryUpdateType = "(SELECT distinct 'a' ";
            req.body.channel.forEach(function(value, index){
                var splitArr = value.split(":");
                if (splitArr[1] != "undefined"){
                    subQueryRefId += "UNION ALL SELECT "+splitArr[1]+" ";
                }
                if (splitArr[0] != "undefined") {
                    subQueryUpdateType += "UNION ALL SELECT '" + splitArr[0] + "' ";
                }
            });
            subQueryRefId += ")";
            subQueryUpdateType += ")";
            query = "SELECT refId, status, id, updateType, params FROM device_updates WHERE updateType IN " + subQueryUpdateType + " AND refId IN " + subQueryRefId + " AND id > ?  AND id IN (SELECT max(id) FROM device_updates GROUP BY updateType, refId) GROUP BY refId ORDER BY id ASC";
            params = [req.body.lastUpdateId];
            easydb(dbPool)
                .query(function () {
                    return {
                        query: query,
                        params: params
                    };
                })
                .success(function (rows) {
                    if (rows.length > 0) {
                        res.send({status: 200, from: "db", list: rows});
                    }
                })
                .query(function () {
                    return {
                        query: "DELETE FROM device_updates WHERE update_ts < CURRENT_TIMESTAMP - ?",
                        params: [30 * 60 * 1000]
                    };
                })
                .error(function (err) {
                    console.log(err);
                }).execute();
        }
    }
    else {
        res.send(403);
    }
};
