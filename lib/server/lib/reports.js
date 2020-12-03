module.exports = {
  render: function (filename, params, cb) {
    function isFunction(functionToCheck) {
      return (
        functionToCheck &&
        {}.toString.call(functionToCheck) === "[object Function]"
      );
    }
    var callsite = require("callsite");
    var stack = callsite();
    var mustache = require("mustache");
    var fs = require("fs");
    var dir = global.project.reports + "/" + filename;

    function getHTML(e, html) {
      if (process.env.ENV == "prod") var hostname = "reports";
      else var hostname = "localhost";
      global.request(
        {
          url: "http://" + hostname + ":5488/api/report",
          method: "POST",
          encoding: null,
          form: {
            template: {
              content: html,
              recipe: "chrome-pdf",
              engine: "handlebars",
              chrome: {
                landscape: false,
              },
            },
            data: {},
          },
        },
        function (e, r, b) {
          if (e) {
            if (isFunction(cb)) cb(e);
            else cb.status(500).json({ err: e });
            return;
          }
          if (!isFunction(cb)) cb.end(b);
          else cb(null, b);
        }
      );
    }
    var loadIndex = function (callback) {
      fs.readFile(dir + "/index.html", "utf-8", function (e, r) {
        if (e) return cb("NOT_FOUND");
        callback(r);
      });
    };
    var loadStyle = function (callback) {
      fs.readFile(dir + "/index.css", "utf-8", function (e, r) {
        if (e) return callback("");
        callback(r);
      });
    };
    var loadMedia = function (l, cb, ndx) {
      if (!ndx) return loadMedia(l, cb, 1);
      if (!l[ndx - 1]) return cb(l);
      fs.readFile(dir + "/" + l[ndx - 1], "base64", function (e, r) {
        if (e) return loadMedia(l, cb, ndx + 1);
        var metadata = l[ndx - 1].substr(
          l[ndx - 1].lastIndexOf("."),
          l[ndx - 1].length
        );
        if (metadata == ".png") metadata = "image/png";
        if (metadata == ".jpg") metadata = "image/jpg";
        if (metadata == ".gif") metadata = "image/gif";
        l[ndx - 1] = "data:" + metadata + ";base64," + r;
        loadMedia(l, cb, ndx + 1);
      });
    };
    loadIndex(function (html) {
      loadStyle(function (css) {
        var styles = css.split(": url(");
        var loader = [];
        for (var i = 0; i < styles.length; i++) {
          if (styles[i].indexOf(")") > -1) loader.push(styles[i].split(")")[0]);
        }
        loadMedia(loader, function (list) {
          var compteur = 0;
          var css = [];
          for (var i = 0; i < styles.length; i++) {
            if (styles[i].indexOf(")") > -1) {
              css.push(
                ": url(" +
                  list[compteur] +
                  styles[i].substr(styles[i].indexOf(")"), styles[i].length)
              );
              compteur++;
            } else css.push(styles[i]);
          }
          html = html.replace(
            "</head>",
            "<style>" + css.join("") + "</style></head>"
          );
          getHTML(null, mustache.render(html, params));
        });
      });
    });
  },
};
