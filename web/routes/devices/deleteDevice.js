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
    if (req.user) {
        easydb(dbPool)
            .query(function () {
                return {
                    query: "DELETE FROM devices WHERE id = ? AND owner_id = ?",
                    params: [req.body.nodeId, req.user.id]
                };
            })
            .success(function (rows) {
                if (rows.affectedRows > 0) {
                    res.send({status: 200});
                }
                else {
                    res.send({status: 500, msg: "You can only delete a device which is existing and owns by you."});
                }
            })
            .error(function (err) {
                if (JSON.stringify(err).indexOf("ER_ROW_IS_REFERENCED_") > 0) {
                    res.send({status: 201, msg: "The selected device is shared with some other user or currently mapped."});
                }
                else {
                    console.log(err);
                    res.send({msg: err, status: 500});
                }
            }).execute({transaction: true});
    }
    else {
        res.send(403);
    }
};