module.exports = function (app, express) {
  var multer = require("multer");
  var fs = require("fs");
  var upload = multer();
  var userdir = require("os").homedir() + "/oa-cli";
  app.get("/_/files", function (req, res) {
    var fs = require("fs");
    fs.readdir(
      global.project.home + "/app",
      { withFileTypes: true },
      (err, files) => {
        if (err) throw err;
        var f = [];
        files.forEach((file) => {
          var o = file;
          if (file.isDirectory()) o.leaf = false;
          else o.leaf = true;
          f.push(o);
        });
        res.json(f);
      }
    );
  });

  var storage = multer.diskStorage({
    destination: function (req, file, callback) {
      fs.mkdir(userdir + "/" + "uploads", function () {
        callback(null, userdir + "/" + "uploads");
      });
    },
    filename: function (req, file, callback) {
      callback(
        null,
        file.fieldname +
          "-" +
          Date.now() +
          require("path").extname(file.originalname)
      );
    },
  });

  function dumpSchemes(mydb, tables, i, cb) {
    var SCHEME = [];
    var tb = tables[i].split("(");
    tb = tb[0].trim().split("`");
    if (tb.length == 3) {
      tb = tb[1];
      SCHEME.push(tb + " {");
      var fields = [];
      var _fields = tables[i]
        .substr(tables[i].indexOf("(") + 2, tables[i].length)
        .split(") ENGINE")[0]
        .split("\n");
      var primary = "";
      var notnull = "-";
      var _default = "";
      for (var z = 0; z < _fields.length; z++) {
        var field = _fields[z].trim();
        if (field.substr(0, 1) == "`") {
          // C'est un champ
          var field_name = field.split("`")[1];
          var field_designation = field.split("`")[2];
          if (field.indexOf("NOT NULL") > -1) {
            notnull = "!";
          } else notnull = "-";
          if (field.indexOf("DEFAULT ") > -1) {
            _default = field.split("DEFAULT ")[1].split(" ")[0].trim();
            if (_default.indexOf("NULL") > -1) _default = "";
          } else _default = "";
          //console.log(field_designation);
          if (field_designation.indexOf("int") > -1) field_designation = "int";
          if (field_designation.indexOf("varchar") > -1)
            field_designation = "string";
          if (field_designation.indexOf("longtext") > -1)
            field_designation = "text";
          if (field_designation.indexOf("float") > -1)
            field_designation = "float";
          if (field_designation.indexOf("datetime") > -1)
            field_designation = "datetime";
          if (field_designation.indexOf("date") > -1)
            field_designation = "date";
          if (field_designation.indexOf("tinyblob") > -1)
            field_designation = "blob";
          if (field_designation.indexOf("blob") > -1)
            field_designation = "blob";
          if (field_designation.indexOf("text") > -1)
            field_designation = "text";
          if (field_designation.indexOf("longtext") > -1)
            field_designation = "text";
          if (field_designation.indexOf("char") > -1)
            field_designation = "char";
          if (field_designation.indexOf("double") > -1)
            field_designation = "float";
          fields.push(
            field_name +
              "|" +
              field_designation +
              "|" +
              notnull +
              "|" +
              _default
          );
        } else {
          // C'est un mot clé
          if (field.indexOf("PRIMARY") > -1) {
            primary = field.split("`")[1];
          }
        }
      }
      var FIELDS = [];
      for (var z = 0; z < fields.length; z++) {
        if (fields[z].split("|")[0] == primary)
          var str = "\t" + fields[z].split("|")[2] + " (key) " + primary;
        else
          var str =
            "\t" +
            fields[z].split("|")[2] +
            " (" +
            fields[z].split("|")[1] +
            ") " +
            fields[z].split("|")[0];
        if (fields[z].split("|")[3] != "")
          str += " = " + fields[z].split("|")[3];
        FIELDS.push(str);
      }
      SCHEME.push(FIELDS.join("\n"));
      SCHEME.push("}\n");
      if (i == 0)
        fs.writeFileSync(
          PROJECT_HOME +
            "/" +
            "src" +
            "/" +
            "Contents" +
            "/" +
            "Db" +
            "/" +
            mydb +
            ".scheme",
          SCHEME.join("\n")
        );
      else
        fs.appendFileSync(
          PROJECT_HOME +
            "/" +
            "src" +
            "/" +
            "Contents" +
            "/" +
            "Db" +
            "/" +
            mydb +
            ".scheme",
          SCHEME.join("\n")
        );
      console.log("  Done.");
    }
  }

  //  app.use("/app", express.static(__dirname + "/" + "../ide" + "/" + "www"));

  app.post("/_/db/export", function (req, res) {
    var mysql = require("mysql2");
  });

  app.post("/_/db/link/rename", function (req, res) {
    var item = req.body.id.split("|")[1];
    var newdb = req.body.db;
    if (global.manifest.db.indexOf(item) == -1)
      return res.end('{"ERROR":"NOT_FOUND"}');
    for (var i = 0; i < global.manifest.db.length; i++) {
      if (global.manifest[i] == item) global.manifest[i] = newdb;
    }
    fs.writeFile(
      global.PROJECT_HOME + "/" + "app.manifest",
      JSON.stringify(global.manifest, null, 4),
      function (e) {
        var set = global.project.config + "/" + "settings.json";
        fs.readFile(set, function (e, r) {
          if (e)
            settings = {
              auth: {},
              db: [],
            };
          try {
            settings = JSON.parse(r.toString("utf-8"));
          } catch (e) {
            settings = { auth: {}, db: [] };
          }
          for (var i = 0; i < settings.db.length; i++) {
            if (settings.db[i].name == item) {
              settings.db[i].name = newdb;
              fs.writeFile(set, JSON.stringify(settings, null, 4), function (
                e
              ) {
                return res.end("{}");
              });
            }
          }
        });
      }
    );
  });
  /*
  app.post("/_/db/import", function (req, res) {
    var mysql = require("mysql2");
    function JSONImport(connection, f, db, callback) {
      var fs = require("fs");
      function parseItems(o) {
        var items = o[0];
      }
      function readJSON(e, r) {
        try {
          return parseItems(JSON.parse(r));
        } catch (e) {}
      }
      fs.readFile(f, "utf-8", readJSON);
    }
    function DBImport(connection, f, db, callback) {
      var fs = require("fs"),
        es = require("event-stream");

      var counter = 0;
      var INSERT = "";
      var cmd = "";
      var counter = 0;
      var token = "";
      var insert_header = "";
      var insert_counter = -1;

      connection.query("drop database if exists " + db + ";", function (e, r) {
        connection.query("create database " + db + ";", function (e, r) {
          connection.query("use " + db + ";", function (e, r) {
            connection.query(
              "SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0",
              function (e, r) {
                var s = fs
                  .createReadStream(f)
                  .pipe(es.split())
                  .pipe(
                    es
                      .mapSync(function (line) {
                        // pause the readstream
                        s.pause();

                        counter++;
                        //console.log(counter);
                        var item = line.substr(0, 1);
                        //console.log(item);
                        if (
                          line.substr(0, 1) != "0" &&
                          line.substr(0, 2) != "/*" &&
                          line.substr(0, 1) != "#"
                        ) {
                          if (token != "INSERT") {
                            cmd += line;
                          }
                          if (line.indexOf("INSERT") > -1) {
                            token = "INSERT";
                            insert_header = line;
                          }
                          if (line.indexOf(";") > -1) {
                            //console.log(cmd);
                            if (token != "INSERT") {
                              connection.query(cmd, function (e, r) {
                                //console.log(r);
                                cmd = "";
                                token = "";
                                s.resume();
                              });
                            } else {
                              token = "";
                              INSERT = insert_header + " VALUES " + line.trim();
                              //console.log(INSERT);
                              connection.query(INSERT, function (e, r) {
                                // console.log(r);
                                cmd = "";
                                s.resume();
                              });
                            }

                            // console.log(counter);
                          } else {
                            // console.log(counter);
                            if (token == "INSERT") {
                              if (line.indexOf(",") == -1)
                                var sql =
                                  line.substr(0, line.lastIndexOf(",")) + ";";
                              else
                                var sql =
                                  line.substr(0, line.lastIndexOf(",")) + ";";
                              INSERT = insert_header + " VALUES " + sql.trim();
                              //console.log(INSERT);
                              connection.query(INSERT, function (e, r) {
                                //console.log(r);
                                s.resume();
                              });
                            } else s.resume();
                          }
                        } else s.resume();
                      })
                      .on("error", function (err) {
                        callback(err, null);
                      })
                      .on("end", function () {
                        connection.query(
                          "SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS",
                          function (e, r) {
                            fs.unlink(f, function () {
                              callback(null, true);
                            });
                          }
                        );
                      })
                  );
              }
            );
          });
        });
      });
    }
    var upload = multer({
      storage: storage,
      fileFilter: function (req, file, callback) {
        var ext = require("path").extname(file.originalname);
        if (ext !== ".sql" && ext !== ".json") {
          return callback("Only schemes are allowed");
        }
        callback(null, true);
      },
    }).single("avatar");
    upload(req, res, function (err) {
      if (err) return res.json({ err: err });
      for (var el in req.body) {
        var item = req.body[el].split("|");
      }
      if (item[0] == "XDB") {
        var set = global.project.config + "/" + "settings.json";
        fs.readFile(set, function (e, r) {
          if (e)
            settings = {
              auth: {},
              db: [],
            };
          try {
            settings = JSON.parse(r.toString("utf-8"));
          } catch (e) {
            settings = { auth: {}, db: [] };
          }
          var setup = -1;
          for (var i = 0; i < settings.db.length; i++) {
            if (settings.db[i].name == item[2]) setup = settings.db[i].uri;
          }
          if (setup == -1) return res.end("{}");
          var dx = setup.substr(setup.lastIndexOf("/") + 1, setup.length);
          var setup2 = setup.substr(0, setup.lastIndexOf("/")) + "/";
          var connection = mysql.createConnection(setup2);
          if (req.file.path.indexOf(".json") > -1)
            JSONImport(connection, req.file.path, dx, function () {
              console.log("end");
              res.end("{}");
            });
          else
            DBImport(connection, req.file.path, dx, function () {
              console.log("end");
              res.end("{}");
            });
        });
      } else {

        var pro = "default";
        var userdirdata = userdir + "/" + "db";
        userdirdata += "/" + pro;
        var ini = userdirdata + "/" + "my.ini";

        var dx = item[1];
        //console.log(dx);
        fs.readFile(ini, function (e, r) {
          if (e) var conf = [];
          else var conf = r.toString("utf-8").split("\n");
          var port = 3306;
          for (var i = 0; i < conf.length; i++) {
            if (conf[i].indexOf("port=") > -1)
              port = conf[i].split("port=")[1] * 1;
          }
          if (process.env["MYSQL_PASSWORD"])
            var password = process.env["MYSQL_PASSWORD"];
          else var password = "";
          var connection = mysql.createConnection(
            "mysql://root:" + password + "@127.0.0.1:" + port + "/"
          );
          if (req.file.path.indexOf(".json") > -1)
            JSONImport(connection, req.file.path, dx, function () {
              console.log("end");
              res.end("{}");
            });
          else
            DBImport(connection, req.file.path, dx, function () {
              console.log("end");
              res.end("{}");
            });
        });
      }
    });
  });
  */
  app.get("/_/db/data", function (req, res) {
    var item = req.query.id.split("|");
    var tb = item[3];
    var mysql = require("mysql2");
    //console.log(req.query);
    if (item[0] == "Tbx") {
      // Let's see the manifest
      var set = global.project.config + "/" + "settings.json";
      fs.readFile(set, function (e, r) {
        if (e)
          settings = {
            auth: {},
            db: [],
          };
        try {
          settings = JSON.parse(r.toString("utf-8"));
        } catch (e) {
          settings = { auth: {}, db: [] };
        }
        var setup = -1;
        for (var i = 0; i < settings.db.length; i++) {
          if (settings.db[i].name == item[2]) setup = settings.db[i].uri;
        }

        if (setup == -1) return res.end("{}");
        var connection = mysql.createConnection(setup);
        var dx = setup.substr(setup.lastIndexOf("/") + 1, setup.length);
        var fld = [];
        var fldx = [];
        connection.query(
          'select * from information_schema.columns where table_name="' +
            tb +
            '" and table_schema = "' +
            dx +
            '" order by table_name,ordinal_position',
          function (error, results, fields) {
            for (var i = 0; i < results.length; i++) {
              var is_binary = false;
              if (
                results[i].COLUMN_TYPE.toUpperCase().indexOf("BLOB") > -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("TEXT") > -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("TINYBLOB") > -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("TINYTEXT") > -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("MEDIUMBLOB") >
                  -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("MEDIUMTEXT") >
                  -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("LONGBLOB") > -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("LONGTEXT") > -1
              )
                is_binary = true;

              if (is_binary) {
                fld.push(results[i].COLUMN_NAME);
                fldx.push("[...]");
              } else {
                fld.push(results[i].COLUMN_NAME);
                fldx.push("-1");
              }
            }
            var fields = [];
            for (var i = 0; i < fld.length; i++) {
              if (fldx[i] == "-1") fields.push(fld[i]);
            }
            connection.query(
              "select count(*) total from " + dx + "." + tb,
              function (e, r, f) {
                if (!r) return res.end("{}");
                var Response = {};
                Response.total = r[0].total;
                // 'select ' + fields.join(',') + ' from '
                connection.query(
                  "select * from " +
                    dx +
                    "." +
                    tb +
                    " limit " +
                    req.query.start +
                    "," +
                    req.query.limit,
                  function (error, results, fld) {
                    for (var i = 0; i < results.length; i++) {
                      for (var j = 0; j < fld.length; j++) {
                        if (fields.indexOf(fld[j].name) == -1)
                          results[i][fld[j].name] =
                            "<div align=center><b>[...]</b></div>";
                      }
                    }
                    Response.data = results;
                    connection.end();
                    res.end(JSON.stringify(Response));
                  }
                );
              }
            );
          }
        );
      });
    } else {
      var pro = "default";
      var userdirdata = userdir + "/" + "db";
      userdirdata += "/" + pro;
      var ini = userdirdata + "/" + "my.ini";

      var tb = item[3];
      fs.readFile(ini, function (e, r) {
        if (e) var conf = [];
        else var conf = r.toString("utf-8").split("\n");
        var port = 3306;
        for (var i = 0; i < conf.length; i++) {
          if (conf[i].indexOf("port=") > -1)
            port = conf[i].split("port=")[1] * 1;
        }
        if (process.env["MYSQL_PASSWORD"])
          var password = process.env["MYSQL_PASSWORD"];
        else var password = "";
        var connection = mysql.createConnection(
          "mysql://root:" + password + "@127.0.0.1:" + port + "/mysql"
        );
        var fld = [];
        var fldx = [];
        var dx = item[2];

        connection.query(
          'select * from information_schema.columns where table_name="' +
            tb +
            '" and table_schema = "' +
            dx +
            '" order by table_name,ordinal_position',
          function (error, results, fields) {
            for (var i = 0; i < results.length; i++) {
              var is_binary = false;
              if (
                results[i].COLUMN_TYPE.toUpperCase().indexOf("BLOB") > -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("TEXT") > -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("TINYBLOB") > -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("TINYTEXT") > -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("MEDIUMBLOB") >
                  -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("MEDIUMTEXT") >
                  -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("LONGBLOB") > -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("LONGTEXT") > -1
              )
                is_binary = true;

              if (is_binary) {
                fld.push(results[i].COLUMN_NAME);
                fldx.push("[...]");
              } else {
                fld.push(results[i].COLUMN_NAME);
                fldx.push("-1");
              }
            }
            var fields = [];
            for (var i = 0; i < fld.length; i++) {
              if (fldx[i] == "-1") fields.push(fld[i]);
            }

            connection.query(
              "select count(*) total from " + dx + "." + tb,
              function (e, r, f) {
                var Response = {};
                Response.total = r[0].total;
                // ' + fields.join(',') + '
                connection.query(
                  "select * from " +
                    dx +
                    "." +
                    tb +
                    " limit " +
                    req.query.start +
                    "," +
                    req.query.limit,
                  function (error, results, fld) {
                    for (var i = 0; i < results.length; i++) {
                      for (var j = 0; j < fld.length; j++) {
                        if (fields.indexOf(fld[j].name) == -1)
                          results[i][fld[j].name] =
                            "<div align=center><b>[...]</b></div>";
                      }
                    }
                    Response.data = results;
                    connection.end();
                    res.end(JSON.stringify(Response));
                  }
                );
              }
            );
          }
        );
      });
    }
  });
  app.get("/_/db/data2", function (req, res) {
    var item = req.query.id.split("|");
    var tb = item[3];
    var mysql = require("mysql2");
    //console.log(req.query);
    if (item[0] == "Tbx") {
      // Let's see the manifest
      var set = global.project.config + "/" + "settings.json";
      fs.readFile(set, function (e, r) {
        if (e)
          settings = {
            auth: {},
            db: [],
          };
        try {
          settings = JSON.parse(r.toString("utf-8"));
        } catch (e) {
          settings = { auth: {}, db: [] };
        }
        var setup = -1;
        for (var i = 0; i < settings.db.length; i++) {
          if (settings.db[i].name == item[2]) setup = settings.db[i].uri;
        }

        if (setup == -1) return res.end("{}");
        var connection = mysql.createConnection(setup);
        var dx = setup.substr(setup.lastIndexOf("/") + 1, setup.length);
        var fld = [];
        var fldx = [];
        connection.query(
          'select * from information_schema.columns where table_name="' +
            tb +
            '" and table_schema = "' +
            dx +
            '" order by table_name,ordinal_position',
          function (error, results, fields) {
            for (var i = 0; i < results.length; i++) {
              var is_binary = false;
              if (
                results[i].COLUMN_TYPE.toUpperCase().indexOf("BLOB") > -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("TEXT") > -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("TINYBLOB") > -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("TINYTEXT") > -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("MEDIUMBLOB") >
                  -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("MEDIUMTEXT") >
                  -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("LONGBLOB") > -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("LONGTEXT") > -1
              )
                is_binary = true;

              if (is_binary) {
                fld.push(results[i].COLUMN_NAME);
                fldx.push("[...]");
              } else {
                fld.push(results[i].COLUMN_NAME);
                fldx.push("-1");
              }
            }
            var fields = [];
            for (var i = 0; i < fld.length; i++) {
              if (fldx[i] == "-1") fields.push(fld[i]);
            }

            var Response = {};
            var results = [];
            results.push({});

            for (var j = 0; j < fld.length; j++) {
              results[0][fld[j]] = "";
            }

            Response.data = results;
            connection.end();
            console.log(Response);
            res.end(JSON.stringify(Response));
          }
        );
      });
    } else {
      var pro = "default";
      var userdirdata = userdir + "/" + "db";
      userdirdata += "/" + pro;
      var ini = userdirdata + "/" + "my.ini";

      var tb = item[3];
      fs.readFile(ini, function (e, r) {
        if (e) var conf = [];
        else var conf = r.toString("utf-8").split("\n");
        var port = 3306;
        for (var i = 0; i < conf.length; i++) {
          if (conf[i].indexOf("port=") > -1)
            port = conf[i].split("port=")[1] * 1;
        }
        if (process.env["MYSQL_PASSWORD"])
          var password = process.env["MYSQL_PASSWORD"];
        else var password = "";
        var connection = mysql.createConnection(
          "mysql://root:" + password + "@127.0.0.1:" + port + "/mysql"
        );
        var fld = [];
        var fldx = [];
        var dx = item[2];

        connection.query(
          'select * from information_schema.columns where table_name="' +
            tb +
            '" and table_schema = "' +
            dx +
            '" order by table_name,ordinal_position',
          function (error, results, fields) {
            for (var i = 0; i < results.length; i++) {
              var is_binary = false;
              if (
                results[i].COLUMN_TYPE.toUpperCase().indexOf("BLOB") > -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("TEXT") > -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("TINYBLOB") > -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("TINYTEXT") > -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("MEDIUMBLOB") >
                  -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("MEDIUMTEXT") >
                  -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("LONGBLOB") > -1 ||
                results[i].COLUMN_TYPE.toUpperCase().indexOf("LONGTEXT") > -1
              )
                is_binary = true;

              if (is_binary) {
                fld.push(results[i].COLUMN_NAME);
                fldx.push("[...]");
              } else {
                fld.push(results[i].COLUMN_NAME);
                fldx.push("-1");
              }
            }
            var fields = [];
            for (var i = 0; i < fld.length; i++) {
              if (fldx[i] == "-1") fields.push(fld[i]);
            }

            connection.query(
              "select count(*) total from " + dx + "." + tb,
              function (e, r, f) {
                var Response = {};
                Response.total = r[0].total;
                // ' + fields.join(',') + '
                connection.query(
                  "select * from " +
                    dx +
                    "." +
                    tb +
                    " limit " +
                    req.query.start +
                    "," +
                    req.query.limit,
                  function (error, results, fld) {
                    for (var i = 0; i < results.length; i++) {
                      for (var j = 0; j < fld.length; j++) {
                        if (fields.indexOf(fld[j].name) == -1)
                          results[i][fld[j].name] =
                            "<div align=center><b>[...]</b></div>";
                      }
                    }
                    Response.data = results;
                    connection.end();
                    res.end(JSON.stringify(Response));
                  }
                );
              }
            );
          }
        );
      });
    }
  });
  app.post("/_/db/rm", function (req, res) {
    var item = req.body.id.split("|")[1];
    var mysql = require("mysql2");

    var pro = "default";
    var userdirdata = userdir + "/" + "db";
    userdirdata += "/" + pro;
    var ini = userdirdata + "/" + "my.ini";

    var set = global.project.config + "/" + "settings.json";
    fs.readFile(set, function (e, r) {
      if (e)
        settings = {
          auth: {},
          db: [],
        };
      try {
        settings = JSON.parse(r.toString("utf-8"));
      } catch (e) {
        settings = { auth: {}, db: [] };
      }
      var setup = -1;
      for (var i = 0; i < settings.db.length; i++) {
        if (settings.db[i].uri.indexOf(item) > -1)
          return res.end('{"ERROR":"LINKED"}');
      }
      fs.readFile(ini, function (e, r) {
        if (e) var conf = [];
        else var conf = r.toString("utf-8").split("\n");
        var port = 3306;
        for (var i = 0; i < conf.length; i++) {
          if (conf[i].indexOf("port=") > -1)
            port = conf[i].split("port=")[1] * 1;
        }
        if (process.env["MYSQL_PASSWORD"])
          var password = process.env["MYSQL_PASSWORD"];
        else var password = "";
        var connection = mysql.createConnection(
          "mysql://root:" + password + "@127.0.0.1:" + port + "/mysql"
        );
        connection.query("DROP DATABASE IF EXISTS " + item, function (e) {
          connection.end();
          res.end("{}");
        });
      });
    });
  });
  app.post("/_/db/link", function (req, res) {
    var yaml = require("yaml");
    var sep = "/";
    var item = req.body.id.split("|")[1];
    if (!global.manifest.db) global.manifest.db = [];
    if (global.manifest.db.indexOf(item) == -1) global.manifest.db.push(item);
    else return res.end('{"ERROR":"LINKED"}');

    fs.writeFile(
      global.dir + "/" + "manifest.yaml",
      yaml.stringify(global.manifest, null, 4),
      function (e) {
        var set = global.dir + "/config/settings.json";
        fs.readFile(set, function (e, r) {
          if (e)
            settings = {
              auth: {},
              db: [],
            };
          try {
            settings = JSON.parse(r.toString("utf-8"));
          } catch (e) {
            settings = { auth: {}, db: [] };
          }
          for (var i = 0; i < settings.db.length; i++) {
            if (settings.db[i].name == item)
              return res.end('{"ERROR":"LINKED"}');
          }

          var pro = "default";
          var userdirdata = userdir + "/" + "db";
          userdirdata += "/" + pro;
          var ini = userdirdata + "/" + "my.ini";
          fs.readFile(ini, function (e, r) {
            if (e) var conf = [];
            else var conf = r.toString("utf-8").split("\n");
            var port = 3306;
            for (var i = 0; i < conf.length; i++) {
              if (conf[i].indexOf("port=") > -1)
                port = conf[i].split("port=")[1] * 1;
            }
            if (process.env["MYSQL_PASSWORD"])
              var password = process.env["MYSQL_PASSWORD"];
            else var password = "";
            settings.db.push({
              name: item,
              uri:
                "mysql://root:" + password + "@127.0.0.1:" + port + "/" + item,
            });
            fs.writeFile(set, JSON.stringify(settings, null, 4), function (e) {
              return res.end("{}");
            });
          });
        });
      }
    );
  });
  app.post("/_/db/unlink", function (req, res) {
    var yaml = require("yaml");
    var item = req.body.id.split("|")[1];
    global.manifest.db.splice(item, 1);
    fs.writeFile(
      global.dir + "/" + "manifest.yaml",
      yaml.stringify(global.manifest, null, 4),
      function (e) {
        var set = global.project.config + "/" + "settings.json";
        fs.readFile(set, function (e, r) {
          if (e)
            settings = {
              auth: {},
              db: [],
            };
          try {
            settings = JSON.parse(r.toString("utf-8"));
          } catch (e) {
            settings = { auth: {}, db: [] };
          }
          for (var i = 0; i < settings.db.length; i++) {
            if (settings.db[i].name == req.body.id.split("|")[2]) {
              settings.db.splice(i, 1);
              fs.writeFile(set, JSON.stringify(settings, null, 4), function (
                e
              ) {
                return res.end("{}");
              });
            }
          }
        });
      }
    );
  });
  app.post("/_/db/add", function (req, res) {
    var item = req.body.id;
    if (!req.body.db) return res.end('{"ERROR":"NO_DB"}');
    var mysql = require("mysql2");

    var pro = "default";
    var userdirdata = userdir + "/" + "db";
    userdirdata += "/" + pro;
    var ini = userdirdata + "/" + "my.ini";
    fs.readFile(ini, function (e, r) {
      if (e) var conf = [];
      else var conf = r.toString("utf-8").split("\n");
      var port = 3306;
      for (var i = 0; i < conf.length; i++) {
        if (conf[i].indexOf("port=") > -1) port = conf[i].split("port=")[1] * 1;
      }
      if (process.env["MYSQL_PASSWORD"])
        var password = process.env["MYSQL_PASSWORD"];
      else var password = "";
      var connection = mysql.createConnection(
        "mysql://root:" + password + "@127.0.0.1:" + port + "/mysql"
      );
      connection.query(
        "CREATE DATABASE IF NOT EXISTS " + req.body.db,
        function (e, r) {
          if (e) return res.end(JSON.stringify(e));
          if (item == "Business-0") {
            if (global.manifest.db.indexOf(req.body.db) == -1) {
              global.manifest.db.push(req.body.db);
              var set = global.project.config + "/" + "settings.json";
              fs.readFile(set, function (e, r) {
                if (e)
                  settings = {
                    auth: {},
                    db: [],
                  };
                try {
                  settings = JSON.parse(r.toString("utf-8"));
                } catch (e) {
                  settings = { auth: {}, db: [] };
                }
                for (var i = 0; i < settings.db.length; i++) {
                  if (settings.db[i].name == req.body.db)
                    return res.end(JSON.stringify(r));
                }
                if (process.env["MYSQL_PASSWORD"])
                  var password = process.env["MYSQL_PASSWORD"];
                else var password = "";
                settings.db.push({
                  name: req.body.db,
                  uri:
                    "mysql://root:" +
                    password +
                    "@127.0.0.1:" +
                    port +
                    "/" +
                    req.body.db,
                });
                fs.writeFile(set, JSON.stringify(settings, null, 4), function (
                  e
                ) {
                  fs.writeFile(
                    global.PROJECT_HOME + "/" + "app.manifest",
                    JSON.stringify(global.manifest, null, 4),
                    function (e) {
                      connection.end();
                      res.end(JSON.stringify(r));
                    }
                  );
                });
              });
            } else res.end(JSON.stringify(r));
          } else res.end(JSON.stringify(r));
        }
      );
    });
  });
  app.post("/_/db/rm/table", function (req, res) {
    var item = req.body.id.split("|");
    var mysql = require("mysql2");
    if (item[0] == "Tbx") {
      var set = global.project.config + "/" + "settings.json";
      fs.readFile(set, function (e, r) {
        if (e)
          settings = {
            auth: {},
            db: [],
          };
        try {
          settings = JSON.parse(r.toString("utf-8"));
        } catch (e) {
          settings = { auth: {}, db: [] };
        }
        var setup = -1;
        for (var i = 0; i < settings.db.length; i++) {
          if (settings.db[i].name == item[2]) setup = settings.db[i].uri;
        }

        if (setup == -1) return res.end("{}");
        var dx = setup.substr(setup.lastIndexOf("/") + 1, setup.length);
        var connection = mysql.createConnection(setup);

        connection.query(
          "DROP TABLE IF EXISTS " + dx + "." + item[3] + "",
          function (e, r) {
            if (e) res.end(JSON.stringify(e));
            res.end(JSON.stringify(r));
            connection.end();
          }
        );
      });
    }
    if (item[0] == "Tb") {
      var pro = "default";
      var userdirdata = userdir + "/" + "db";
      userdirdata += "/" + pro;
      var ini = userdirdata + "/" + "my.ini";
      var tb = item[3];
      var dx = item[2];
      fs.readFile(ini, function (e, r) {
        if (e) var conf = [];
        else var conf = r.toString("utf-8").split("\n");
        var port = 3306;
        for (var i = 0; i < conf.length; i++) {
          if (conf[i].indexOf("port=") > -1)
            port = conf[i].split("port=")[1] * 1;
        }
        if (process.env["MYSQL_PASSWORD"])
          var password = process.env["MYSQL_PASSWORD"];
        else var password = "";
        var connection = mysql.createConnection(
          "mysql://root:" + password + "@127.0.0.1:" + port + "/" + item[2]
        );
        connection.query(
          "DROP TABLE IF EXISTS " + item[2] + "." + item[3] + "",
          function (e, r) {
            if (e) res.end(JSON.stringify(e));
            res.end(JSON.stringify(r));
            connection.end();
          }
        );
      });
    }
  });
  app.post("/_/db/new/table", function (req, res) {
    var item = req.body.id.split("|");
    var mysql = require("mysql2");
    var tb = req.body.tb;
    if (!tb) return res.end('{"ERROR":"NO_TABLE"}');
    if (item[0] == "Db") {
      var pro = "default";
      var userdirdata = userdir + "/" + "db";
      userdirdata += "/" + pro;
      var ini = userdirdata + "/" + "my.ini";
      var tb = item[3];
      var dx = item[2];
      fs.readFile(ini, function (e, r) {
        if (e) var conf = [];
        else var conf = r.toString("utf-8").split("\n");
        var port = 3306;
        for (var i = 0; i < conf.length; i++) {
          if (conf[i].indexOf("port=") > -1)
            port = conf[i].split("port=")[1] * 1;
        }
        if (process.env["MYSQL_PASSWORD"])
          var password = process.env["MYSQL_PASSWORD"];
        else var password = "";
        var connection = mysql.createConnection(
          "mysql://root:" + password + "@127.0.0.1:" + port + "/" + item[1]
        );
        connection.query(
          "CREATE TABLE IF NOT EXISTS " +
            req.body.tb +
            " (`k" +
            req.body.tb +
            "` int(11) NOT NULL AUTO_INCREMENT,`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY (`k" +
            req.body.tb +
            "`)) ENGINE=InnoDB DEFAULT CHARSET=latin1;",
          function (e, r) {
            if (e) res.end(JSON.stringify(e));
            res.end(JSON.stringify(r));
            connection.end();
          }
        );
      });
    }
    if (item[0] == "XDB") {
      var set = global.project.config + "/" + "settings.json";
      fs.readFile(set, function (e, r) {
        if (e)
          settings = {
            auth: {},
            db: [],
          };
        try {
          settings = JSON.parse(r.toString("utf-8"));
        } catch (e) {
          settings = { auth: {}, db: [] };
        }
        var setup = -1;
        for (var i = 0; i < settings.db.length; i++) {
          if (settings.db[i].name == item[2]) setup = settings.db[i].uri;
        }

        if (setup == -1) return res.end("{}");
        var dx = setup.substr(setup.lastIndexOf("/") + 1, setup.length);
        var connection = mysql.createConnection(setup);
        connection.query(
          "CREATE TABLE IF NOT EXISTS " +
            req.body.tb +
            " (`k" +
            req.body.tb +
            "` int(11) NOT NULL AUTO_INCREMENT,`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY (`k" +
            req.body.tb +
            "`)) ENGINE=InnoDB DEFAULT CHARSET=latin1;",
          function (e, r) {
            if (e) res.end(JSON.stringify(e));
            res.end(JSON.stringify(r));
            connection.end();
          }
        );
      });
    }
  });
  app.post("/_/db/rename/table", function (req, res) {
    var item = req.body.id.split("|");
    //console.log(item);
    var mysql = require("mysql2");
    var tb = req.body.tb;
    if (!tb) return res.end('{"ERROR":"NO_TABLE"}');
    if (item[0] == "Tb") {
      var pro = "default";
      var userdirdata = userdir + "/" + "db";
      userdirdata += "/" + pro;
      var ini = userdirdata + "/" + "my.ini";
      var tb = item[3];
      var dx = item[2];
      fs.readFile(ini, function (e, r) {
        if (e) var conf = [];
        else var conf = r.toString("utf-8").split("\n");
        var port = 3306;
        for (var i = 0; i < conf.length; i++) {
          if (conf[i].indexOf("port=") > -1)
            port = conf[i].split("port=")[1] * 1;
        }
        if (process.env["MYSQL_PASSWORD"])
          var password = process.env["MYSQL_PASSWORD"];
        else var password = "";
        var connection = mysql.createConnection(
          "mysql://root:" + password + "@127.0.0.1:" + port + "/" + item[2]
        );
        connection.query(
          "RENAME TABLE " + item[3] + " TO " + req.body.tb,
          function (e, r) {
            if (e) res.end(JSON.stringify(e));
            res.end(JSON.stringify(r));
            connection.end();
          }
        );
      });
    }
    if (item[0] == "Tbx") {
      var set = global.project.config + "/" + "settings.json";
      fs.readFile(set, function (e, r) {
        if (e)
          settings = {
            auth: {},
            db: [],
          };
        try {
          settings = JSON.parse(r.toString("utf-8"));
        } catch (e) {
          settings = { auth: {}, db: [] };
        }
        var setup = -1;
        for (var i = 0; i < settings.db.length; i++) {
          if (settings.db[i].name == item[2]) setup = settings.db[i].uri;
        }

        if (setup == -1) return res.end("{}");
        var dx = setup.substr(setup.lastIndexOf("/") + 1, setup.length);
        var connection = mysql.createConnection(setup);
        connection.query(
          "RENAME TABLE " + item[3] + " TO " + req.body.tb,
          function (e, r) {
            if (e) res.end(JSON.stringify(e));
            res.end(JSON.stringify(r));
            connection.end();
          }
        );
      });
    }
  });
  app.post("/_/db/tableinfo", function (req, res) {
    var item = req.body.tablename.split("|");
    var tb = item[3];
    var mysql = require("mysql2");
    if (item[0] == "Tbx") {
      //Tbx|0|testDB|Agents
      // Let's see the manifest
      var set = global.project.config + "/" + "settings.json";
      fs.readFile(set, function (e, r) {
        if (e)
          settings = {
            auth: {},
            db: [],
          };
        try {
          settings = JSON.parse(r.toString("utf-8"));
        } catch (e) {
          settings = { auth: {}, db: [] };
        }
        var setup = -1;
        for (var i = 0; i < settings.db.length; i++) {
          if (settings.db[i].name == item[2]) setup = settings.db[i].uri;
        }

        if (setup == -1) return res.end("{}");
        var dx = setup.substr(setup.lastIndexOf("/") + 1, setup.length);
        var connection = mysql.createConnection(setup);
        connection.query(
          'select * from information_schema.columns where table_name="' +
            tb +
            '" and table_schema = "' +
            dx +
            '" order by table_name,ordinal_position',
          function (error, results, fields) {
            var Response = [];
            var field = {};
            /*field = {
                        "field": "*",
                        "extra": "",
                        "id": App.using('shortid').generate(),
                        "key": "",
                        "tableName": dx + "." + tb,
                        "null": "",
                        "default": "",
                        "type": "",
                        "extCmpId": App.using('shortid').generate()
                    };
                    Response.push(field);*/
            for (var i = 0; i < results.length; i++) {
              field = {
                field: results[i].COLUMN_NAME,
                extra: results[i].EXTRA,
                id: require("shortid").generate(),
                key: results[i].COLUMN_KEY,
                tableName: dx + "." + tb,
                //"null":results[i].IS_NULLABLE,
                default: results[i].COLUMN_DEFAULT,
                type: results[i].COLUMN_TYPE,
                extCmpId: require("shortid").generate(),
              };
              Response.push(field);
            }
            connection.end();
            res.end(JSON.stringify(Response));
          }
        );
      });
    } else {
      var pro = "default";
      var userdirdata = userdir + "/" + "db";
      userdirdata += "/" + pro;
      var ini = userdirdata + "/" + "my.ini";
      var tb = item[3];
      var dx = item[2];
      fs.readFile(ini, function (e, r) {
        if (e) var conf = [];
        else var conf = r.toString("utf-8").split("\n");
        var port = 3306;
        for (var i = 0; i < conf.length; i++) {
          if (conf[i].indexOf("port=") > -1)
            port = conf[i].split("port=")[1] * 1;
        }
        if (process.env["MYSQL_PASSWORD"])
          var password = process.env["MYSQL_PASSWORD"];
        else var password = "";
        var connection = mysql.createConnection(
          "mysql://root:" + password + "@127.0.0.1:" + port + "/mysql"
        );
        connection.query(
          'select * from information_schema.columns where table_name="' +
            tb +
            '" and table_schema = "' +
            dx +
            '" order by table_name,ordinal_position',
          function (error, results, fields) {
            var Response = [];
            var field = {};
            /*field = {
                        "field": "*",
                        "extra": "",
                        "id": App.using('shortid').generate(),
                        "key": "",
                        "tableName": dx + "." + tb,
                        "null": "",
                        "default": "",
                        "type": "",
                        "extCmpId": App.using('shortid').generate()
                    };
                    Response.push(field);*/
            for (var i = 0; i < results.length; i++) {
              field = {
                field: results[i].COLUMN_NAME,
                extra: results[i].EXTRA,
                id: require("shortid").generate(),
                key: results[i].COLUMN_KEY,
                tableName: dx + "." + tb,
                //"null":results[i].IS_NULLABLE,
                default: results[i].COLUMN_DEFAULT,
                type: results[i].COLUMN_TYPE,
                extCmpId: require("shortid").generate(),
              };
              Response.push(field);
            }
            connection.end();
            res.end(JSON.stringify(Response));
          }
        );
      });
    }
  });
  app.post("/_/db/getdata", function (req, res) {
    var item = req.body.id.split("|");
    var tb = item[3];
    var mysql = require("mysql2");
    if (item[0] == "Tbx") {
      // Let's see the manifest
      var set = global.project.config + "/" + "settings.json";
      fs.readFile(set, function (e, r) {
        if (e)
          settings = {
            auth: {},
            db: [],
          };
        try {
          settings = JSON.parse(r.toString("utf-8"));
        } catch (e) {
          settings = { auth: {}, db: [] };
        }
        var setup = -1;
        for (var i = 0; i < settings.db.length; i++) {
          if (settings.db[i].name == item[2]) setup = settings.db[i].uri;
        }

        if (setup == -1) return res.end("{}");
        var connection = mysql.createConnection(setup);
        var dx = setup.substr(setup.lastIndexOf("/") + 1, setup.length);
        var fld = [];
        var fldx = [];
        connection.query(
          'select * from information_schema.columns where table_name="' +
            tb +
            '" and table_schema = "' +
            dx +
            '" order by table_name,ordinal_position',
          function (error, results, fields) {
            for (var i = 0; i < results.length; i++) {
              if (results[i].COLUMN_TYPE.toUpperCase().indexOf("BLOB") > -1) {
                fld.push(results[i].COLUMN_NAME);
                fldx.push("[...]");
              } else {
                if (
                  results[i].COLUMN_TYPE.toUpperCase().indexOf("LONGTEXT") > -1
                ) {
                  fld.push(results[i].COLUMN_NAME);
                  fldx.push("[...]");
                } else {
                  fld.push(results[i].COLUMN_NAME);
                  fldx.push("-1");
                }
              }
            }
            var fields = [];
            for (var i = 0; i < fld.length; i++) {
              if (fldx[i] == "-1") fields.push(fld[i]);
            }
            connection.query(
              "select " + fields.join(",") + " from " + dx + "." + tb,
              function (error, results, fields) {
                var Response = {};
                Response.data = results;
                connection.end();
                res.end(JSON.stringify(Response));
              }
            );
          }
        );
      });
    } else {
      var pro = "default";
      var userdirdata = userdir + "/" + "db";
      userdirdata += "/" + pro;
      var ini = userdirdata + "/" + "my.ini";
      var tb = item[3];
      fs.readFile(ini, function (e, r) {
        if (e) var conf = [];
        else var conf = r.toString("utf-8").split("\n");
        var port = 3306;
        for (var i = 0; i < conf.length; i++) {
          if (conf[i].indexOf("port=") > -1)
            port = conf[i].split("port=")[1] * 1;
        }
        if (process.env["MYSQL_PASSWORD"])
          var password = process.env["MYSQL_PASSWORD"];
        else var password = "";
        var connection = mysql.createConnection(
          "mysql://root:" + password + "@127.0.0.1:" + port + "/mysql"
        );
        var fld = [];
        var fldx = [];
        var dx = item[2];
        connection.query(
          'select * from information_schema.columns where table_name="' +
            tb +
            '" and table_schema = "' +
            dx +
            '" order by table_name,ordinal_position',
          function (error, results, fields) {
            for (var i = 0; i < results.length; i++) {
              if (results[i].COLUMN_TYPE.toUpperCase().indexOf("BLOB") > -1) {
                fld.push(results[i].COLUMN_NAME);
                fldx.push("[...]");
              } else {
                if (
                  results[i].COLUMN_TYPE.toUpperCase().indexOf("LONGTEXT") > -1
                ) {
                  fld.push(results[i].COLUMN_NAME);
                  fldx.push("[...]");
                } else {
                  fld.push(results[i].COLUMN_NAME);
                  fldx.push("-1");
                }
              }
            }
            var fields = [];
            for (var i = 0; i < fld.length; i++) {
              if (fldx[i] == "-1") fields.push(fld[i]);
            }
            connection.query(
              "select " + fields.join(",") + " from " + dx + "." + tb,
              function (error, results, fields) {
                var Response = {};
                Response.data = results;
                connection.end();
                res.end(JSON.stringify(Response));
              }
            );
          }
        );
      });
    }
  });

  app.post("/_/db/field/comment", function (req, res) {
    var mysql = require("mysql2");
    var db = req.body.db;
    var tb = req.body.tb;
    var field = req.body.field;
    var position = req.body.position;

    var pro = "default";
    var userdirdata = userdir + "/" + "db";
    userdirdata += "/" + pro;
    var ini = userdirdata + "/" + "my.ini";
    fs.readFile(ini, function (e, r) {
      if (e) var conf = [];
      else var conf = r.toString("utf-8").split("\n");
      var port = 3306;
      for (var i = 0; i < conf.length; i++) {
        if (conf[i].indexOf("port=") > -1) port = conf[i].split("port=")[1] * 1;
      }
      if (process.env["MYSQL_PASSWORD"])
        var password = process.env["MYSQL_PASSWORD"];
      else var password = "";
      var connection = mysql.createConnection(
        "mysql://root:" +
          password +
          "@127.0.0.1:" +
          port +
          "/" +
          db +
          "?multipleStatements=true"
      );
      var SQL = "show create table " + db + "." + tb;

      connection.query(SQL, function (e, r) {
        var dump = r[0]["Create Table"].split("\n");
        var dumplength = 0;
        for (var i = 0; i < dump.length; i++) {
          var item = dump[i].trim();
          if (item.substr(0, 1) == "`") dumplength++;
        }

        var from = dump[position]
          .substr(0, dump[position].lastIndexOf(","))
          .trim();
        var cols = from.split(" ");
        var column = cols[0];
        cols.shift();

        var j = -1;
        var kcol = [];
        for (var i = 0; i < cols.length; i++) {
          if (cols[i].toUpperCase() == "COMMENT") j = 1;
          if (j == -1) kcol.push(cols[i]);
        }

        var SQL =
          "ALTER TABLE " +
          tb +
          " change " +
          column +
          " " +
          column +
          " " +
          kcol.join(" ") +
          ' COMMENT "' +
          req.body.comment +
          '"';

        connection.query(SQL, function (e, r) {
          if (e) return res.end(JSON.stringify(e));
          if (r) {
            connection.query(
              'select * from information_schema.columns where BINARY table_name="' +
                tb +
                '" and BINARY table_schema = "' +
                db +
                '" order by table_name,ordinal_position',
              function (error, results, fields) {
                var Response = {};
                Response.business = "?";
                Response.db = db;
                Response.tb = tb;
                Response.fields = results;
                connection.end();
                res.end(JSON.stringify(Response));
              }
            );
          }
        });
      });
    });
  });

  app.post("/_/db/field/name", function (req, res) {
    var mysql = require("mysql2");
    var db = req.body.db;
    var tb = req.body.tb;
    var from = req.body.from;
    var after = req.body.after;
    var position = req.body.position;

    var pro = "default";
    var userdirdata = userdir + "/" + "db";
    userdirdata += "/" + pro;
    var ini = userdirdata + "/" + "my.ini";
    fs.readFile(ini, function (e, r) {
      if (e) var conf = [];
      else var conf = r.toString("utf-8").split("\n");
      var port = 3306;
      for (var i = 0; i < conf.length; i++) {
        if (conf[i].indexOf("port=") > -1) port = conf[i].split("port=")[1] * 1;
      }
      if (process.env["MYSQL_PASSWORD"])
        var password = process.env["MYSQL_PASSWORD"];
      else var password = "";
      var connection = mysql.createConnection(
        "mysql://root:" +
          password +
          "@127.0.0.1:" +
          port +
          "/" +
          db +
          "?multipleStatements=true"
      );
      var SQL = "show create table " + db + "." + tb;

      connection.query(SQL, function (e, r) {
        var dump = r[0]["Create Table"].split("\n");
        var dumplength = 0;
        for (var i = 0; i < dump.length; i++) {
          var item = dump[i].trim();
          if (item.substr(0, 1) == "`") dumplength++;
        }

        var from = dump[position]
          .substr(0, dump[position].lastIndexOf(","))
          .trim();
        var cols = from.split(" ");
        var column = cols[0];
        cols.shift();

        var SQL =
          "ALTER TABLE " +
          tb +
          " change " +
          column +
          " `" +
          after +
          "` " +
          cols.join(" ") +
          ";";
        connection.query(SQL, function (e, r) {
          if (e) return res.end(JSON.stringify(e));
          if (r) {
            connection.query(
              'select * from information_schema.columns where BINARY table_name="' +
                tb +
                '" and BINARY table_schema = "' +
                db +
                '" order by table_name,ordinal_position',
              function (error, results, fields) {
                var Response = {};
                Response.business = "?";
                Response.db = db;
                Response.tb = tb;
                Response.fields = results;
                connection.end();
                res.end(JSON.stringify(Response));
              }
            );
          }
        });
      });
    });
  });
  app.post("/_/db/field/position", function (req, res) {
    var mysql = require("mysql2");
    var db = req.body.db;
    var tb = req.body.tb;
    var from = req.body.from;
    var after = req.body.after;

    function changePosition(c, db, tb, old, newone, cb) {
      var SQL = "show create table " + db + "." + tb;
      var POS = "ALTER TABLE %TB% CHANGE COLUMN %COLUMN% %FROM% %DEST%;";
      var SQLS = [];
      c.query(SQL, function (e, r) {
        var dump = r[0]["Create Table"].split("\n");
        var dumplength = 0;
        for (var i = 0; i < dump.length; i++) {
          var item = dump[i].trim();
          if (item.substr(0, 1) == "`") dumplength++;
        }
        //console.log(dump);
        var from = dump[old].substr(0, dump[old].lastIndexOf(",")).trim();
        var column = from.split(" ")[0];

        if (newone == 1) var dest = "FIRST";
        else {
          if (newone == dumplength) {
            SQLS.push(
              "ALTER TABLE " + db + "." + tb + " ADD dummy TINYINT(1);"
            );
            SQLS.push("ALTER TABLE " + db + "." + tb + " DROP COLUMN dummy;");
            var dest = "AFTER dummy";
          } else {
            if (dump[newone - 1].trim().split(" ")[0] == column)
              var dest = "AFTER " + dump[newone].trim().split(" ")[0];
            else var dest = "AFTER " + dump[newone - 1].trim().split(" ")[0];
          }
        }
        POS = POS.replace("%TB%", db + "." + tb);
        POS = POS.replace("%COLUMN%", column);
        POS = POS.replace("%FROM%", from);
        POS = POS.replace("%DEST%", dest);
        if (SQLS.length > 1) POS = SQLS[0] + POS + SQLS[1];

        c.query(POS, function (e, r) {
          cb(e, r);
        });
      });
    }

    var pro = "default";
    var userdirdata = userdir + "/" + "db";
    userdirdata += "/" + pro;
    var ini = userdirdata + "/" + "my.ini";
    fs.readFile(ini, function (e, r) {
      if (e) var conf = [];
      else var conf = r.toString("utf-8").split("\n");
      var port = 3306;
      for (var i = 0; i < conf.length; i++) {
        if (conf[i].indexOf("port=") > -1) port = conf[i].split("port=")[1] * 1;
      }
      if (process.env["MYSQL_PASSWORD"])
        var password = process.env["MYSQL_PASSWORD"];
      else var password = "";
      var connection = mysql.createConnection(
        "mysql://root:" +
          password +
          "@127.0.0.1:" +
          port +
          "/" +
          db +
          "?multipleStatements=true"
      );
      changePosition(connection, db, tb, from, after, function (e, r) {
        if (e) return res.end(JSON.stringify(e));
        if (r) {
          connection.query(
            'select * from information_schema.columns where BINARY table_name="' +
              tb +
              '" and BINARY table_schema = "' +
              db +
              '" order by table_name,ordinal_position',
            function (error, results, fields) {
              var Response = {};
              Response.business = "?";
              Response.db = db;
              Response.tb = tb;
              Response.fields = results;
              connection.end();
              res.end(JSON.stringify(Response));
            }
          );
        }
      });
    });
  });
  app.post("/_/db/fields/new", function (req, res) {
    var mysql = require("mysql2");
    var db = req.body.db;
    var tb = req.body.tb;

    function createNew(c, db, tb, cb) {
      var SQL = "show create table " + db + "." + tb;
      var POS = "ALTER TABLE %TB% ADD COLUMN %COLUMN% %TYPE%;";
      var SQLS = [];
      c.query(SQL, function (e, r) {
        var dump = r[0]["Create Table"].split("\n");
        var dumplength = 0;
        var items = [];
        for (var i = 0; i < dump.length; i++) {
          var item = dump[i].trim();
          if (item.substr(0, 1) == "`") {
            items.push(item.split("`")[1]);
            dumplength++;
          }
        }
        var f = 0;
        for (var i = 0; i < items.length; i++) {
          if (items[i].indexOf("field") > -1) f++;
        }
        POS = POS.replace("%TB%", db + "." + tb);
        POS = POS.replace("%COLUMN%", "field" + f);
        POS = POS.replace("%TYPE%", "VARCHAR(255)");

        if (SQLS.length > 1) POS = SQLS[0] + POS + SQLS[1];

        c.query(POS, function (e, r) {
          cb(e, r);
        });
      });
    }

    var pro = "default";
    var userdirdata = userdir + "/" + "db";
    userdirdata += "/" + pro;
    var ini = userdirdata + "/" + "my.ini";
    fs.readFile(ini, function (e, r) {
      if (e) var conf = [];
      else var conf = r.toString("utf-8").split("\n");
      var port = 3306;
      for (var i = 0; i < conf.length; i++) {
        if (conf[i].indexOf("port=") > -1) port = conf[i].split("port=")[1] * 1;
      }
      if (process.env["MYSQL_PASSWORD"])
        var password = process.env["MYSQL_PASSWORD"];
      else var password = "";
      var connection = mysql.createConnection(
        "mysql://root:" +
          password +
          "@127.0.0.1:" +
          port +
          "/" +
          db +
          "?multipleStatements=true"
      );
      createNew(connection, db, tb, function (e, r) {
        if (e) return res.end(JSON.stringify(e));
        if (r) {
          connection.query(
            'select * from information_schema.columns where BINARY table_name="' +
              tb +
              '" and BINARY table_schema = "' +
              db +
              '" order by table_name,ordinal_position',
            function (error, results, fields) {
              var Response = {};
              Response.business = "?";
              Response.db = db;
              Response.tb = tb;
              Response.fields = results;
              connection.end();
              res.end(JSON.stringify(Response));
            }
          );
        }
      });
    });
  });
  app.post("/_/db/field/type", function (req, res) {
    var mysql = require("mysql2");
    var db = req.body.db;
    var tb = req.body.tb;
    var field = req.body.field;
    var type = req.body.type;
    if (type == "VARCHAR") type = "VARCHAR(255)";
    if (type == "VARBINARY") type = "VARBINARY(10)";

    function newType(c, db, tb, field, type, cb) {
      var SQL = "show create table " + db + "." + tb;
      var POS = "ALTER TABLE %TB% MODIFY COLUMN %COLUMN% %TYPE%;";
      var SQLS = [];
      c.query(SQL, function (e, r) {
        var dump = r[0]["Create Table"].split("\n");
        var dumplength = 0;
        var selected = "";
        for (var i = 0; i < dump.length; i++) {
          var item = dump[i].trim();
          if (item.substr(0, 1) == "`") {
            if (item.split("`")[1] == field) selected = item;
            dumplength++;
          }
        }
        selected = selected.split(" ")[0] + " " + selected.split(" ")[1];

        POS = POS.replace("%TB%", db + "." + tb);
        POS = POS.replace("%COLUMN%", "`" + field + "`");

        POS = POS.replace("%TYPE%", type);

        if (SQLS.length > 1) POS = SQLS[0] + POS + SQLS[1];

        c.query(POS, function (e, r) {
          cb(e, r);
        });
      });
    }

    var pro = "default";
    var userdirdata = userdir + "/" + "db";
    userdirdata += "/" + pro;
    var ini = userdirdata + "/" + "my.ini";
    fs.readFile(ini, function (e, r) {
      if (e) var conf = [];
      else var conf = r.toString("utf-8").split("\n");
      var port = 3306;
      for (var i = 0; i < conf.length; i++) {
        if (conf[i].indexOf("port=") > -1) port = conf[i].split("port=")[1] * 1;
      }
      if (process.env["MYSQL_PASSWORD"])
        var password = process.env["MYSQL_PASSWORD"];
      else var password = "";
      var connection = mysql.createConnection(
        "mysql://root:" +
          password +
          "@127.0.0.1:" +
          port +
          "/" +
          db +
          "?multipleStatements=true"
      );
      newType(connection, db, tb, field, type, function (e, r) {
        if (e) return res.end(JSON.stringify(e));
        if (r) {
          connection.query(
            'select * from information_schema.columns where BINARY table_name="' +
              tb +
              '" and BINARY table_schema = "' +
              db +
              '" order by table_name,ordinal_position',
            function (error, results, fields) {
              var Response = {};
              Response.business = "?";
              Response.db = db;
              Response.tb = tb;
              Response.fields = results;
              connection.end();
              res.end(JSON.stringify(Response));
            }
          );
        }
      });
    });
  });
  app.post("/_/db/field/length", function (req, res) {
    var mysql = require("mysql2");
    var db = req.body.db;
    var tb = req.body.tb;
    var field = req.body.field;
    var type = req.body.type;
    type = type + "(" + req.body.length + ")";

    function newType(c, db, tb, field, type, cb) {
      var SQL = "show create table " + db + "." + tb;
      var POS = "ALTER TABLE %TB% MODIFY COLUMN %COLUMN% %TYPE%;";
      var SQLS = [];
      c.query(SQL, function (e, r) {
        var dump = r[0]["Create Table"].split("\n");
        var dumplength = 0;
        var selected = "";
        for (var i = 0; i < dump.length; i++) {
          var item = dump[i].trim();
          if (item.substr(0, 1) == "`") {
            if (item.split("`")[1] == field) selected = item;
            dumplength++;
          }
        }
        selected = selected.split(" ")[0] + " " + selected.split(" ")[1];

        POS = POS.replace("%TB%", db + "." + tb);
        POS = POS.replace("%COLUMN%", "`" + field + "`");

        POS = POS.replace("%TYPE%", type);

        if (SQLS.length > 1) POS = SQLS[0] + POS + SQLS[1];

        c.query(POS, function (e, r) {
          cb(e, r);
        });
      });
    }

    var pro = "default";
    var userdirdata = userdir + "/" + "db";
    userdirdata += "/" + pro;
    var ini = userdirdata + "/" + "my.ini";
    fs.readFile(ini, function (e, r) {
      if (e) var conf = [];
      else var conf = r.toString("utf-8").split("\n");
      var port = 3306;
      for (var i = 0; i < conf.length; i++) {
        if (conf[i].indexOf("port=") > -1) port = conf[i].split("port=")[1] * 1;
      }
      if (process.env["MYSQL_PASSWORD"])
        var password = process.env["MYSQL_PASSWORD"];
      else var password = "";
      var connection = mysql.createConnection(
        "mysql://root:" +
          password +
          "@127.0.0.1:" +
          port +
          "/" +
          db +
          "?multipleStatements=true"
      );
      newType(connection, db, tb, field, type, function (e, r) {
        if (e) return res.end(JSON.stringify(e));
        if (r) {
          connection.query(
            'select * from information_schema.columns where BINARY table_name="' +
              tb +
              '" and BINARY table_schema = "' +
              db +
              '" order by table_name,ordinal_position',
            function (error, results, fields) {
              var Response = {};
              Response.business = "?";
              Response.db = db;
              Response.tb = tb;
              Response.fields = results;
              connection.end();
              res.end(JSON.stringify(Response));
            }
          );
        }
      });
    });
  });
  app.post("/_/db/field/default", function (req, res) {
    var mysql = require("mysql2");
    var db = req.body.db;
    var tb = req.body.tb;
    var field = req.body.field;
    var _default = req.body.default;

    function setDefault(c, db, tb, field, _default, cb) {
      var SQL = "show create table " + db + "." + tb;
      var POS =
        'ALTER TABLE %TB% ALTER COLUMN %COLUMN% SET DEFAULT "%DEFAULT%";';
      var SQLS = [];
      c.query(SQL, function (e, r) {
        var dump = r[0]["Create Table"].split("\n");
        var dumplength = 0;
        var selected = "";
        for (var i = 0; i < dump.length; i++) {
          var item = dump[i].trim();
          if (item.substr(0, 1) == "`") {
            if (item.split("`")[1] == field) selected = item;
            dumplength++;
          }
        }
        selected = selected.split(" ")[0] + " " + selected.split(" ")[1];

        POS = POS.replace("%TB%", db + "." + tb);
        POS = POS.replace("%COLUMN%", "`" + field + "`");

        POS = POS.replace("%DEFAULT%", _default);

        if (SQLS.length > 1) POS = SQLS[0] + POS + SQLS[1];

        c.query(POS, function (e, r) {
          cb(e, r);
        });
      });
    }

    var pro = "default";
    var userdirdata = userdir + "/" + "db";
    userdirdata += "/" + pro;
    var ini = userdirdata + "/" + "my.ini";
    fs.readFile(ini, function (e, r) {
      if (e) var conf = [];
      else var conf = r.toString("utf-8").split("\n");
      var port = 3306;
      for (var i = 0; i < conf.length; i++) {
        if (conf[i].indexOf("port=") > -1) port = conf[i].split("port=")[1] * 1;
      }
      if (process.env["MYSQL_PASSWORD"])
        var password = process.env["MYSQL_PASSWORD"];
      else var password = "";
      var connection = mysql.createConnection(
        "mysql://root:" +
          password +
          "@127.0.0.1:" +
          port +
          "/" +
          db +
          "?multipleStatements=true"
      );
      setDefault(connection, db, tb, field, _default, function (e, r) {
        if (e) return res.end(JSON.stringify(e));
        if (r) {
          connection.query(
            'select * from information_schema.columns where BINARY table_name="' +
              tb +
              '" and BINARY table_schema = "' +
              db +
              '" order by table_name,ordinal_position',
            function (error, results, fields) {
              var Response = {};
              Response.business = "?";
              Response.db = db;
              Response.tb = tb;
              Response.fields = results;
              connection.end();
              res.end(JSON.stringify(Response));
            }
          );
        }
      });
    });
  });
  app.post("/_/db/field/nullable", function (req, res) {
    var mysql = require("mysql2");
    var db = req.body.db;
    var tb = req.body.tb;
    var field = req.body.field;
    var nullable = req.body.nullable;

    function setNull(c, db, tb, field, nullable, cb) {
      var SQL = "show create table " + db + "." + tb;
      var POS = "ALTER TABLE %TB% CHANGE COLUMN %OLD_COL% %COLUMN% %NULLABLE%;";
      var SQLS = [];
      c.query(SQL, function (e, r) {
        var dump = r[0]["Create Table"].split("\n");
        var dumplength = 0;
        var selected = "";
        for (var i = 0; i < dump.length; i++) {
          var item = dump[i].trim();
          if (item.substr(0, 1) == "`") {
            if (item.split("`")[1] == field) selected = item;
            dumplength++;
          }
        }
        selected = selected.split(" ")[0] + " " + selected.split(" ")[1];

        POS = POS.replace("%TB%", db + "." + tb);
        POS = POS.replace("%OLD_COL%", "`" + field + "`");
        POS = POS.replace("%COLUMN%", selected);
        if (nullable == -1) var is_nullable = "NOT NULL";
        else var is_nullable = "";

        POS = POS.replace("%NULLABLE%", is_nullable);

        if (SQLS.length > 1) POS = SQLS[0] + POS + SQLS[1];

        c.query(POS, function (e, r) {
          cb(e, r);
        });
      });
    }

    var pro = "default";
    var userdirdata = userdir + "/" + "db";
    userdirdata += "/" + pro;
    var ini = userdirdata + "/" + "my.ini";
    fs.readFile(ini, function (e, r) {
      if (e) var conf = [];
      else var conf = r.toString("utf-8").split("\n");
      var port = 3306;
      for (var i = 0; i < conf.length; i++) {
        if (conf[i].indexOf("port=") > -1) port = conf[i].split("port=")[1] * 1;
      }
      if (process.env["MYSQL_PASSWORD"])
        var password = process.env["MYSQL_PASSWORD"];
      else var password = "";
      var connection = mysql.createConnection(
        "mysql://root:" +
          password +
          "@127.0.0.1:" +
          port +
          "/" +
          db +
          "?multipleStatements=true"
      );
      setNull(connection, db, tb, field, nullable, function (e, r) {
        if (e) return res.end(JSON.stringify(e));
        if (r) {
          connection.query(
            'select * from information_schema.columns where BINARY table_name="' +
              tb +
              '" and BINARY table_schema = "' +
              db +
              '" order by table_name,ordinal_position',
            function (error, results, fields) {
              var Response = {};
              Response.business = "?";
              Response.db = db;
              Response.tb = tb;
              Response.fields = results;
              connection.end();
              res.end(JSON.stringify(Response));
            }
          );
        }
      });
    });
  });
  app.post("/_/db/field/key", function (req, res) {
    var mysql = require("mysql2");
    var db = req.body.db;
    var tb = req.body.tb;
    var field = req.body.field;
    function keyfield(c, db, tb, field, cb) {
      var SQL = "show create table " + db + "." + tb;
      var POS = "ALTER TABLE %TB% ADD INDEX (%COLUMN%);";
      var SQLS = [];
      c.query(SQL, function (e, r) {
        var dump = r[0]["Create Table"].split("\n");
        var dumplength = 0;
        var items = [];
        for (var i = 0; i < dump.length; i++) {
          var item = dump[i].trim();
          if (item.substr(0, 1) == "`") {
            items.push(item.split("`")[1]);
            dumplength++;
          }
        }
        var f = 0;
        for (var i = 0; i < items.length; i++) {
          if (items[i].indexOf("field") > -1) f++;
        }
        POS = POS.replace("%TB%", db + "." + tb);
        POS = POS.replace("%COLUMN%", field);

        if (SQLS.length > 1) POS = SQLS[0] + POS + SQLS[1];
        c.query(POS, function (e, r) {
          cb(e, r);
        });
      });
    }

    var pro = "default";
    var userdirdata = userdir + "/" + "db";
    userdirdata += "/" + pro;
    var ini = userdirdata + "/" + "my.ini";
    fs.readFile(ini, function (e, r) {
      if (e) var conf = [];
      else var conf = r.toString("utf-8").split("\n");
      var port = 3306;
      for (var i = 0; i < conf.length; i++) {
        if (conf[i].indexOf("port=") > -1) port = conf[i].split("port=")[1] * 1;
      }
      if (process.env["MYSQL_PASSWORD"])
        var password = process.env["MYSQL_PASSWORD"];
      else var password = "";
      var connection = mysql.createConnection(
        "mysql://root:" +
          password +
          "@127.0.0.1:" +
          port +
          "/" +
          db +
          "?multipleStatements=true"
      );
      keyfield(connection, db, tb, field, function (e, r) {
        if (e) return res.end(JSON.stringify(e));
        if (r) {
          connection.query(
            'select * from information_schema.columns where BINARY table_name="' +
              tb +
              '" and BINARY table_schema = "' +
              db +
              '" order by table_name,ordinal_position',
            function (error, results, fields) {
              var Response = {};
              Response.business = "?";
              Response.db = db;
              Response.tb = tb;
              Response.fields = results;
              connection.end();
              res.end(JSON.stringify(Response));
            }
          );
        }
      });
    });
  });
  app.post("/_/db/field/delete", function (req, res) {
    var mysql = require("mysql2");
    var db = req.body.db;
    var tb = req.body.tb;
    var field = req.body.field;

    function delfield(c, db, tb, field, cb) {
      var SQL = "show create table " + db + "." + tb;
      var POS = "ALTER TABLE %TB% DROP %COLUMN%;";
      var SQLS = [];
      c.query(SQL, function (e, r) {
        var dump = r[0]["Create Table"].split("\n");
        var dumplength = 0;
        var items = [];
        for (var i = 0; i < dump.length; i++) {
          var item = dump[i].trim();
          if (item.substr(0, 1) == "`") {
            items.push(item.split("`")[1]);
            dumplength++;
          }
        }
        var f = 0;
        for (var i = 0; i < items.length; i++) {
          if (items[i].indexOf("field") > -1) f++;
        }
        POS = POS.replace("%TB%", db + "." + tb);
        POS = POS.replace("%COLUMN%", field);

        if (SQLS.length > 1) POS = SQLS[0] + POS + SQLS[1];
        c.query(POS, function (e, r) {
          cb(e, r);
        });
      });
    }

    var pro = "default";
    var userdirdata = userdir + "/" + "db";
    userdirdata += "/" + pro;
    var ini = userdirdata + "/" + "my.ini";
    fs.readFile(ini, function (e, r) {
      if (e) var conf = [];
      else var conf = r.toString("utf-8").split("\n");
      var port = 3306;
      for (var i = 0; i < conf.length; i++) {
        if (conf[i].indexOf("port=") > -1) port = conf[i].split("port=")[1] * 1;
      }
      if (process.env["MYSQL_PASSWORD"])
        var password = process.env["MYSQL_PASSWORD"];
      else var password = "";
      var connection = mysql.createConnection(
        "mysql://root:" +
          password +
          "@127.0.0.1:" +
          port +
          "/" +
          db +
          "?multipleStatements=true"
      );
      delfield(connection, db, tb, field, function (e, r) {
        if (e) return res.end(JSON.stringify(e));
        if (r) {
          connection.query(
            'select * from information_schema.columns where BINARY table_name="' +
              tb +
              '" and BINARY table_schema = "' +
              db +
              '" order by table_name,ordinal_position',
            function (error, results, fields) {
              var Response = {};
              Response.business = "?";
              Response.db = db;
              Response.tb = tb;
              Response.fields = results;
              connection.end();
              res.end(JSON.stringify(Response));
            }
          );
        }
      });
    });
  });

  app.post("/_/db/getfields", function (req, res) {
    console.info("z");
    var item = req.body.id.split("|");
    var tb = item[3];
    var mysql = require("mysql2");
    if (item[0] == "Tbx") {
      // Let's see the manifest
      var set = global.project.config + "/" + "settings.json";
      fs.readFile(set, function (e, r) {
        if (e)
          settings = {
            auth: {},
            db: [],
          };
        try {
          settings = JSON.parse(r.toString("utf-8"));
        } catch (e) {
          settings = { auth: {}, db: [] };
        }
        var setup = -1;
        for (var i = 0; i < settings.db.length; i++) {
          if (settings.db[i].name == item[2]) setup = settings.db[i].uri;
        }

        if (setup == -1) return res.end("{}");
        var connection = mysql.createConnection(setup);
        connection.query(
          'select * from information_schema.columns where BINARY table_name="' +
            tb +
            '" and BINARY table_schema = "' +
            setup.substr(setup.lastIndexOf("/") + 1, setup.length) +
            '" order by table_name,ordinal_position',
          function (error, results, fields) {
            var Response = {};
            Response.business = item[2];
            Response.db = setup.substr(
              setup.lastIndexOf("/") + 1,
              setup.length
            );
            Response.tb = tb;
            Response.fields = results;
            connection.end();
            res.end(JSON.stringify(Response));
          }
        );
      });
    } else {
      console.info("xxxxxx");
      var pro = "default";
      var userdirdata = userdir + "/" + "db";
      userdirdata += "/" + pro;
      var ini = userdirdata + "/" + "my.ini";
      var tb = item[3];
      fs.readFile(ini, function (e, r) {
        if (e) var conf = [];
        else var conf = r.toString("utf-8").split("\n");

        var port = 3306;
        for (var i = 0; i < conf.length; i++) {
          if (conf[i].indexOf("port=") > -1)
            port = conf[i].split("port=")[1] * 1;
        }
        if (process.env["MYSQL_PASSWORD"])
          var password = process.env["MYSQL_PASSWORD"];
        else var password = "";
        var connection = mysql.createConnection(
          "mysql://root:" + password + "@127.0.0.1:" + port + "/mysql"
        );
        connection.query(
          'select * from information_schema.columns where binary table_name="' +
            tb +
            '" and binary table_schema = "' +
            item[2] +
            '" order by table_name,ordinal_position',
          function (error, results, fields) {
            var Response = {};
            Response.business = "database";
            Response.db = item[2];
            Response.tb = tb;
            Response.fields = results;
            connection.end();
            res.end(JSON.stringify(Response));
          }
        );
      });
    }
  });
  app.get("/_/db/getnodes", function (req, res) {
    var data = [];
    if (req.query.node == "ROOTNS") {
      data = [
        {
          text: "Client",
          id: "SRC-0",
          iconCls: "ico-browser",
          leaf: false,
        },
        {
          text: "Database",
          id: "Business-0",
          iconCls: "ico-sqlserver",
        },
        {
          text: "API",
          id: "API-0",
          iconCls: "ico-api",
          leaf: true,
        } /*,
        {
          text: "Resources",
          id: "Resources",
          hidden: true,
          iconCls: "ico-res",
        },*/,
      ];
      res.end(JSON.stringify(data));
    }
    if (req.query.node == "ROOTCOMPUTER") {
      data = [
        {
          text: "Database",
          id: "Business-1",
          iconCls: "ico-sqlserver",
        },
      ];
      res.end(JSON.stringify(data));
    }
    if (req.query.node.indexOf("Business") > -1) {
      if (req.query.node.indexOf("Business-0") > -1) {
        var servers = global.manifest.db;
        for (var i = 0; i < servers.length; i++) {
          var obj = {
            text: servers[i],
            id: "XDB" + "|" + i + "|" + servers[i],
            iconCls: "ico-db",
          };
          data.push(obj);
        }
        res.end(JSON.stringify(data));
      } else {
        var mysql = require("mysql2");

        var pro = "default";
        var userdirdata = userdir + "/" + "db";
        userdirdata += "/" + pro;
        var ini = userdirdata + "/" + "my.ini";
        fs.readFile(ini, function (e, r) {
          if (e) var conf = [];
          else var conf = r.toString("utf-8").split("\n");
          var port = 3306;
          for (var i = 0; i < conf.length; i++) {
            if (conf[i].indexOf("port=") > -1)
              port = conf[i].split("port=")[1] * 1;
          }
          if (process.env["MYSQL_PASSWORD"])
            var password = process.env["MYSQL_PASSWORD"];
          else var password = "";
          var connection = mysql.createConnection(
            "mysql://root:" + password + "@127.0.0.1:" + port + "/mysql"
          );
          connection.query("SHOW DATABASES;", function (
            error,
            results,
            fields
          ) {
            if (error) return res.end("{}");
            for (var i = 0; i < results.length; i++) {
              var obj = {
                text: results[i].Database,
                id: "Db|" + results[i].Database,
                iconCls: "ico-db",
              };
              if (
                results[i].Database != "information_schema" &&
                results[i].Database != "sys" &&
                results[i].Database != "performance_schema" &&
                results[i].Database != "mysql"
              )
                data.push(obj);
            }
            connection.end();
            res.end(JSON.stringify(data));
          });
        });
      }
    }
    if (req.query.node.indexOf("XDB") > -1) {
      var mysql = require("mysql2");

      var dx = req.query.node.split("|")[1];
      var servers = req.query.node.split("|")[2];
      var dbname = global.manifest.db[dx];

      var set = global.project.config + "/" + "settings.json";
      fs.readFile(set, function (e, r) {
        if (e)
          settings = {
            auth: {},
            db: [],
          };
        try {
          settings = JSON.parse(r.toString("utf-8"));
        } catch (e) {
          settings = { auth: {}, db: [] };
        }
        var setup = -1;
        for (var i = 0; i < settings.db.length; i++) {
          if (settings.db[i].name == dbname) setup = settings.db[i].uri;
        }

        if (setup == -1) return res.end("{}");
        var connection = mysql.createConnection(setup);
        connection.query(
          "SELECT table_name,table_type FROM information_schema.tables where table_schema='" +
            setup.substr(setup.lastIndexOf("/") + 1, setup.length) +
            "'",
          function (error, results, fields) {
            if (error) {
              return res.end("{}");
            }
            for (var i = 0; i < results.length; i++) {
              if (results[i].table_type != "VIEW") var ico = "ico-tb";
              else var ico = "ico-view";
              var obj = {
                text: results[i].table_name,
                id: "Tbx|" + dx + "|" + servers + "|" + results[i].table_name,
                iconCls: ico,
                leaf: true,
              };
              data.push(obj);
            }
            connection.end();
            res.end(JSON.stringify(data));
          }
        );
      });
    }
    if (req.query.node.indexOf("Db") > -1) {
      var dx = req.query.node.split("|")[1];
      var mysql = require("mysql2");
      var userdir = require("os").homedir() + "/" + "omneedia";
      var pro = "default";
      var userdirdata = userdir + "/" + "db";
      userdirdata += "/" + pro;
      var ini = userdirdata + "/" + "my.ini";
      fs.readFile(ini, function (e, r) {
        if (e) var conf = [];
        else var conf = r.toString("utf-8").split("\n");
        var port = 3306;
        for (var i = 0; i < conf.length; i++) {
          if (conf[i].indexOf("port=") > -1)
            port = conf[i].split("port=")[1] * 1;
        }
        if (process.env["MYSQL_PASSWORD"])
          var password = process.env["MYSQL_PASSWORD"];
        else var password = "";
        var connection = mysql.createConnection(
          "mysql://root:" + password + "@127.0.0.1:" + port + "/mysql"
        );
        connection.query(
          "SELECT table_name,table_type FROM information_schema.tables where table_schema='" +
            dx +
            "'",
          function (error, results, fields) {
            if (error) return res.end("{}");
            for (var i = 0; i < results.length; i++) {
              if (results[i].table_type != "VIEW") var ico = "ico-tb";
              else var ico = "ico-view";
              var obj = {
                text: results[i].table_name,
                id: "Tb|" + "0" + "|" + dx + "|" + results[i].table_name,
                iconCls: ico,
                leaf: true,
              };
              data.push(obj);
            }
            connection.end();
            res.end(JSON.stringify(data));
          }
        );
      });
    }
  });
};
