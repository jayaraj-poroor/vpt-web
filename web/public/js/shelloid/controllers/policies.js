/**
 * Created by Harikrishnan on 16-09-2014.
 */

var policyDataSet = [];
var ejsCache = {};

function initPoliciesTab() {
    if (isLoggedIn()) {
        registerForm(addNodeForm());
        setupAddPolicyHandlers();
        refreshPoliciesList();
    }
    else {
        window.location = window.actualSite + "/?msgId=1";
    }
}

var addNodeForm = function () {
    var form = {};
    form.name = 'frmPolicy';
    form.obj = $('#' + form.name);
    form.validator = form.obj.validate();
    form.addPolicyBtn = function (e) {
        e.preventDefault();
        form.obj.validate();
        if (form.validator.form()) {
            var data = {
                sPolicyName: undefined,
                sPolicyApp: undefined,
                addingNewPolicy: undefined,
                editingPolicyId: undefined
            };
            fillModel(form.obj, data);
            if (data.addingNewPolicy == -1){
                bootbox.alert("Please select an application.");
            } else {
                if (validatePolicyAppEntry()){
                    data.jsonString = getPolcyAppJson();
                    addWaitingOverlay();
                    doPost("/addPolicy", data, function (resp) {
                        removeWaitingOverlay();
                        if (resp.status == 200) {
                            if (data.addingNewPolicy == "true") {
                                var dt = new Date().getTime();
                                policyDataSet.push(getNewPolicyRow(resp.insertId, data.sPolicyName, data.sPolicyApp, dt, dt));
                            }
                            else {
                                updateDataSet(policyDataSet, "node" + data.editingPolicyId, "1", data.sPolicyName);
                                updateDataSet(policyDataSet, "node" + data.editingPolicyId, "2", data.sPolicyApp);
                            }
                            showPolicyDataTable();
                            $("#addingNewPolicy").val("true");
                            $("#editingPolicyId").val("");
                            $("#sPolicyName").val("");
                            $("#sPolicyApp").val("-1");
                            $("#addPolicyCancelBtn").click();
                        }
                        else {
                            console.log(resp);
                            bootbox.alert("<b>An error has occurred while adding the policy.</b><br/>" + (typeof resp.msg == "string" ? resp.msg : ""));
                        }
                    }, function (err) {
                        removeWaitingOverlay();
                        console.log(err);
                        bootbox.alert("Server Error: " + err.error);
                    });
                } else {
                    bootbox.alert('Please fix input errors in policy application fields and try again.');
                }
            }
        }
        else {
            bootbox.alert('Please fix input errors and try again.');
        }
    };
    return form;
};


function setupAddPolicyHandlers() {
    $("#addPolicyPanel").hide();
    $("#addPolicyPanelBtn").click(function (e) {
        e.preventDefault();
        $("#addPolicyPanel").show("fast");
        $("#addPolicyPanelBtn").hide();
    });
    $("#addPolicyCancelBtn").click(function (e) {
        e.preventDefault();
        $("#addPolicyPanel").hide("fast");
        $("#addingNewPolicy").val("true");
        $("#editingPolicyId").val("");
        $("#sPolicyName").val("");
        $("#sPolicyApp").val("-1");
        $("#addPolicyPanelBtn").show();
    });
    addWaitingOverlay();
    doPost("/listApplications", {}, function (resp) {
        removeWaitingOverlay();
        if (resp.status == 200) {
            var policyCmb = $("#sPolicyApp");
            policyCmb.append("<option value='-1'>Select An Application</option>");
            for (var i = 0; i < resp.list.length; i++) {
                policyCmb.append("<option value='"+resp.list[i].app_id+"'>"+resp.list[i].app_name+"</option>");
            }
        }
        else {
            bootbox.alert("<b>An error has occurred while listing the applications.</b><br/>" + (typeof resp.msg == "string" ? resp.msg : ""));
        }
    }, function (err) {
        removeWaitingOverlay();
        console.log(err);
        bootbox.alert("Server Error: " + err.error);
    });
    $("#sPolicyApp").on("change", function (e){
        e.preventDefault();
        if ($(e.target.selectedOptions[0]).val() == -1) {
            $('#appContent').empty();
        } else {
            if (ejsCache[e.target.selectedOptions[0].text] == undefined) {
                addWaitingOverlay();
                doPost("/loadPolicyApp", {name: e.target.selectedOptions[0].text}, function (resp) {
                    removeWaitingOverlay();
                    var template = new EJS({text: resp});
                    var content = template.render();
                    $('#appContent').html(content);
                    ejsCache[e.target.selectedOptions[0].text] = content;
                }, function (err) {
                    removeWaitingOverlay();
                    if (err.error == 404) {
                        bootbox.alert("Can't load the structure for given ");
                    } else {
                        console.log(err);
                        bootbox.alert("Server Error: " + err.error);
                    }
                });
            } else {
                $('#appContent').html(ejsCache[e.target.selectedOptions[0].text]);
            }
        }
    });
}


