/*Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Affero General Public License 3.0 (http://www.gnu.org/licenses/agpl-3.0.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
/**
 * Created by Harikrishnan on 16-09-2014.
 */

var fs = require("fs");

exports.index = function (req, res) {
    if (req.user) {
        try {
            res.send(fs.readFileSync(global.config.APP_FILES_PATH + req.body.name + ".ejs", 'utf8'));
        } catch (err){
            console.log(err);
            res.send(404);
        }
    }
    else {
        res.send(403);
    }
};