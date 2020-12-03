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
    boxen(chalk.cyan(" VERSION "), {
      borderStyle: "round",
      float: "center",
      borderColor: "cyan",
    })
  );
  if (args.length == 0) {
    return console.log(
      "current version is " + chalk.bold(global.manifest.version) + "\n"
    );
  } else {
    var semver = require("semver");
    if (args.indexOf("--patch") > -1)
      global.manifest.version = semver.inc(global.manifest.version, "patch");
    if (args.indexOf("--minor") > -1)
      global.manifest.version = semver.inc(global.manifest.version, "minor");
    if (args.indexOf("--major") > -1)
      global.manifest.version = semver.inc(global.manifest.version, "major");
    fs.writeFileSync(
      global.dir + "/manifest.yaml",
      require("yaml").stringify(global.manifest)
    );
    console.log(
      logSymbols.success +
        " done.\n" +
        global.manifest.title +
        " version is now " +
        chalk.bold(global.manifest.version) +
        "\n"
    );
  }
};
