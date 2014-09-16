window.views = {
    port_mappings: {type: "html", contentId: "portMappings_tab", initfn: initPortMappingsTab},
    devices: {type: "html", contentId: "devices_tab", initfn: initNodesTab},
    device_shares: {type: "html", contentId: "deviceShares_tab", initfn: initNodeSharesTab},
    profiles: {type: "html", contentId: "profiles_tab", initfn: initProfilesTab},
    invite: {type: "html", contentId: "invites_tab", initfn: initInviteTab},
    policies: {type: "html", contentId: "policies_tab", initfn: initPoliciesTab},
	_default: "devices"
};