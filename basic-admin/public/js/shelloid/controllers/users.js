/**
 * Created by Harikrishnan on 7/6/14.
 */
var usersDataSet = [];

function initUsers() {
    if (isLoggedIn()) {
        registerForm(addNodeForm());
        setupHandlers();
        refreshUsersList();
    }
    else {
        window.location = window.actualSite + "/?msgId=1"
    }
}

var addNodeForm = function () {
    var form = {};
    form.name = 'frmUser';
    form.obj = $('#' + form.name);
    form.validator = form.obj.validate();
    form.addUserBtn = function (e) {
        e.preventDefault();
        form.obj.validate();
        if (form.validator.form()) {
            var data = {
                userEmailTxt: undefined,
                passwordTxt: undefined,
                addingNewUser: undefined,
                editingUser: undefined
            };
            fillModel(form.obj, data);

            addWaitingOverlay();
            doPost("/addUser", data, function (resp) {
                removeWaitingOverlay();
                if (resp.status == 200) {
                    if (data.addingNewUser == "true") {
                        usersDataSet.push(getNewUserRow(resp.insertId, "-", data.userEmailTxt));
                    }
                    else {
                        //updateDataSet(usersDataSet, "user" + data.editingUser, "1", "-");
                        updateDataSet(usersDataSet, "user" + data.editingUser, "2", data.userEmailTxt);
                    }
                    showUserDataTable();
                }
                else {
                    console.log(resp);
                    bootbox.alert("<b>An error has occurred while adding the user.</b><br/>" + (typeof resp.msg == "string" ? resp.msg : ""));
                }
            }, function (err) {
                removeWaitingOverlay();
                console.log(err);
                bootbox.alert("Server Error: " + err.error);
            });
            $("#addingNewUser").val("true");
            $("#userEmailTxt").val("");
            $("#passwordTxt").val("");
            $("#cancelAddUserBtn").click();
        }
        else {
            bootbox.alert('Please fix input errors and try again.');
        }
    };
    return form;
};

function refreshUsersList() {
    doPost("/listUsers", {disabled: true, showShares: true}, function (resp) {
        if (resp.status == 200) {
            usersDataSet = [];
            for (var i = 0; i < resp.list.length; i++) {
                usersDataSet.push(getNewUserRow(resp.list[i].id, resp.list[i].name, resp.list[i].email));
            }
            showUserDataTable();
        }
        else {
            bootbox.alert("<b>An error has occurred while listing the users.</b><br/>" + (typeof resp.msg == "string" ? resp.msg : ""));
        }
    });
}

function getNewUserRow(id, name, email) {
    var actionTd = '<span class="glyphicon glyphicon-remove" onclick="deleteUser(' + id + ')" data-toggle="tooltip" data-placement="top" title="Remove This User"></span>';
    actionTd += '<span class="glyphicon glyphicon-edit" onclick="editUser(' + id + ')"  data-toggle="tooltip" data-placement="top" title="Edit this User\'s Email ID"></span>';
    if (name == "" || name == null){
        name = "-";
    }
    var tr = {
        DT_RowId: "user" + id,
        "1": name,
        "2": email,
        "3": actionTd
    };
    return tr;
}

function deleteUser(id){
    bootbox.dialog({
        message: 'If you want to delete the user, please type the word "delete" without double quotes in the below text box and click Delete <br/><br/><input type="text" class="form-control" id="removeUserConfirmTextBox"/>',
        title: "Deleting your own device (" + getFromDataSet(usersDataSet, "user" + id, "2" )+")",
        buttons: {
            success: {
                label: "Cancel",
                className: "btn-success"
            },
            danger: {
                label: "Delete",
                className: "btn-danger",
                callback: function() {
                    if($("#removeUserConfirmTextBox").val() == "delete"){
                        var data = {id: id};
                        doPost("/deleteUser", data, function (resp) {
                            if (resp.status == 200) {
                                removeFromDataset(usersDataSet, "user" + id);
                                showUserDataTable();
                            }
                            else {
                                bootbox.alert("<b>An error has occurred while deleting the user.</b><br/>" + (typeof resp.msg == "string" ? resp.msg : ""));
                            }
                        }, function (err) {
                            bootbox.alert("Error: " + err);
                        });
                    } else {
                        bootbox.alert("You typed the wrong word.");
                    }
                }
            }
        }
    });
}

function editUser(id){
    $("#addUserPanelBtn").click();
    $("#addingNewUser").val("false");
    $("#editingUser").val(id);
    $("#passwordTxt").attr("disabled", "disabled");
    $("#userEmailTxt").val(getFromDataSet(usersDataSet, "user" + id, 2));
}

function showUserDataTable() {
    $('#usersListTbl').dataTable().fnDestroy();
    $('#usersListTbl').dataTable({
        destroy: true,
        data: usersDataSet,
        paging: false,
        searching: true,
        autoWidth: false,
        "columns": [
            { "data": "1" },
            { "data": "2" },
            { "data": "3" }
        ],
        fnCreatedRow: function (nRow, aData, iDataIndex) {
            if (aData[8] == 1) {
                $(nRow).addClass("disabled_row");
            }
        }
    });
    $("[data-toggle='tooltip']").tooltip();
}
function setupHandlers(){
    $("#addUserPanel").hide();
    $("#addUserPanelBtn").click(function () {
        $("#addUserPanel").show("fast");
        $("#addingNewUser").val(true);
        $("#userEmailTxt").val("");
        $("#passwordTxt").val("");
        $("#passwordTxt").removeAttr("disabled");
        $("#editingUser").val("");
        $("#addUserPanelBtn").hide();
    });
    $("#cancelAddUserBtn").click(function () {
        $("#addUserPanelBtn").show();
        $("#addUserPanel").hide("fast");
    });
}

function changeAdminPassword(){
    bootbox.dialog({
        message: $("#changePwdDiv").html(),
        title: "Changing Administrator Password",
        buttons: {
            success: {
                label: "Cancel",
                className: "btn-success"
            },
            danger: {
                label: "Delete",
                className: "btn-danger",
                callback: function() {
                    if($("#newPassword").val() == $("#confirmNewPassword").val()) {
                        doPost("/changePassword", {current: $("#currentPassword").val() ,newPwd: $("#newPassword").val()}, function (resp) {
                            if (resp.status == 200) {

                            }
                            else {
                                bootbox.alert("<b>An error has occurred while changing the password.</b><br/>" + (typeof resp.msg == "string" ? resp.msg : ""));
                            }
                        }, function (err) {
                            bootbox.alert("Error: " + err);
                        });
                    } else {
                        bootbox.alert("The new password and confirm password doesn't match.");
                    }
                }
            }
        }
    });
}