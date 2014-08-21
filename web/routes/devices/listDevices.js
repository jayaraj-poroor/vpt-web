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
                var query = "SELECT * FROM devices where ";
                var params = [];
                if (req.body.showShares == true)
                {
                    query += "(owner_id = ? OR id IN (SELECT device_id FROM shared_devices WHERE user_id = ?)) ";
                    params = [req.user.id, req.user.id];
                }
                else
                {
                    query += "owner_id = ? ";
                    params = [req.user.id];
                }
                if (req.body.disabled == false)
                {
                    query += "AND disabled = 0";
                }
                return {
                    query: query,
                    params: params
                };
            })
            .success(function (rows) {
                for (var i = 0; i < rows.length; i++){
                    if (rows[i].owner_id != req.user.id){
                        rows[i].device_key = undefined;
                        rows[i].secret = undefined;
                    }
                }
                res.send({list: rows, status: 200});
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
