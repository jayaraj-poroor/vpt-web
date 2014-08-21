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
                    query: "SELECT * FROM port_maps WHERE svc_dev_id IN (SELECT id FROM devices WHERE owner_id = ?) OR mapped_dev_id IN (SELECT id FROM devices WHERE owner_id = ?)",
                    params: [req.user.id, req.user.id, req.user.id]
                };
            })
            .success(function (rows) {
                var list = [];
                for (var i = 0; i < rows.length; i++) {
                    var row = rows[i];
                    var svcDeviceDetails = utils.getDeviceDetails(row.svc_dev_id);
                    var mappedDeviceDetails = utils.getDeviceDetails(row.mapped_dev_id);
                    list.push({
                        id: row.id,
                        fromDeviceUserName: svcDeviceDetails.userName,
                        fromDeviceName: svcDeviceDetails.deviceName,
                        fromPort: row.svc_port,
                        toDeviceUserName: mappedDeviceDetails.userName,
                        toDeviceName: mappedDeviceDetails.deviceName,
                        toPort: (row.mapped_port == -1 ? "" : row.mapped_port),
                        date: getNormalDate(row.opened_at),
                        protocol: row.protocol,
                        disabled: row.disabled
                    });
                }
                res.send({list: list, status: 200});
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