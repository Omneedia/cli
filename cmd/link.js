module.exports = function (args, userdir) {
  var sep = require("path").sep;
  var prettyjson = require("prettyjson");
  var shelljs = require("shelljs");
  const logSymbols = require("log-symbols");
  var chalk = require("chalk");
  var fs = require("fs");
  var boxen = require("boxen");
  var ora = require("ora");
  const git = require("isomorphic-git");
  var yaml = require("yaml");
  var error = require("../lib/utils/error");
  var inquirer = require("inquirer");
  const globby = require("globby");
  var http = require("http");

  function onlyLetters(string) {
    return string
      .toLowerCase()
      .replace(/[^a-z0-9 ]/gi, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\ /g, "-");
  }

  console.log(
    boxen(chalk.cyan(" LINK "), {
      borderStyle: "round",
      float: "center",
      borderColor: "cyan",
    })
  );
  if (!global.Auth.userid) return error("YOU ARE NOT LOGGED IN.");
  var prj_id = onlyLetters(global.manifest.title) + "-" + global.manifest.uid;

  var spinner = ora("creating project: " + chalk.bold(prj_id));
  spinner.start();
  global.request(
    {
      url: global.Auth.api + "/api/project/link",
      method: "POST",
      form: {
        project: prj_id,
        description: global.manifest.description,
        title: global.manifest.title,
      },
      headers: {
        "private-token": global.token,
      },
    },
    function (e, r, b) {
      if (e) return spinner.fail("SERVICE IS UNREACHABLE");
      b = JSON.parse(b);
      if (b.message) {
        if (b.message.name) {
          return spinner.fail("This project is already linked.");
        }
        return;
      }
      if (b.error) return spinner.fail(b.error);
      spinner.succeed("project created.");
      spinner = ora("creating commit");
      spinner.start();
      global.manifest.uri = b.project.web_url.split("://")[1];
      function addtogit(paths, ndx, cb) {
        if (!paths[ndx]) return cb();
        var dir = global.dir;
        git.add({ fs, dir, filepath: paths[ndx] }).then(function (x) {
          addtogit(paths, ndx + 1, cb);
        });
      }
      return fs.writeFile(
        global.dir + "/manifest.yaml",
        require("yaml").stringify(global.manifest),
        function (e) {
          globby(["./**", "./**/.*"], { gitignore: true }).then(function (
            paths
          ) {
            var dir = global.dir;
            addtogit(paths, 0, function () {
              git
                .commit({
                  fs,
                  dir,
                  message: "link project",
                  author: {
                    name: global.Auth.name,
                    email: global.Auth.email,
                  },
                })
                .then(function (c) {
                  spinner.succeed("project commit #" + c);
                  var remote_url =
                    "https://oauth2:" +
                    global.Auth.tokens.api +
                    "@" +
                    global.manifest.uri;
                  git
                    .addRemote({
                      fs,
                      dir: global.dir,
                      remote: "origin",
                      url:
                        "https://oauth2:" +
                        global.Auth.tokens.api +
                        "@" +
                        global.manifest.uri,
                    })
                    .then(function (o) {
                      spinner = ora("pushing your code to remote repository");
                      spinner.start();
                      git
                        .push({
                          fs,
                          http,
                          dir: global.dir,
                          remote: "origin",
                          ref: "master",
                        })
                        .then(function (o) {
                          spinner.succeed("code pushed.");
                          console.log("\n");
                          console.log(
                            "Your repository URL: " +
                              chalk.bold.cyan("https://" + global.manifest.uri)
                          );
                          console.log(
                            "Your webapp URL: " +
                              chalk.bold.cyan(b.external_url)
                          );
                          console.log("\n");
                          console.log(
                            "\n" +
                              logSymbols.success +
                              chalk.bold(" Your project is now linked.\n")
                          );
                        });
                    });
                });
            });
          });
        }
      );
    }
  );
};
