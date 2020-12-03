module.exports = function (app, express) {
  global.authom = require("@omneedia/authom");

  global.authom.on("error", function (req, res, data) {
    // called when an error occurs during authentication
    console.log("-- ERROR ------");
    console.log(data);
    console.log("---------------");
    // Close the login window
    try {
      res.set("Content-Type", "text/html");
    } catch (e) {}
    res.end(
      '<html><body><script>window.opener.document.write(\'<html><head><title>CRASH</title><meta name="viewport" content="width=device-width, initial-scale=1" /><style>body{text-align:center;font-family:"Segoe UI",Tahoma,Geneva,Verdana,sans-serif}.content{width:200px;height:205px;background-color:white;position:absolute;left:0;right:0;top:0;bottom:0;margin:auto;max-width:100%;max-height:100%;overflow:auto}</style></head><body><div class="content"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M440.5 88.5l-52 52L415 167c9.4 9.4 9.4 24.6 0 33.9l-17.4 17.4c11.8 26.1 18.4 55.1 18.4 85.6 0 114.9-93.1 208-208 208S0 418.9 0 304 93.1 96 208 96c30.5 0 59.5 6.6 85.6 18.4L311 97c9.4-9.4 24.6-9.4 33.9 0l26.5 26.5 52-52 17.1 17zM500 60h-24c-6.6 0-12 5.4-12 12s5.4 12 12 12h24c6.6 0 12-5.4 12-12s-5.4-12-12-12zM440 0c-6.6 0-12 5.4-12 12v24c0 6.6 5.4 12 12 12s12-5.4 12-12V12c0-6.6-5.4-12-12-12zm33.9 55l17-17c4.7-4.7 4.7-12.3 0-17-4.7-4.7-12.3-4.7-17 0l-17 17c-4.7 4.7-4.7 12.3 0 17 4.8 4.7 12.4 4.7 17 0zm-67.8 0c4.7 4.7 12.3 4.7 17 0 4.7-4.7 4.7-12.3 0-17l-17-17c-4.7-4.7-12.3-4.7-17 0-4.7 4.7-4.7 12.3 0 17l17 17zm67.8 34c-4.7-4.7-12.3-4.7-17 0-4.7 4.7-4.7 12.3 0 17l17 17c4.7 4.7 12.3 4.7 17 0 4.7-4.7 4.7-12.3 0-17l-17-17zM112 272c0-35.3 28.7-64 64-64 8.8 0 16-7.2 16-16s-7.2-16-16-16c-52.9 0-96 43.1-96 96 0 8.8 7.2 16 16 16s16-7.2 16-16z"/></svg></div></body>\');window.setTimeout(window.close,1000);</script></body></html>'
    );
  });

  /*
      In here we handle our incoming realtime connections and listen for events.
    */

  global.authom.on("auth", function (req, res, data) {
    var profile = data;
    Auth.officer(req, profile, function (err, response) {
      if (!response) {
        // Close the login window
        //on error
        try {
          res.set("Content-Type", "text/html");
        } catch (e) {}
        res.end(
          '<html><body><script>window.opener.document.write(\'<html><head><title>CRASH</title><meta name="viewport" content="width=device-width, initial-scale=1" /><style>body{text-align:center;font-family:"Segoe UI",Tahoma,Geneva,Verdana,sans-serif}.content{width:200px;height:205px;background-color:white;position:absolute;left:0;right:0;top:0;bottom:0;margin:auto;max-width:100%;max-height:100%;overflow:auto}</style></head><body><div class="content"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M440.5 88.5l-52 52L415 167c9.4 9.4 9.4 24.6 0 33.9l-17.4 17.4c11.8 26.1 18.4 55.1 18.4 85.6 0 114.9-93.1 208-208 208S0 418.9 0 304 93.1 96 208 96c30.5 0 59.5 6.6 85.6 18.4L311 97c9.4-9.4 24.6-9.4 33.9 0l26.5 26.5 52-52 17.1 17zM500 60h-24c-6.6 0-12 5.4-12 12s5.4 12 12 12h24c6.6 0 12-5.4 12-12s-5.4-12-12-12zM440 0c-6.6 0-12 5.4-12 12v24c0 6.6 5.4 12 12 12s12-5.4 12-12V12c0-6.6-5.4-12-12-12zm33.9 55l17-17c4.7-4.7 4.7-12.3 0-17-4.7-4.7-12.3-4.7-17 0l-17 17c-4.7 4.7-4.7 12.3 0 17 4.8 4.7 12.4 4.7 17 0zm-67.8 0c4.7 4.7 12.3 4.7 17 0 4.7-4.7 4.7-12.3 0-17l-17-17c-4.7-4.7-12.3-4.7-17 0-4.7 4.7-4.7 12.3 0 17l17 17zm67.8 34c-4.7-4.7-12.3-4.7-17 0-4.7 4.7-4.7 12.3 0 17l17 17c4.7 4.7 12.3 4.7 17 0 4.7-4.7 4.7-12.3 0-17l-17-17zM112 272c0-35.3 28.7-64 64-64 8.8 0 16-7.2 16-16s-7.2-16-16-16c-52.9 0-96 43.1-96 96 0 8.8 7.2 16 16 16s16-7.2 16-16z"/></svg></div></body>\');window.setTimeout(window.close,1000);</script></body></html>'
        );
        return;
      }

      req.session.user = response;

      // Close the login window
      // SUCCESS
      try {
        res.set("Content-Type", "text/html");
      } catch (e) {}

      res.end(
        '<html><head><title>...</title><meta name="viewport" content="width=device-width, initial-scale=1" /><style>body{text-align:center;font-family:"Segoe UI",Tahoma,Geneva,Verdana,sans-serif}.content{width:200px;height:205px;background-color:white;position:absolute;left:0;right:0;top:0;bottom:0;margin:auto;max-width:100%;max-height:100%;overflow:auto}</style></head><body><div class="content"><svg version="1.1" id="L2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve"><circle fill="none" stroke="#000" stroke-width="4" stroke-miterlimit="10" cx="50" cy="50" r="48" /><line fill="none" stroke-linecap="round" stroke="#000" stroke-width="4" stroke-miterlimit="10" x1="50" y1="50" x2="85" y2="50.5"><animateTransform attributeName="transform" dur="2s" type="rotate" from="0 50 50" to="360 50 50" repeatCount="indefinite" /></line><line fill="none" stroke-linecap="round" stroke="#000" stroke-width="4" stroke-miterlimit="10" x1="50" y1="50" x2="49.5" y2="74"><animateTransform attributeName="transform" dur="15s" type="rotate" from="0 50 50" to="360 50 50" repeatCount="indefinite" /></line></svg></div></body><script>if (window.opener.socket) window.opener.socket.transmit("#login",\'' +
          JSON.stringify(response) +
          "');(async () => {if (!window.opener.socket) window.setTimeout(window.close,1000); else {let result = await window.opener.socket.invoke('auth', {});if (result=='Success') window.close();}})();</script></html>"
      );
      return;
    });
  });

  var fs = require("fs");
  var sep = "/";

  // published Officer
  global.officer = require(global.project.auth + sep + "Officer.js");
  if (global.officer.published) global.officer = global.officer.published;

  global.officer = Object.assign(
    global.officer,
    require(__dirname + "/global.js")()
  );

  // Profiles
  global.officer.profiles = {
    getAll: function () {
      return global.settings.profiles;
    },
    get: function (user) {
      if (!user) return { err: "NO_USER" };
      var response = [];
      var profiler = global.settings.profiles;
      if (!profiler) return {};
      for (var el in profiler) {
        var p = profiler[el];
        if (p.indexOf(user) > -1) response.push(el);
      }
      return response;
    },
  };
  global.officer.getProfile = function (user) {
    var response = [];
    var profiler = global.settings.profiles;
    if (!profiler) return {};
    for (var el in profiler) {
      var p = profiler[el];
      if (p.indexOf(user) > -1) response.push(el);
    }
    return response;
  };

  global.officer = Object.assign(
    global.officer,
    require(__dirname + "/global.js")()
  );

  global.Auth = {
    officer: function (req, profile, fn) {
      this.register(req, profile, function (err, response) {
        fn(err, response);
      });
    },
    register: function (req, profile, cb) {
      var auth_type = profile.service;
      var off = "Officer";

      var Officer = require(global.project.auth + sep + off + ".js");
      Officer = Object.assign(Officer, require(__dirname + "/global.js")());
      // Profiles
      Officer.profiles = {
        getAll: function () {
          return global.settings.profiles;
        },
        get: function (user) {
          var response = [];
          var profiler = global.settings.profiles;
          if (!profiler) return {};
          for (var el in profiler) {
            var p = profiler[el];
            if (p.indexOf(user) > -1) response.push(el);
          }
          return response;
        },
      };
      Officer.login(profile, function (err, response) {
        if (err) return cb(err);
        req.session.authType = auth_type;
        req.session.user = response;
        cb(err, response);
      });
    },
  };

  app.get("/bye", function (req, res) {
    res.setHeader("content-type", "text/html");
    res.end("<script>window.opener.location.reload();window.close();</script>");
  });

  app.post("/pid", function (req, res) {
    var authType = req.session.authType;
    req.session.destroy();
    if (global.settings.auth[authType.toLowerCase()])
      var url = global.settings.auth[authType.toLowerCase()].logout;
    else var url = "/bye";
    return res.redirect(url);
  });

  app.get("/logout", function (req, res) {
    var authType = req.session.authType;
    var url = "/bye";
    req.session.destroy();
    return res.redirect(url);
  });

  function ensureAuthenticated(req, res, next) {
    if (!req.user) req.user = req.session.user;
    if (req.user) return next();
    res.end('{"response":"NOT_LOGIN"}');
  }

  app.get("/account", ensureAuthenticated, function (req, res) {
    if (!req.user) req.user = req.session.user;
    var response = [];
    fs.readFile(global.project.auth + sep + "Profiler.json", function (e, r) {
      if (e) return res.end(JSON.stringify(req.user));
      var profiler = JSON.parse(r.toString("utf-8"));
      for (var el in profiler.profile) {
        var p = profiler.profile[el];
        if (p.indexOf(req.user.mail.split("@")[0]) > -1) response.push(el);
      }
      req.user.profiles = response;
      res.end(JSON.stringify(req.user));
    });
  });

  app.post("/account", ensureAuthenticated, function (req, res) {
    if (!req.user) req.user = req.session.user;
    var response = [];
    fs.readFile(global.project.auth + sep + "Profiler.json", function (e, r) {
      if (e) return res.end(JSON.stringify(req.user));
      var profiler = JSON.parse(r.toString("utf-8"));
      for (var el in profiler.profile) {
        var p = profiler.profile[el];
        if (p.indexOf(req.user.mail.split("@")[0]) > -1) response.push(el);
      }
      req.user.profiles = response;
      res.end(JSON.stringify(req.user));
    });
  });

  for (var el = 0; el < global.settings.auth.length; el++) {
    var o = global.settings.auth[el].login;
    o.service = global.settings.auth[el].type;
    authom.createServer(o);
  }

  app.get("/session", function (req, res) {
    res.end(JSON.stringify(req.session, null, 4));
  });

  app.get("/auth/:service", authom.app);
};