function refreshPoliciesList() {
    addWaitingOverlay();
    doPost("/listPolicies", {}, function (resp) {
        removeWaitingOverlay();
        if (resp.status == 200) {
            policyDataSet = [];
            for (var i = 0; i < resp.list.length; i++) {
                policyDataSet.push(getNewPolicyRow(resp.list[i].policy_id, resp.list[i].policy_name, resp.list[i].app_name, resp.list[i].created_at, resp.list[i].last_modified_at));
            }
            showPolicyDataTable();
        }
        else {
            bootbox.alert("<b>An error has occurred while listing the policies.</b><br/>" + (typeof resp.msg == "string" ? resp.msg : ""));
        }
    }, function (err) {
        removeWaitingOverlay();
        console.log(err);
        bootbox.alert("Server Error: " + err.error);
    });
}


function showPolicyDataTable() {
    var table =  $('#policyListTbl');
    table.dataTable().fnDestroy();
    table.dataTable({
        destroy: true,
        data: policyDataSet,
        paging: false,
        searching: true,
        autoWidth: false,
        "columns": [
            { "data": "1" },
            { "data": "2" },
            { "data": "3" },
            { "data": "4" },
            { "data": "5" }
        ]
    });
}

function getNewPolicyRow(id, name, app_name, created_at, last_modified_at) {
    var actionTd = '<span class="glyphicon glyphicon-remove" onclick="deletePolicy(' + id + ')" data-toggle="tooltip" data-placement="top" title="Remove This Policy"></span>' +
        '<span class="glyphicon glyphicon-edit" onclick="editPolicy(' + id + ')"  data-toggle="tooltip" data-placement="top" title="Edit this Policy"></span>';
    var tr = {
        DT_RowId: "policy" + id,
        "1": name,
        "2": app_name,
        "3": moment(created_at).format("D MMM YYYY, h:mm a"),
        "4": moment(last_modified_at).format("D MMM YYYY, h:mm a"),
        "5": actionTd
    };
    return tr;
}

function editPolicy(id) {
    addWaitingOverlay();
    doPost("/getPolicyText", {id: id}, function (resp) {
        removeWaitingOverlay();
        if (resp.status == 200) {
            var node = $("#policy" + id).children();
            $("#addPolicyPanel").show("fast");
            $("#addPolicyPanelBtn").hide();
            $("#editingPolicyId").val(id);
            $("#sPolicyName").val(node.eq(0).text());
            $('#sPolicyApp option').each(function() {
                if($(this).text() == node.eq(1).text()) {
                    $("#sPolicyApp").val($(this).val());
                    return false;
                }
            });
            $("#sPolicyApp").trigger("change");
            $("#addingNewPolicy").val(false);

            if (fillControls != undefined) {
                fillControls(resp.text);
            } else {
                bootbox.alert("Can't fill data. Please try again.");
            }
        } else {
            bootbox.alert("<b>An error has occurred while getting the policy text.</b><br/>" + (typeof resp.msg == "string" ? resp.msg : ""));
        }
    }, function (err) {
        removeWaitingOverlay();
        console.log(err);
        bootbox.alert("Server Error: " + err.error);
    });
}


function deletePolicy(id) {
    bootbox.dialog({
        message: 'If you want to delete this policy, please type the word "delete" without double quotes in the below text box and click Delete <br/><br/><input type="text" class="form-control" id="removePolicyConfirmTextBox"/>',
        title: "Deleting Policy (" + getFromDataSet(policyDataSet, "policy" + id, "1" )+")",
        buttons: {
            success: {
                label: "Cancel",
                className: "btn-success"
            },
            danger: {
                label: "Delete",
                className: "btn-danger",
                callback: function() {
                    if($("#removePolicyConfirmTextBox").val() == "delete"){
                        var data = {id: id};
                        doPost("/deletePolicy", data, function (resp) {
                            if (resp.status == 200) {
                                removePolicyFromTableAndRefresh(id);
                            }
                            else if (resp.status == 201) {
                                bootbox.alert("Warning: " + resp.msg);
                            }
                            else {
                                bootbox.alert("Error: " + (typeof resp.msg == "string" ? resp.msg : "Can't delete Policy"));
                            }
                        }, function (err) {
                            console.log(err);
                            bootbox.alert("Error: " + (typeof err == "string" ? err : "Can't delete Policy"));
                        });
                    } else {
                        bootbox.alert("You typed the wrong word.");
                    }
                }
            }
        }
    });
}

function removePolicyFromTableAndRefresh(id) {
    removeFromDataset(policyDataSet, "policy" + id);
    showPolicyDataTable();
}
