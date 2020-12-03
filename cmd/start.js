module.exports = function (args, root) {
  var boxen = require("boxen");
  var chalk = require("chalk");
  var fs = require("fs");
  var yaml = require("yaml");
  var error = require("../lib/utils/error");
  var upload_dir = root + "/uploads";
  var session_dir = root + "/sessions";
  var updateApp = require("../lib/update-app");
  var findUp = require("find-up");
  var logSymbols = require("log-symbols");
  var ora = require("ora");
  var chokidar = require("chokidar");
  const winston = require("winston");
  var Queue = require("bull");
  var rootOS = require("os").homedir() + "/oa-cli";
  var redis = require("redis");
  //const debugFormat = require("winston-format-debug").DebugFormat;

  try {
    fs.mkdirSync(rootOS + "/data");
  } catch (e) {}

  global.log = {
    console: function (msg) {
      console.log(msg);
    },
    info: function (msg) {
      console.info(msg);
    },
  };

  const fork = require("child_process").fork;

  var forkServer = function (addendum) {
    var server = __dirname + "/../lib/server";
    if (addendum) {
      if (process.argv.indexOf(addendum) == -1) process.argv.push(addendum);
    }
    return fork(server + "/server.js", process.argv, {
      env: {
        dir: global.dir,
        config: JSON.stringify(global.config),
        upload_dir: upload_dir,
        session_dir: session_dir,
      },
    });
  };

  var forkJobs = function (addendum) {
    var server = __dirname + "/../lib/server";
    if (addendum) {
      if (process.argv.indexOf(addendum) == -1) process.argv.push(addendum);
    }
    var o = process.env;
    o.dir = global.dir;
    o.settings = JSON.stringify(global.settings);
    o.config = JSON.stringify(global.config);
    return fork(server + "/server_jobs.js", process.argv, {
      env: o,
    });
  };

  findUp("manifest.yaml").then(function (test) {
    if (!test) return error("You must be inside an omneedia project directory");
    global.dir = require("path").dirname(test);
    global.project = {
      home: require("path").dirname(test),
    };

    global.project.bin = global.dir + "/bin";
    global.project.source = global.project.home + "/src";
    global.project.api = global.project.source + "/services";
    global.project.res = global.project.source + "/resources";
    global.project.culture = global.project.source + "/culture";
    global.project.auth = global.project.source + "/auth";
    global.project.system = global.project.source + "/system";
    global.project.jobs = global.project.source + "/jobs";
    global.project.io = global.project.source + "/io";
    fs.readFile(test, "utf-8", function (e, r) {
      global.manifest = yaml.parse(r);
      console.log(
        boxen(chalk.cyan(" " + manifest.namespace + " "), {
          float: "center",
          borderStyle: "round",
          borderColor: "cyan",
        })
      );

      console.log("\n- Starting " + chalk.bold(manifest.namespace));
      console.log("  " + chalk.cyan(manifest.title));
      console.log("  " + chalk.cyan(manifest.description));
      console.log("  " + chalk.cyan(manifest.copyright));
      console.log("  version " + chalk.cyan.bold(manifest.version) + "\n");

      var _settings = global.dir + "/config/settings.json";
      if (process.argv.indexOf("--prod") > -1)
        _settings = "/run/secrets/config";
      if (process.argv.indexOf("--dev") > -1) {
        _settings = "./config/settings.json";
        try {
          fs.mkdirSync("./config/");
        } catch (e) {}
        try {
          fs.copyFileSync("../config/settings.json", "./config/settings.json");
        } catch (e) {}
      }
      //return console.log(_settings);
      try {
        var r = fs.readFileSync(_settings, "utf-8");
        global.settings = JSON.parse(r);
      } catch (e) {
        global.settings = {
          auth: [],
          db: [],
          jobs: [],
          environment: {
            server: {},
            client: {},
          },
        };
        try {
          fs.mkdirSync(require("path").dirname(_settings));
        } catch (e) {}
        fs.writeFileSync(_settings, JSON.stringify(global.settings, null, 4));
      }

      if (process.env.PROXY) {
        var request = require("request");
        global.request = request.defaults({
          proxy: process.env.PROXY,
        });
      }

      function startServer() {
        console.log("");
        var forked = forkServer();
        var watcher = chokidar.watch(global.project.home + "/", {
          ignored: /^\./,
          persistent: true,
          ignoreInitial: true,
        });

        watcher
          .on("add", function (path) {
            if (path.indexOf(".DS_Store") > -1) return;
            if (path.indexOf("/bin/www") > -1) return;
            if (path.indexOf("/src/app/") > -1) return;
            if (path.indexOf("/src/resources/") > -1) return;
            if (path.indexOf("/node_modules/") > -1) return;
            global.log.info("add file:" + path.split(global.dir)[1]);
            if (path.indexOf("/.template/") > -1) {
              forked.kill();
              forked = forkServer("--reload");
              return;
            }
            if (path.indexOf("/auth/") > -1) {
              forked.kill();
              forked = forkServer("--reload");
              return;
            }
            if (path.indexOf("/io/") > -1) {
              forked.kill();
              forked = forkServer("--reload");
              return;
            }
            if (path.indexOf("/processes/") > -1) {
              forked.kill();
              forked = forkServer("--reload");
              return;
            }
            if (path.indexOf("/system/") > -1) {
              forked.kill();
              forked = forkServer("--reload");
              return;
            }
            if (path.indexOf("/services/") > -1) {
              forked.kill();
              forked = forkServer("--reload");
              return;
            }
          })
          .on("change", function (path) {
            if (path.indexOf(".DS_Store") > -1) return;
            if (path.indexOf("/bin/www") > -1) return;
            if (path.indexOf("/src/app/") > -1) return;
            if (path.indexOf("/src/resources/") > -1) return;
            global.log.info("change file: " + path.split(global.dir)[1]);
            if (path.indexOf("/.template/") > -1) {
              forked.kill();
              forked = forkServer("--reload");
              return;
            }
            if (path.indexOf("/auth/") > -1) {
              forked.kill();
              forked = forkServer("--reload");
              return;
            }
            if (path.indexOf("/io/") > -1) {
              forked.kill();
              forked = forkServer("--reload");
              return;
            }
            if (path.indexOf("/processes/") > -1) {
              forked.kill();
              forked = forkServer("--reload");
              return;
            }
            if (path.indexOf("/system/") > -1) {
              forked.kill();
              forked = forkServer("--reload");
              return;
            }
            if (path.indexOf("/api/") > -1) {
              forked.kill();
              forked = forkServer("--reload");
              return;
            }
            if (path.indexOf("/services/") > -1) {
              forked.kill();
              forked = forkServer("--reload");
              return;
            }
          })
          .on("unlink", function (path) {
            if (path.indexOf(".DS_Store") > -1) return;
            if (path.indexOf("/bin/www") > -1) return;
            if (path.indexOf("/src/app/") > -1) return;
            if (path.indexOf("/src/resources/") > -1) return;
            global.log.info("unlink file: " + path.split(global.dir)[1]);
            if (path.indexOf("/.template/") > -1) {
              forked.kill();
              forked = forkServer("--reload");
              return;
            }
            if (path.indexOf("/auth/") > -1) {
              forked.kill();
              forked = forkServer("--reload");
              return;
            }
            if (path.indexOf("/io/") > -1) {
              forked.kill();
              forked = forkServer("--reload");
              return;
            }
            if (path.indexOf("/processes/") > -1) {
              forked.kill();
              forked = forkServer("--reload");
              return;
            }
            if (path.indexOf("/system/") > -1) {
              forked.kill();
              forked = forkServer("--reload");
              return;
            }
            if (path.indexOf("/services/") > -1) {
              forked.kill();
              forked = forkServer("--reload");
              return;
            }
          })
          .on("error", function (error) {
            global.log.info(chalk.red.bold("error: ") + error);
          });
      }

      function startJobServer(cb) {
        var forkedJobs = forkJobs();
        var watcher = chokidar.watch(global.project.jobs, {
          ignored: /^\./,
          persistent: true,
          ignoreInitial: true,
        });
        watcher
          .on("add", function (path) {
            if (path.indexOf(".DS_Store") > -1) return;
            if (path.indexOf("/node_modules/") > -1) return;
            global.log.info("add file:" + path.split(global.dir)[1]);
            try {
              forkedJobs.kill();
            } catch (e) {}
            forkedJobs = forkJobs("--reload");
          })
          .on("change", function (path) {
            if (path.indexOf(".DS_Store") > -1) return;
            if (path.indexOf("/node_modules/") > -1) return;
            global.log.info("change file: " + path.split(global.dir)[1]);
            try {
              forkedJobs.kill();
            } catch (e) {}
            forkedJobs = forkJobs("--reload");
          })
          .on("unlink", function (path) {
            if (path.indexOf(".DS_Store") > -1) return;
            if (path.indexOf("/node_modules/") > -1) return;
            if (path.indexOf("/bin/www") > -1) return;
            global.log.info("unlink file: " + path.split(global.dir)[1]);
            try {
              forkedJobs.kill();
            } catch (e) {}
            forkedJobs = forkJobs("--reload");
          })
          .on("error", function (error) {
            global.log.info(chalk.red.bold("error: ") + error);
          });
        if (cb) cb();
      }

      require("../lib/server/lib/dbtest")(function () {
        fs.readFile(root + "/.rid", function (e, s) {
          if (e) return startServer();
          if (s) {
            if (process.argv.indexOf("--server") > -1) return startServer();
            startJobServer(startServer);
          }
        });
      });
    });
  });
};
