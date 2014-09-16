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
        easydb(dbPool)
            .query(function () {
                return {
                    query: "SELECT policy_text FROM policies WHERE owner_id = ? AND policy_id = ?",
                    params: [req.user.id, req.body.id]
                };
            })
            .success(function (rows) {
                if (rows.length > 0) {
                    res.send({text: rows[0].policy_text, status: 200});
                } else {
                    res.send({msg: "Access denied", status:500});
                }
            })
            .error(function (err) {
                console.log(err);
                res.send({msg: err, status: 500});
            }).execute();
    }
    else {
        res.send(403);
    }
};
