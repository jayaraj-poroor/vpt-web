/*Copyright (c) Shelloid Systems LLP. All rights reserved.
The use and distribution terms for this software are covered by the
GNU Affero General Public License 3.0 (http://www.gnu.org/licenses/agpl-3.0.html)
which can be found in the file LICENSE at the root of this distribution.
By using this software in any fashion, you are agreeing to be bound by
the terms of this license.
You must not remove this notice, or any other, from this software.
*/

/**
 * Created by Harikrishnan on 2/6/14.
 */
/**
 * Created by Harikrishnan on 2/6/14.
 */

var mysql = require('mysql');

exports.index = function (req, res) {
    easydb(dbPool)
        .query(function () {
            return {query: "SELECT email, name, gen_code FROM pending_registrations WHERE email = ? and gen_code = ?", params: [decodeURIComponent(req.body.email), decodeURIComponent(req.body.id)]};
        })
        .success(function (rows) {
            if (rows.length > 0)
            {
                res.send({status: 200, name: rows[0].name});
            }
            else
            {
                res.send({status: 403, msg: "Invalid code."});
            }
        }).
        error(function (err) {
            console.log(err);
            res.send({msg: err.message, status: 500});
        }).execute({transaction: true});
};