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

exports.index = function (req, res) {
    easydb(dbPool)
        .query(function () {
            return {
                query: "INSERT INTO dba_interested_users (email_id, name, mysql_selected, other_databases) VALUES (?, ?, ?, ?)",
                params: [decodeURIComponent(req.body.email), req.body.name, req.body.mysql_selected, req.body.databases]
            };
        })
        .success(function (rows) {
            res.send({status: 200});
        }).
        error(function (err) {
            console.log(err);
            res.send({msg: err.message, status: 500});
        }).execute({transaction: true});
};