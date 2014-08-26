/**
 * Created by Harikrishnan on 21-08-2014.
 */

var crypto = require('crypto'),
    fs = require("fs");

exports.index = function (req, res) {
    if (req.user) {
        if (req.body.newPwd == undefined || req.body.current == undefined) {
            res.send({msg: "Please provide valid data.", status: 500});
        }
        else {
            if (req.body.current == global.config.ADMIN_PASSWORD) {
                var md5 = crypto.createHash('md5');
                var salt = getNewSalt();
                md5.update(salt + ":" + req.body.newPwd);
                var currentPassword = md5.digest('hex');
                global.config.ADMIN_PASSWORD = req.body.newPwd;
                global.config.ADMIN_SALT = salt;
                var cfg = JSON.stringify(global.config);
                fs.writeFile("config.json", cfg, 'utf8', function(err) {
                    if(err) {
                        console.log(err);
                        res.send({status: 500, msg: err});
                    } else {
                        res.send({status: 200});
                    }
                });
            } else  {
                res.send({status: 500, msg: "Access denied"});
            }
        }
    }
    else {
        res.send(403);
    }
};