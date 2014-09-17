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
        if (req.body.sPolicyName == undefined || req.body.sPolicyApp == undefined || req.body.addingNewPolicy == undefined || req.body.editingPolicyId == undefined || req.body.jsonString == undefined  ) {
            res.send({msg: "Please provide valid data.", status: 500});
        }
        else {
            easydb(dbPool)
                .query(function () {
                    var query = "";
                    var params = [];
                    if (req.body.addingNewPolicy == "false") {
                        query = "SELECT 1 FROM policies where owner_id = ? AND policy_id != ?";
                        params = [req.user.id, req.body.editingPolicyId];
                    }
                    else {
                        query = "SELECT 1";
                        params = []
                    }
                    return {
                        query: query,
                        params: params
                    };
                })
                .success(function (rows) {
                    if (rows.length <= 0) {
                        throw new Error("Could not add policy. Please retry");//Device key already exists. Please enter another key");
                    }
                })
                .query(function () {
                    var query = "";
                    var params = [];
                    if (req.body.addingNewPolicy == "false") {
                        query = "UPDATE policies SET policy_name = ?, policy_text = ?, application_id = ?, last_modified_at = CURRENT_TIMESTAMP WHERE policy_id = ?";
                        params = [req.body.sPolicyName, JSON.stringify(req.body.jsonString), req.body.sPolicyApp, req.body.editingPolicyId];
                    }
                    else {
                        query = "INSERT INTO policies (`policy_name`, `owner_id`, `policy_text`, `application_id`, `created_at`, `last_modified_at`) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";
                        params = [req.body.sPolicyName, req.user.id, JSON.stringify(req.body.jsonString), req.body.sPolicyApp]
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
                    if (err.code == 'ER_DUP_ENTRY'){
                        res.send({msg: "You can't have two policies with the same name.", status: 500});
                    } else {
                        res.send({msg: err, status: 500});
                    }
                }).execute();
        }
    }
    else {
        res.send(403);
    }
};
