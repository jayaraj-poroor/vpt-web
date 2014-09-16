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
                    query: "SELECT * FROM applications",
                    params: []
                };
            })
            .success(function (rows) {
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
