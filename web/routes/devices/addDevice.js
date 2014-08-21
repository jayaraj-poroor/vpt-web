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
        if (req.body.sNodeKey == undefined || req.body.sNodeName == undefined || req.body.sNodeSecret == undefined || req.body.sNodeType == undefined) {
            res.send({msg: "Please provide valid data.", status: 500});
        }
        else {
            easydb(dbPool)
                .query(function () {
                    var query = "";
                    var params = [];
                    if (req.body.addingNewNode == "false") {
                        query = "SELECT device_key FROM devices where device_key = ? AND id != ?";
                        params = [req.body.sNodeKey, req.body.editingNodeId];
                    }
                    else {
                        query = "SELECT device_key FROM devices where device_key = ?";
                        params = [req.body.sNodeKey]
                    }
                    return {
                        query: query,
                        params: params
                    };
                })
                .success(function (rows) {
                    if (rows.length > 0) {
                        throw new Error("Could not add device. Please retry");//Device key already exists. Please enter another key");
                    }
                })
                .query(function () {
                    var query = "";
                    var params = [];
                    if (req.body.addingNewNode == "false") {
                        query = "SELECT name FROM devices where owner_id = ? AND name = ? AND id != ?";
                        params = [req.user.id, req.body.sNodeName, req.body.editingNodeId];
                    }
                    else {
                        query = "SELECT name FROM devices where owner_id = ? and name = ?";
                        params = [req.user.id, req.body.sNodeName]
                    }
                    return {
                        query: query,
                        params: params
                    };
                })
                .success(function (rows) {
                    if (rows.length > 0) {
                        throw new Error("You have already created a node with same name. Please enter another name");
                    }
                })
                .query(function () {
                    var query = "";
                    var params = [];
                    if (req.body.addingNewNode == "false") {
                        query = "UPDATE devices SET device_key = ?, name = ?, secret = ?, type = ? WHERE owner_id = ? AND id = ?";
                        params = [req.body.sNodeKey, req.body.sNodeName, req.body.sNodeSecret, req.body.sNodeType, req.user.id, req.body.editingNodeId];
                    }
                    else {
                        query = "INSERT INTO devices (`owner_id`, `device_key`, `name`, `secret`, `type`, `created_at`) VALUES (?, ?, ?, ?, ?, ?)";
                        params = [req.user.id, req.body.sNodeKey, req.body.sNodeName, req.body.sNodeSecret, req.body.sNodeType, new Date()]
                    }
                    return {
                        query: query,
                        params: params
                    };
                })
                .success(function (rows) {
                    res.send({status: 200, insertId: rows.insertId});
                })
                .error(function (err) {
                    console.log(err);
                    res.send({msg: err, status: 500});
                }).execute();
        }
    }
    else {
        res.send(403);
    }
};
