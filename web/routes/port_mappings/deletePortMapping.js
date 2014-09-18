/*Copyright (c) Shelloid Systems LLP. All rights reserved.
The use and distribution terms for this software are covered by the
GNU Affero General Public License 3.0 (http://www.gnu.org/licenses/agpl-3.0.html)
which can be found in the file LICENSE at the root of this distribution.
By using this software in any fashion, you are agreeing to be bound by
the terms of this license.
You must not remove this notice, or any other, from this software.
*/

/**
 * Created by Harikrishnan on 7/6/14.
 */

exports.index = function (req, res) {
    var svcDevId;
    var mapped_dev_id;
    var changedRows;
    if (req.user) {
        easydb(dbPool)
            .query(function () {
                return {
                    query: "SELECT svc_dev_id, mapped_dev_id FROM port_maps WHERE id = ? AND (svc_dev_id IN (SELECT id FROM devices WHERE owner_id = ?) OR mapped_dev_id IN (SELECT id FROM devices WHERE owner_id = ?))",
                    params: [req.body.id, req.user.id, req.user.id]
                };
            })
            .success(function (rows) {
                if (rows.length > 0) {
                    svcDevId = rows[0].svc_dev_id;
                    mapped_dev_id = rows[0].mapped_dev_id;
                }
                else {
                    throw new Error("Port mapping already deleted or you are not authorized.");
                }
            })
            .query(function () {
                return {
                    query: "UPDATE port_maps SET disabled = 1 WHERE id = ?",
                    params: [req.body.id]
                };
            })
            .success(function (rows) {
                changedRows = rows.changedRows;
            })
            .query(function () {
                return {
                    query: "SELECT (SELECT app_name FROM applications WHERE app_id = (SELECT application_id FROM policies WHERE policy_id = access_policy_id)) as appName, credential_text, access_policy_id FROM port_maps WHERE id = ?",
                    params: [req.body.id]
                };
            })
            .success(function (rows) {
                var stopListen = function (err) {
                    utils.sendToDevice(mapped_dev_id, {type: "STOP_LISTEN", portMapId: req.body.id+""}, function () {
                        if (err != undefined) {
                            res.send({status: 201, msg: err});
                        }
                    }, function (err){
                        res.send({msg: err, status: 201});
                    });
                };
                var appName, credentialText, portmapPolicyId;
                if (rows.length > 0){
                    appName = rows[0].appName;
                    credentialText = rows[0].credential_text;
                    portmapPolicyId = rows[0].access_policy_id;
                }

                utils.sendToDevice(svcDevId, {type: "CLOSE_PORT", portMapId: req.body.id+"", appName: appName, credential_text: credentialText, policyId: portmapPolicyId}, function () {
                    stopListen();
                }, function (err){
                    stopListen(err);
                });
                if (changedRows <= 0) {
                    res.send({status: 201, msg: "Closing in progress."});
                }
                else {
                    res.send({status: 200});
                }
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