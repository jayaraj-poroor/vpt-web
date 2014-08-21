/*Copyright (c) Shelloid Systems LLP. All rights reserved.
The use and distribution terms for this software are covered by the
GNU Affero General Public License 3.0 (http://www.gnu.org/licenses/agpl-3.0.html)
which can be found in the file LICENSE at the root of this distribution.
By using this software in any fashion, you are agreeing to be bound by
the terms of this license.
You must not remove this notice, or any other, from this software.
*/

/**
 * Created by Harikrishnan on 21/5/14.
 */
var mysql = require('mysql');

exports.index = function (req, res) {
    easydb(dbPool)
        .query(function () {
            return {query: "SELECT salt FROM users WHERE email=?", params: [req.body.email]};
        })
        .success(function (rows) {
            if (rows.length > 0)
            {
                res.send({status: 200, salt: rows[0].salt});
            }
            else
            {
                res.send({status: 401, msg: "Incorrect username or password."});
            }
        })
        .error(function (err) {
            console.log(err);
            res.send({msg: err.message, status: 500});
        }).execute();
};