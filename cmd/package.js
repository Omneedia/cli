module.exports = function (args, root) {
  var REGISTRY_NPM = "https://npm.siipro.fr";
  var url_modules =
    "https://gitlab.com/api/v4/projects/20222374/repository/tree";
  var oa_registry_url = "https://gitlab.com/oa-registry/";
  var oa_registry_pkg =
    oa_registry_url +
    "repository/-/raw/master/%PACKAGE/package.yaml?inline=true";
  var oa_registry_zip =
    oa_registry_url +
    "repository/-/archive/master/repository-master.zip?path=PACKAGE";
  var findUp = require("find-up");
  var prettyjson = require("prettyjson");
  var shelljs = require("shelljs");
  var logSymbols = require("log-symbols");
  var chalk = require("chalk");
  const fs = require("node-fs-extra");
  const path = require("path");
  var boxen = require("boxen");
  var yaml = require("yaml");
  var error = require("../lib/utils/error");
  var stripCssComments = require("strip-css-comments");
  var rmdir = require("rimraf");
  const ora = require("ora");
  var unzip = require("unzip-stream");
  var rimraf = require("rimraf");
  var mod = [];
  var MOD = [];

  var JS = [];
  var CSS = [];
  var resources = [];
  var ITEMS = [];

  Array.prototype.remove = function () {
    var what,
      a = arguments,
      L = a.length,
      ax;
    while (L && this.length) {
      what = a[--L];
      while ((ax = this.indexOf(what)) !== -1) {
        this.splice(ax, 1);
      }
    }
    return this;
  };

  function install_pkg() {
    if (!args[1]) return error("NO MODULE SPECIFIED");
    findUp("manifest.yaml").then(function (o) {
      if (!o) return error("You must be inside an omneedia project directory");
      fs.readFile(o, "utf-8", function (e, r) {
        var pkg = yaml.parse(r);
        pkg.packages.push(args[1]);
        var shelljs = require("shelljs");
        var dir = path.dirname(o) + "/bin/";
        var spinner = ora("Updating application").start();
        fs.mkdir(dir, function (e, r) {
          fs.readFile(dir + "package.json", "utf-8", function (e, r) {
            if (e)
              return error("You must run oa install before adding module.");
            shelljs.cd(dir);
            shelljs.exec(
              "npm_config_registry=" + REGISTRY_NPM + " npm install " + args[1],
              { silent: true },
              function (a, b, c) {
                if (a == 0) {
                  fs.writeFile(o, yaml.stringify(pkg), function () {
                    spinner.succeed("application updated.\n");
                  });
                } else {
                  spinner.fail(
                    "CAN'T UPDATE APPLICATION. SEE LOGS FOR DETAILS"
                  );
                  console.log("------");
                  console.log(c);
                  console.log("------");
                  return;
                }
              }
            );
          });
        });
      });
    });
  }

  function uninstall_pkg() {
    if (!args[1]) return error("NO MODULE SPECIFIED");
    findUp("manifest.yaml").then(function (o) {
      if (!o) return error("You must be inside an omneedia project directory");
      fs.readFile(o, "utf-8", function (e, r) {
        var pkg = yaml.parse(r);
        if (pkg.modules.indexOf(args[1]) == -1)
          return error("PACKAGE NOT FOUND");
        pkg.packages.remove(args[1]);
        var shelljs = require("shelljs");
        var dir = path.dirname(o) + "/bin/";
        var spinner = ora("Updating application").start();
        fs.mkdir(dir, function (e, r) {
          fs.readFile(dir + "package.json", "utf-8", function (e, r) {
            if (e)
              return error("You must run oa install before deleting module.");
            shelljs.cd(dir);
            shelljs.exec(
              "npm_config_registry=" +
                REGISTRY_NPM +
                " npm uninstall " +
                args[1],
              { silent: true },
              function (a, b, c) {
                if (a == 0) {
                  fs.writeFile(o, yaml.stringify(pkg), function () {
                    spinner.succeed("application updated.\n");
                  });
                } else {
                  spinner.fail(
                    "CAN'T UPDATE APPLICATION. SEE LOGS FOR DETAILS"
                  );
                  console.log("------");
                  console.log(c);
                  console.log("------");
                  return;
                }
              }
            );
          });
        });
      });
    });
  }

  if (args[0] == "install") install_pkg();

  if (args[0] == "uninstall") uninstall_pkg();
};
