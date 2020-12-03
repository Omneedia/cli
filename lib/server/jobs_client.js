module.exports = function () {
  var Queue = require("bull");
  var fs = require("fs");
  var dirjobs = global.project.jobs;
  var dir;
  global.job = {
    call: function (d, params) {
      if (!params) params = {};
      var jobid = require("shortid").generate() + require("shortid").generate();
      this._processes[d].add(params, {
        jobId: jobid,
      });
      return jobid;
    },
    _processes: {},
  };
  fs.readdir(dirjobs, function (e, dir) {
    if (e) dir = [];
    for (var i = 0; i < dir.length; i++) {
      if (dir[i].indexOf(".js") > -1) {
        if (process.env.ENV != "prod")
          global.job._processes[dir[i].split(".js")[0]] = new Queue(
            dir[i].split(".js")[0]
          );
        else
          global.job._processes[dir[i].split(".js")[0]] = new Queue(
            dir[i].split(".js")[0],
            "redis://cache"
          );
      }
    }
  });
};
