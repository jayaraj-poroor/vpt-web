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
        if (req.body.email == req.user.email) {
            res.send({msg: "You can't share your own device to yourself.", status: 500});
        } else {
            var name;
            var id;
            easydb(dbPool)
                .query(function () {
                    return {
                        query: "SELECT id FROM devices WHERE owner_id = ? AND id = ?",
                        params: [req.user.id, req.body.nodeId]
                    };
                })
                .success(function (rows) {
                    if (rows.length == 0) {
                        throw new Error("The node doesn't belongs to you.");
                    }
                })
                .query(function () {
                    return {
                        query: "INSERT INTO shared_devices SELECT ?, id, CURRENT_TIMESTAMP FROM users WHERE email = ?",
                        params: [req.body.nodeId, req.body.email]
                    };
                })
                .query(function () {
                    return {
                        query: "SELECT id, name FROM users WHERE email = ?",
                        params: [req.body.email]
                    };
                })
                .success(function (rows) {
                    if (rows.length == 0) {
                        throw new Error("There is no user with this email registered to Shelloid.");
                    }
                    else {
                        name = rows[0].name;
                        id = rows[0].id;
                    }
                })
                .query(function () {
                    return {
                        query: "INSERT INTO device_updates (updateType, refId, update_ts, params) VALUES ('newShareStatus', ?, CURRENT_TIMESTAMP, ?)",
                        params: [id, req.body.nodeId]
                    };
                })
                .success(function (rows) {
                    res.send({name: name, id: id, status: 200});
                })
                .done(function (){
                    acquireRedis(function (err, redis) {
                        if (err) {
                            console.log("Redis acquire Error: ", err);
                        }
                        else {
                            redis.publish("newShareStatus:" + id, JSON.stringify({nodeId: req.body.nodeId}));
                        }
                    });
                })
                .error(function (err) {
                    console.log(err);
                    res.send({msg: err, status: 500});
                }).execute({transaction: true});
        }
    }
    else {
        res.send(403);
    }
};