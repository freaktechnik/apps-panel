const { PanelView } = require("jetpack-panelview");
const workaround = require("jetpack-panelview/lib/panelview/workaround");

const { open } = require("sdk/tabs");
const { ToggleButton } = require("sdk/ui");
const { get: _ } = require("sdk/l10n");
const { on } = require("sdk/system/events");

const { DOMApplicationRegistry } = require("resource://gre/modules/Webapps.jsm");
const { ManifestHelper } = require("resource://gre/modules/AppsUtils.jsm");

const FX_MARKETPLACE_URL = "https://marketplace.firefox.com";

let getButton = (name, icons, launchPath) => {
    return {
        type: 'button',
        label: name,
        icon: icons,
        onClick: () => open({url: launchPath})
    };
};

let getContentFromApps = () => {
    let ret = [];
    let apps = DOMApplicationRegistry.webapps;
    let { manifests } = DOMApplicationRegistry.doGetList();
    let icons, manifest;
    for(let id in apps) {
        icons = {};
        manifest = new ManifestHelper(manifests[id], apps[id].origin, apps[id].manifestURL);
        for(let size in manifest.icons) {
            icons[size] = manifest.iconURLForSize(size);
        }
        ret.push(getButton(apps[id].name, icons, manifest.fullLaunchPath()));
    }
    if(!ret.length) {
        ret.push({
            type: 'button',
            label: _("no_apps"),
            disabled: true,
            onClick: () => {}
        });
    }

    return ret;
};

let pv = new PanelView({
    id: 'apps-panel',
    title: _("panel_title"),
    content: getContentFromApps(),
    footer: {
        label: _("marketplace"),
        onClick: () => {
            open({ url: FX_MARKETPLACE_URL });
        }
    }
});

let button = ToggleButton({
    id: 'apps-panel-button',
    label: _("button_label"),
    icon: {
        "18": "./icon-18.png",
        "32": "./icon-32.png",
        "36": "./icon-36.png",
        "64": "./icon-64.png"
    },
    onClick: function(state) {
        if(state.checked) {
            pv.show(button);
        }
    }
});

pv.on("hide", () => {
    button.state("window", {checked: false});
});

workaround.applyButtonFix(button);

let listener = () => {
    pv.content = getContentFromApps();
};

listener();
on("webapps-installed", listener);
on("webapps-uninstall", listener);

