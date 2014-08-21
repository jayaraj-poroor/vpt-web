
/*Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Affero General Public License 3.0 (http://www.gnu.org/licenses/agpl-3.0.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
/**
 * Created by Harikrishnan on 20-08-2014.
 */
var crypto = require('crypto');

exports.index = function (req, res) {
    if (req.user) {
        if (req.body.userEmailTxt == undefined || req.body.passwordTxt == undefined) {
            res.send({msg: "Please provide valid data.", status: 500});
        }
        else {
            var md5 = crypto.createHash('md5');
            easydb(dbPool)
                .query(function () {
                    var query = "";
                    var params = [];
                    if (req.body.addingNewUser == "false") {
                        query = "UPDATE users SET email = ? WHERE id = ?";
                        params = [req.body.userEmailTxt, req.body.editingUser];
                    }
                    else {
                        var salt = getNewSalt();
                        md5.update(salt + ":" + req.body.passwordTxt);
                        var password = md5.digest('hex');
                        query = "INSERT INTO users (`email`, `md5_password`, `salt`) VALUES (?, ?, ?)";
                        params = [req.body.userEmailTxt, password, salt]
                    }
                    return {
                        query: query,
                        params: params
                    };
                })
                .success(function (rows) {
                    res.send({status: 200, insertId: rows.insertId});
                })
                .error(function (err) {
                    console.log(err);
                    res.send({msg: err, status: 500});
                }).execute();
        }
    }
    else {
        res.send(403);
    }
};