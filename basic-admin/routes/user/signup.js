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

exports.index = function (req, res) {
    easydb(dbPool)
        .query(function () {
            return {
                query: "SELECT email, name, gen_code FROM pending_registrations WHERE email = ? and gen_code = ? and name = ?",
                params: [decodeURIComponent(req.body.email), decodeURIComponent(req.body.id), decodeURIComponent(req.body.name)]
            };
        })
        .success(function (rows) {
            if (rows.length > 0)
            {
                res.send({status: 200, name: rows[0].name});
            }
            else
            {
                throw new Error("Validation failed.");
            }
        }).
        query(function () {
            return {
                query: "INSERT INTO users (`email`, `md5_password`, `salt`, `name`, `last_login_time`) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
                params: [req.body.email, req.body.md5_secret, req.body.salt, req.body.name]
            };
        }).
        query(function () {
            return {
                query: "DELETE FROM pending_registrations WHERE email = ?",
                params: [decodeURIComponent(req.body.email)]
            };
        }).
        success(function (rows) {
            res.send({status: 200});
        }).
        error(function (err) {
            console.log(err);
            res.send({msg: err, status: 500});
        }).execute({transaction: true});
};