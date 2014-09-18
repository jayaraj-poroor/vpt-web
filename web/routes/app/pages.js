/*Copyright (c) Shelloid Systems LLP. All rights reserved.
The use and distribution terms for this software are covered by the
GNU Affero General Public License 3.0 (http://www.gnu.org/licenses/agpl-3.0.html)
which can be found in the file LICENSE at the root of this distribution.
By using this software in any fashion, you are agreeing to be bound by
the terms of this license.
You must not remove this notice, or any other, from this software.
*/
/**
 * Created by Harikrishnan on 4/6/14.
 */
exports.index = function (req, res) {
    res.render('index', {"title": "Home - Shelloid VPT", managed: global.config.SAAS_MODE, loggedIn: req.user});
};

exports.download = function (req, res) {
    res.render('download', {"title": "Downloads - Shelloid VPT", managed: global.config.SAAS_MODE, loggedIn: req.user});
};

exports.terms = function (req, res) {
    res.render('terms', {"title": "Terms and conditions - Shelloid VPT", managed: global.config.SAAS_MODE, loggedIn: req.user});
};

exports.console = function (req, res) {
    res.render('console', {"title": "Console - Shelloid VPT", managed: global.config.SAAS_MODE, loggedIn: req.user, policiesEnabled: global.modules.policiesEnabled});
};
