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
                    query: "SELECT md5_password FROM users WHERE id = ? AND email = ?",
                    params: [req.user.id, req.body.myemail]
                };
            })
            .success(function (rows) {
                if (rows.length == 0) {
                    throw new Error("This is not your Email ID.");
                }
                else {
                    if (rows[0].md5_password != req.body.prev_md5_secret) {
                        throw new Error("Your current password is incorrect. Please retry again.");
                    }
                }
            }).
            query(function () {
                var query = "UPDATE users SET name = ?, phone_num = ?";
                var params = [req.body.myname, req.body.myphonenumber];
                if (req.body.changeProfilePassword == "true") {
                    query += ", md5_password = ?, salt = ?";
                    params.push(req.body.md5_secret);
                    params.push(req.body.salt);
                }
                query += " WHERE id = ?";
                params.push(req.user.id);
                return {
                    query: query,
                    params: params
                };
            }).
            success(function (rows) {
                res.send({status: 200});
            }).
            error(function (err) {
                console.log(err);
                res.send({msg: err, status: 500});
            }).execute({transaction: true});
    }
    else {
        res.send(401);
    }
};