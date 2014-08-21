/*Copyright (c) Shelloid Systems LLP. All rights reserved.
The use and distribution terms for this software are covered by the
GNU Affero General Public License 3.0 (http://www.gnu.org/licenses/agpl-3.0.html)
which can be found in the file LICENSE at the root of this distribution.
By using this software in any fashion, you are agreeing to be bound by
the terms of this license.
You must not remove this notice, or any other, from this software.
*/
/**
 * Created by Harikrishnan on 9/6/14.
 */
exports.index = function (req, res) {
    if (req.user) {
        easydb(dbPool)
            .query(function () {
                return {
                    query: "SELECT id FROM devices WHERE owner_id = ? AND id = ?",
                    params: [req.user.id, req.body.nodeId]
                };
            })
            .success(function (rows) {
                if ((rows.length == 0) && (req.user.id != req.body.userId)) {
                    throw new Error("The node share doesn't belongs to you.");
                }
            })
            .query(function () {
                return {
                    query: "SELECT * FROM port_maps WHERE ((svc_dev_id = ? AND svc_dev_id IN (SELECT id FROM devices WHERE owner_id = ?)) OR (mapped_dev_id = ? AND mapped_dev_id IN (SELECT id FROM devices WHERE owner_id = ?))) AND disabled = 0",
                    params: [req.body.nodeId, req.body.user, req.body.nodeId, req.body.user]
                };
            })
            .success(function (rows) {
                if (rows.length > 0) {
                    throw new Error("Please remove all port mappings before removing the share.");
                }
            })
            .query(function () {
                return {
                    query: "DELETE FROM shared_devices WHERE device_id = ? AND user_id = ?",
                    params: [req.body.nodeId, req.body.userId]
                };
            })
            .query(function () {
                return {
                    query: "INSERT INTO device_updates (updateType, refId, update_ts, params) VALUES ('nodeStatus', ?, CURRENT_TIMESTAMP, ?)",
                    params: [req.body.nodeId, req.body.userId]
                };
            })
            .success(function (rows) {
                res.send({status: 200});
            })
            .done(function (){
                acquireRedis(function (err, redis) {
                    if (err) {
                        console.log("Redis acquire Error: ", err);
                    }
                    else {
                        redis.publish("nodeStatus:"+req.body.nodeId, JSON.stringify({msg: "U", nodeId: req.body.nodeId}));
                    }
                });
            })
            .error(function (err) {
                console.log(err);
                res.send({msg: err, status: 500});
            }).execute({transaction: true});
    }
    else {
        res.send(403);
    }
};