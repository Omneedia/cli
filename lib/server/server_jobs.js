var fs = require("fs");
var path = require("path");
var ora = require("ora");
var chalk = require("chalk");
var rootOS = require("os").homedir() + "/oa-cli";
var Queue = require("bull");
var IO = require("socketcluster-client");
if (process.env.ENV == "prod") var rootOS = "";
if (!global.job) global.job = {};

if (process.env.ENV == "prod") process.argv.push("--prod");

global.settings = JSON.parse(process.env.settings);

if (global.settings.environment) {
  if (global.settings.environment.server)
    process.env = Object.assign(
      process.env,
      global.settings.environment.server
    );
}

if (process.env.dir) {
  global.dir = process.env.dir;
  global.config = JSON.parse(process.env.config);

  global.project = {
    home: path.normalize(global.dir + "/src"),
  };
  var manifest = global.dir + "/manifest.yaml";
} else {
  global.dir = process.cwd();
  global.project = {
    home: path.normalize(global.dir),
  };
  var manifest = global.project.home + "/manifest.yaml";
}

if (process.env.ENV == "prod") {
  var socket = IO.create({
    hostname: "app",
    port: 8000,
  });
} else {
  var socket = IO.create({
    hostname: "localhost",
    port: process.env.SOCKETCLUSTER_PORT || 8000,
  });
}

global.project.bin = global.dir + "/bin";
global.project.api = global.project.home + "/api";
global.project.fn = global.project.home + "/services";
global.project.res = global.project.home + "/resources";
global.project.culture = global.project.home + "/culture";
global.project.auth = global.project.home + "/auth";
global.project.system = global.project.home + "/system";
global.project.jobs = global.project.home + "/jobs";
global.project.io = global.project.home + "/io";
global.project.dist = global.dir + "/dist";
global.project.config = global.dir + "/config";
var dir = [];
try {
  dir = fs.readdirSync(global.project.jobs);
} catch (e) {
  return;
}
if (dir.length == 0) return;

/// Implement disabled job

console.log(" ");
spinner = ora("Starting job manager...").start();

function check_redis(cb) {
  var redis = require("redis");

  var client = redis.createClient();
  client.on("error", function (err) {});
  client.on("connect", function (err) {
    cb();
  });
}

fs.readFile(manifest, "utf-8", function (e, r) {
  manifest = require("yaml").parse(r);
  global.manifest = manifest;
  App = require("./lib/global")();
  App.io = {
    _channel: {},
    publish: async function (id, o) {
      var me = this;
      if (!me._channel[id]) {
        me._channel[id] = socket.subscribe(id);
        await me._channel[id].listener("subscribe").once();
      }
      this._channel[id].transmitPublish(JSON.stringify(o));
    },
  };

  check_redis(function () {
    spinner.succeed("Job server started.");
    global.POOL = require("./lib/dbpool")();
    for (var i = 0; i < dir.length; i++) {
      if (dir[i].indexOf(".js") > -1) {
        spinner = ora(
          "Loading job " + chalk.bold(dir[i].split(".js")[0])
        ).start();

        var mod = require(global.project.jobs + "/" + dir[i]);
        mod = Object.assign(mod, {
          publish: function (msg) {
            App.io.publish(dir[i].split(".js")[0], msg);
          },
        });

        function rotatelogs(job, cb) {
          if (global.settings.jobs) {
            for (var z = 0; z < global.settings.jobs.length; z++) {
              var jx = global.settings.jobs[z];
              if (jx.name == job) {
                if (!jx.rotate) return cb();
                var rotate = jx.rotate;
                var dir = glob.getJob() + "/" + jx.name;
                fs.readdir(dir, function (err, files) {
                  files = files
                    .map(function (fileName) {
                      return {
                        name: fileName,
                        time: fs.statSync(dir + "/" + fileName).mtime.getTime(),
                      };
                    })
                    .sort(function (a, b) {
                      return a.time - b.time;
                    })
                    .map(function (v) {
                      return v.name;
                    });
                  if (files.length > rotate) {
                    var counter = files.length - rotate;
                    for (var i = 0; i < counter; i++)
                      fs.unlink(dir + "/" + files[i], function () {});
                  }
                  cb();
                });
                return;
              }
            }
            cb();
          }
        }
        if (process.env.ENV != "prod") var params = {};
        else
          var params = {
            redis: { port: 6379, host: "cache" },
          };
        if (mod.params) params = Object.assign(params, mod.params);

        global.job[dir[i].split(".js")[0]] = new Queue(
          dir[i].split(".js")[0],
          params
        );

        global.job[dir[i].split(".js")[0]].clean(0);

        // Define a local completed event

        global.job[dir[i].split(".js")[0]].process(function (job, done) {
          //global.job[job.queue.name].close();
          job.publish = function (msg) {
            App.io.publish(job.queue.name, msg);
          };
          mod.init(job, done);
        });
        if (mod.completed)
          global.job[dir[i].split(".js")[0]].on("completed", mod.completed);
        if (mod.failed)
          global.job[dir[i].split(".js")[0]].on("failed", mod.failed);

        if (global.settings.jobs) {
          for (var z = 0; z < global.settings.jobs.length; z++) {
            var jx = global.settings.jobs[z];
            if (jx.name == dir[i].split(".js")[0]) {
              if (jx.data) var data = jx.data;
              else var data = {};
              if (!jx.disabled) {
                global.job[dir[i].split(".js")[0]].add(
                  data,
                  {
                    jobId:
                      require("shortid").generate() +
                      require("shortid").generate(),
                    repeat: { cron: jx.cron },
                  },
                  function (e, r) {}
                );
              }
            }
          }
        }

        spinner.succeed(
          "OK: job " + chalk.bold(dir[i].split(".js")[0]) + " loaded."
        );
      }
    }
  });
});
