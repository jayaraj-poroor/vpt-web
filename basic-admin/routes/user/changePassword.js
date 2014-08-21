/**
 * Created by Harikrishnan on 21-08-2014.
 */

var crypto = require('crypto');

exports.index = function (req, res) {
    if (req.user) {
        if (req.body.userEmailTxt == undefined || req.body.passwordTxt == undefined) {
            res.send({msg: "Please provide valid data.", status: 500});
        }
        else {
            var md5 = crypto.createHash('md5');
            var salt = getNewSalt();
            md5.update(salt + ":" + req.body.passwordTxt);
            var currentPassword = md5.digest('hex');
        }
    }
    else {
        res.send(403);
    }
};