/**
 * Created by Harikrishnan on 20-08-2014.
 */

exports.index = function (req, res) {
    if (req.user) {
        easydb(dbPool)
            .query(function () {
                return {
                    query: "DELETE FROM users WHERE id = ?",
                    params: [req.body.id]
                };
            })
            .success(function (rows) {
                res.send({status: 200});
            })
            .error(function (err) {
                if (JSON.stringify(err).indexOf("ER_ROW_IS_REFERENCED_") > 0) {
                    res.send({status: 500, msg: "You have to delete all the devices, device shares, port maps made by this user in order to delete the user."});
                }
                else {
                    console.log(err);
                    res.send({msg: err, status: 500});
                }
            }).execute({transaction: true});
    }
    else {
        res.send(403);
    }
};