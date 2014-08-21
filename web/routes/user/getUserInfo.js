/*Copyright (c) Shelloid Systems LLP. All rights reserved.
The use and distribution terms for this software are covered by the
GNU Affero General Public License 3.0 (http://www.gnu.org/licenses/agpl-3.0.html)
which can be found in the file LICENSE at the root of this distribution.
By using this software in any fashion, you are agreeing to be bound by
the terms of this license.
You must not remove this notice, or any other, from this software.
*/

/**
 * Created by Harikrishnan on 5/7/14.
 */

exports.index = function (req, res) {
    if (req.user) {
        var error = false;
        easydb(dbPool)
            .query(function () {
                return {
                    query: "SELECT * FROM users WHERE email=?",
                    params: [req.user.email]
                };
            })
            .success(function (rows) {
                if ((rows.length > 0)) {
                    var user = {
                        id: rows[0].id,
                        name: rows[0].name,
                        email: rows[0].email,
                        phoneNumber: rows[0].phone_num
                    };
                    res.send({status: 200, user: user});
                }
                else {
                    throw new Error("Session Expired");
                }
            })
            .error(function (err) {
                console.log(err);
                error = true;
                res.send({msg: err, status: 500});
            }).execute();
    }
    else {
        res.send(401);
    }
};

exports.byId = function (req, res) {
    if (req.user) {
        var error = false;
        easydb(dbPool)
            .query(function () {
                return {
                    query: "SELECT id, name FROM users WHERE id=?",
                    params: [req.body.id]
                };
            })
            .success(function (rows) {
                if ((rows.length > 0)) {
                    var user = {
                        id: rows[0].id,
                        name: rows[0].name
                    };
                    res.send({status: 200, user: user});
                }
                else {
                    throw new Error("User not found");
                }
            })
            .error(function (err) {
                console.log(err);
                error = true;
                res.send({msg: err, status: 500});
            }).execute();
    }
    else {
        res.send(401);
    }
};