/*Copyright (c) Shelloid Systems LLP. All rights reserved.
The use and distribution terms for this software are covered by the
GNU Affero General Public License 3.0 (http://www.gnu.org/licenses/agpl-3.0.html)
which can be found in the file LICENSE at the root of this distribution.
By using this software in any fashion, you are agreeing to be bound by
the terms of this license.
You must not remove this notice, or any other, from this software.
*/
/**
 * Created by Harikrishnan on 7/7/14.
 */
var emailTemplates = require('email-templates'),
    Mailgun = require('mailgun-js'),
    path = require('path');

var templatesDir = path.resolve(global.config.DIRNAME, '/email-templates');
exports.index = function (req, res) {
    if (req.user) {
        var locals = {
            to: "contact@shelloid.com",
            subject: "Shelloid VPT: Feedback.",
            name: req.user.name,
            email: req.user.email,
            desc: req.body.feedback,
            title: req.body.title
        };
        emailTemplates(templatesDir, function (err, template) {
            if (err) {
                res.send({msg: err, status: 500});
                console.log("Error: " + err);
            }
            else {
                template('feedback', locals, function (err, html, text) {
                    if (err) {
                        res.send({msg: err, status: 500});
                        console.log("Error: " + err);
                    }
                    else {
                        var mailgun = new Mailgun({apiKey: config.MAILGUN_API_KEY, domain: config.MAILGUN_DOMAIN});
                        var data = {
                            from: config.EMAIL_FROM_ADDRESS,
                            to: locals.to,
                            subject: locals.subject,
                            html: html,
                            text: text
                        };
                        mailgun.messages().send(data, function (error, body) {
                            if (error) {
                                res.send({msg: "We can't sent email at the moment. Please try again  later", status: 500});
                                console.log("Error: ", error);
                            }
                            else {
                                res.send({status: 200});
                            }
                        });
                    }
                });
            }
        });
    }
    else {
        res.send(401);
    }
}
;
