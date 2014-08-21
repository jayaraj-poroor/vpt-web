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
var passport = require('passport'),
    mysql = require('mysql'),
    LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function (user, done) {
    acquireRedis(function (err, client) {
        if (err)
        {
            done(err);
        }
        else
        {
            client.setex(user.id, config.SESSION_EXPIRY, JSON.stringify(user));
            done(null, user.id);
            releaseRedis(client);
        }
    });
});

passport.deserializeUser(function (id, done) {
    acquireRedis(function (err, client) {
        if (err)
        {
            done(err);
        }
        else
        {
            client.get(id, function (err, reply) {
                if (err)
                {
                    done(err);
                }
                else
                {
                    client.expire(id, config.SESSION_EXPIRY);
                    done(null, JSON.parse(reply));
                }
            });
            releaseRedis(client);
        }
    });
});

passport.use(new LocalStrategy({
        usernameField: 'emailid',
        passwordField: 'md5_secret'
    },
    function (username, password, done) {
        var retValue;
        easydb(dbPool)
            .query(function () {
                return {
                    query: "UPDATE users SET last_login_time = CURRENT_TIMESTAMP WHERE email = ? AND md5_password = ?",
                    params: [username, password]
                };
            })
            .success(function (rows) {
                if (rows.affectedRows <= 0)
                {
                    retValue = done(null, false, { message: 'Incorrect username or password.' });
                    throw new Error("Incorrect username or password.");
                }
            })
            .query(function () {
                return {
                    query: "SELECT * FROM users WHERE email=?",
                    params: [username]
                };
            })
            .success(function (rows) {
                if ((rows.length > 0) && (rows[0].md5_password == password))
                {
                    var user = {
                        id: rows[0].id,
                        name: rows[0].name,
                        email: rows[0].email,
                        phoneNumber: rows[0].phone_num
                    };
                    retValue = done(null, user);
                }
                else
                {
                    retValue = done(null, false, { message: 'Incorrect username or password.' });
                }
            })
            .error(function (err) {
                console.log(err);
                retValue = done(err);
            })
            .done(function () {
                return retValue;
            }).execute({transaction: true});
    }));

exports.index = function (req, res) {
    if (req.user){
        console.log("Login request arrived when user already logged in");
    }
    req.logout();
    passport.authenticate('local', function (err, user, info) {
        if (err)
        {
            return res.send({status: 500, msg: err});
        }
        if (!user)
        {
            return res.send({status: 401, msg: info.message});
        }
        req.logIn(user, function (err) {
            if (err)
            {
                return res.send({status: 500, msg: err});
            }
            else
            {
                res.send({status: 200, user: user});
                return true;
            }
        });
    })(req, res);
};