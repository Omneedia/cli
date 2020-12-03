const DEMO = false;
const fork = require("child_process").fork;
const redis = require("redis");
var yaml = require("yaml");
var chalk = require("chalk");
var ora = require("ora");
var Queue = require("bull");
var fs = require("fs");

global.dir = __dirname;

global.project = {
  home: global.dir,
};

global.project.bin = global.dir + "/bin";
global.project.api = global.project.home + "/services";
global.project.res = global.project.home + "/resources";
global.project.culture = global.project.home + "/culture";
global.project.auth = global.project.home + "/auth";
global.project.system = global.project.home + "/system";
global.project.io = global.project.home + "/io";

var forkServer = function (addendum) {
  var server = __dirname;
  if (addendum) {
    if (process.argv.indexOf(addendum) == -1) process.argv.push(addendum);
  }
  return (forked = fork(server + "/server.js", process.argv, {
    env: process.env,
  }));
};

var spinner;

var jobServer = function () {
  console.log(" ");
  spinner = ora("Starting job server...").start();

  //require("./system/jobs");

  spinner.succeed("Job server started.");
  var dir = fs.readdirSync(global.dir + "/jobs");
  global.POOL = require("./lib/dbpool")();
  App = {
    db: require("./lib/db"),
    getData: function () {
      if (DEMO) var dir = "./data";
      else var dir = "/data";
      try {
        fs.mkdirSync(dir);
      } catch (e) {}
      return dir;
    },
    getJob: function () {
      if (DEMO) var dir = "./data";
      else var dir = "/data";
      try {
        fs.mkdirSync(dir + "/jobs");
      } catch (e) {}
      return dir + "/jobs";
    },
    uuid: function () {
      return require("shortid").generate();
    },
    using: function (unit) {
      var builtin = [
        "rxjs",
        "assert",
        "buffer",
        "child_process",
        "cluster",
        "crypto",
        "dgram",
        "dns",
        "events",
        "fs",
        "http",
        "https",
        "net",
        "os",
        "path",
        "querystring",
        "readline",
        "stream",
        "string_decoder",
        "timers",
        "tls",
        "tty",
        "url",
        "util",
        "v8",
        "vm",
        "zlib",
        "db",
      ];
      //built in classes
      if (builtin.indexOf(unit) > -1) {
        if (unit == "db") unit = "@omneedia/db";
        return require(unit);
      }
      if (process.env.ENV == "prod") return require(unit);
      return require(global.project.bin + sep + "node_modules" + sep + unit);
    },
  };
  for (var i = 0; i < dir.length; i++) {
    if (dir[i].indexOf(".js") > -1) {
      spinner = ora(
        "Loading job " + chalk.bold(dir[i].split(".js")[0])
      ).start();
      var mod = require(global.dir + "/jobs/" + dir[i]);

      var params = {
        redis: { port: 6379, host: "cache" },
      };
      if (mod.params) params = Object.assign(params, mod.params);
      var TQ = new Queue(dir[i].split(".js")[0], params);

      TQ.process(mod.init);
      if (mod.completed) TQ.on("completed", mod.completed);
      if (mod.failed) TQ.on("failed", mod.failed);

      if (global.settings.jobs) {
        for (var z = 0; z < global.settings.jobs.length; z++) {
          var jx = global.settings.jobs[z];
          if (jx.name == dir[i].split(".js")[0]) {
            if (jx.data) var data = jx.data;
            else var data = {};
            if (!jx.disabled)
              TQ.add(data, { repeat: { cron: jx.cron } }, function (e, r) {});
          }
        }
      }
      spinner.succeed("OK: job " + chalk.bold(dir[i].split(".js")[0]));
    }
  }
};

if (DEMO) var _settings = global.dir + "/config/settings.json";
else var _settings = "/run/secrets/config";
//_settings = __dirname + "/../config/settings.json";
global.settings = JSON.parse(require("fs").readFileSync(_settings, "utf-8"));

if (global.settings.environment) {
  if (global.settings.environment.server)
    process.env = Object.assign(
      process.env,
      global.settings.environment.server
    );
}

var manifest = yaml.parse(
  require("fs").readFileSync("./manifest.yaml", "utf-8")
);

console.log("\n- Starting " + chalk.bold(manifest.namespace));
console.log("  " + chalk.cyan(manifest.title));
console.log("  " + chalk.cyan(manifest.description));
console.log("  " + chalk.cyan(manifest.copyright));
console.log("  version " + chalk.cyan.bold(manifest.version) + "\n");

spinner = ora("Connecting to session manager").start();

if (!process.env.SESSION) throw "NO SESSION ENV";

function connect() {
  var client = redis.createClient(process.env.SESSION);
  client.on("connect", function () {
    spinner.succeed("Session manager started.");
    require("./lib/dbtest")(function () {
      if (process.env.JOB) jobServer();
      else forkServer();
    });
  });
  client.on("error", function () {});
}

connect();
