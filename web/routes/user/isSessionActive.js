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

exports.index = function (req, res) {
    if (req.user)
    {
        res.send({sessionActive: true, status: 200});
    }
    else
    {
        res.send({sessionActive: false, status: 200});
    }
};