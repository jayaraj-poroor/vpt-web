/*Copyright (c) Shelloid Systems LLP. All rights reserved.
The use and distribution terms for this software are covered by the
GNU Affero General Public License 3.0 (http://www.gnu.org/licenses/agpl-3.0.html)
which can be found in the file LICENSE at the root of this distribution.
By using this software in any fashion, you are agreeing to be bound by
the terms of this license.
You must not remove this notice, or any other, from this software.
*/

/**
 * Created by Harikrishnan on 05-08-2014.
 */

exports.index = function (req, res) {
    if (req.user) {
        easydb(dbPool)
            .query(function () {
                return {
                    query: "SELECT * FROM devices WHERE id = ? AND (owner_id = ? OR id IN (SELECT device_id FROM shared_devices WHERE user_id = ?))",
                    params: [req.body.nodeId, req.user.id, req.user.id]
                };
            })
            .success(function (rows) {
                if (rows.length == 0) {
                    throw new Error("Access denied to this node.");
                }
                else {
                    if (req.user.id != rows[0].owner_id){
                        rows[0].device_key = undefined;
                        rows[0].secret = undefined;
                    }
                    res.send({status: 200, info: rows[0]});
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