module.exports = function (args, root) {
  var findUp = require("find-up");
  var fs = require("fs");
  var yaml = require("yaml");
  var boxen = require("boxen");
  var chalk = require("chalk");
  var logSymbols = require("log-symbols");
  var error = require("../lib/utils/error");

  global.project = {
    home: global.dir,
  };

  console.log(
    boxen(chalk.cyan(" INSTALL "), {
      borderStyle: "round",
      float: "center",
      borderColor: "cyan",
    })
  );

  global.project.bin = global.dir + "/bin";
  global.project.api = global.project.home + "/services";
  global.project.res = global.project.home + "/resources";
  global.project.culture = global.project.home + "/culture";
  global.project.auth = global.project.home + "/auth";
  global.project.system = global.project.home + "/system";
  global.project.io = global.project.home + "/io";

  findUp("manifest.yaml").then(function (test) {
    if (!test) return error("You must be inside an omneedia project directory");
    fs.readFile(test, "utf-8", function (e, r) {
      global.manifest = yaml.parse(r);
      if (args.length == 0) require("../lib/update-app")(function () {});
    });
  });
  /**/
};
