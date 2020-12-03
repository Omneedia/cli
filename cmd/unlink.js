module.exports = function (args, userdir) {
  var sep = require("path").sep;
  var prettyjson = require("prettyjson");
  var shelljs = require("shelljs");
  const logSymbols = require("log-symbols");
  var chalk = require("chalk");
  var fs = require("fs");
  var boxen = require("boxen");
  var yaml = require("yaml");
  var error = require("../lib/utils/error");
  var inquirer = require("inquirer");

  console.log(
    boxen(chalk.cyan(" UNLINK "), {
      borderStyle: "round",
      float: "center",
      borderColor: "cyan",
    })
  );
  if (!global.Auth.userid) return error("YOU ARE NOT LOGGED IN.");
  var prj_id = global.manifest.uri;
  prj_id = prj_id.substr(prj_id.indexOf("/") + 1, prj_id.length);
  prj_id = prj_id.replace("/", "%2F");
  global.request(
    {
      url: global.Auth.api + "/api/project/unlink",
      method: "DELETE",
      headers: {
        "private-token": global.token,
        project: prj_id,
      },
    },
    function (e, r, b) {
      if (e) return error("SERVICE IS UNREACHABLE");
      b = JSON.parse(b);
      if (b.err) return error(b.err);
      if (b.message) {
        if (b.message.name) {
          error("This project is already linked.");
        }
        return;
      }
      if (b.error) return error(b.error);
      global.manifest.uri = "-";
      return fs.writeFile(
        global.dir + "/manifest.yaml",
        require("yaml").stringify(global.manifest),
        function (e) {
          console.log("\n" + logSymbols.success + " project unlinked\n");
        }
      );
    }
  );
};
