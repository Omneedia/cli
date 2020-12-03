var getConnection = function (pool, callback) {
  pool.getConnection(function (err, connection) {
    callback(err, connection);
  });
};
function qstr(str) {
  //if (typeof str === 'object') return "";
  if (str == "null") return "NULL";
  if (!str) return "NULL";
  try {
    if (str.indexOf("’") > -1) str = str.replace(/’/g, "'");
  } catch (e) {}
  try {
    var obj =
      "'" +
      str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        //console.log('o');
        switch (char) {
          case "\0":
            return "\\0";
          case "\x08":
            return "\\b";
          case "\x09":
            return "\\t";
          case "\x1a":
            return "\\z";
          case "\n":
            return "\\n";
          case "\r":
            return "\\r";
          case "%":
            return "%";
          case '"':
          case "'":
          case "\\":
            return "\\" + char; // prepends a backslash to backslash, percent,
          // and double/single quotes
        }
      }) +
      "'";
  } catch (e) {
    return "'" + str + "'";
  }
  return obj;
}

module.exports = {
  schema: {
    fields: {
      rename: function (name, o, x) {
        var tb = name.split("://")[1];
        name = name.split("://")[0];
        if (!global.POOL) {
          return x("POOL NOT INITIALIZED");
        }
        if (!global.POOL[name]) {
          return x("DATABASE NOT FOUND");
        }
        if (!o.type) return cb("NO_TYPE");
        if (o.type == "NUMBER") var type = "float";
        if (o.type == "STRING") var type = "varchar(255)";
        if (o.type == "INT") var type = "int(11)";
        if (o.type == "INT") var type = "int(11)";
        getConnection(global.POOL[name], function (e, q) {
          var sql =
            "ALTER TABLE " +
            tb +
            " CHANGE `" +
            o.originalValue +
            "` `" +
            o.name +
            "` " +
            type +
            ";";
          q.query(sql, function (e, r) {
            console.log(sql);
            q.release();
            x(e, r);
          });
        });
      },
      remove: function (name, field_id, x) {
        var tb = name.split("://")[1];
        name = name.split("://")[0];
        if (!global.POOL) {
          return x("POOL NOT INITIALIZED");
        }
        if (!global.POOL[name]) {
          return x("DATABASE NOT FOUND");
        }
        var sql = "ALTER TABLE " + tb + " DROP COLUMN " + field_id + ";";
        getConnection(global.POOL[name], function (e, q) {
          q.query(sql, function (e, r) {
            q.release();
            x(e, r);
          });
        });
      },
      index: {
        set: function (name, o, x) {
          var tb = name.split("://")[1];
          name = name.split("://")[0];
          if (!global.POOL) {
            return x("POOL NOT INITIALIZED");
          }
          if (!global.POOL[name]) {
            return x("DATABASE NOT FOUND");
          }
          var sql = "ALTER TABLE " + tb + " ADD INDEX (" + o + ");";
          getConnection(global.POOL[name], function (e, q) {
            q.query(sql, function (e, r) {
              q.release();
              x(e, r);
            });
          });
        },
        unset: function (name, o, x) {
          var tb = name.split("://")[1];
          name = name.split("://")[0];
          if (!global.POOL) {
            return x("POOL NOT INITIALIZED");
          }
          if (!global.POOL[name]) {
            return x("DATABASE NOT FOUND");
          }
          var sql = "ALTER TABLE " + tb + " DROP INDEX (" + o + ");";
          getConnection(global.POOL[name], function (e, q) {
            q.query(sql, function (e, r) {
              q.release();
              x(e, r);
            });
          });
        },
      },
      unique: {
        set: function (name, o, x) {
          var tb = name.split("://")[1];
          name = name.split("://")[0];
          if (!global.POOL) {
            return x("POOL NOT INITIALIZED");
          }
          if (!global.POOL[name]) {
            return x("DATABASE NOT FOUND");
          }
          var sql = "ALTER TABLE " + tb + " ADD UNIQUE (" + o + ");";
          getConnection(global.POOL[name], function (e, q) {
            q.query(sql, function (e, r) {
              q.release();
              x(e, r);
            });
          });
        },
        unset: function (name, o, x) {
          var tb = name.split("://")[1];
          name = name.split("://")[0];
          if (!global.POOL) {
            return x("POOL NOT INITIALIZED");
          }
          if (!global.POOL[name]) {
            return x("DATABASE NOT FOUND");
          }
          var sql = "ALTER TABLE " + tb + " DROP INDEX (" + o + ");";
          getConnection(global.POOL[name], function (e, q) {
            q.query(sql, function (e, r) {
              q.release();
              x(e, r);
            });
          });
        },
      },
      create: function (name, o, x) {
        var logs = [];
        var tb = name.split("://")[1];
        name = name.split("://")[0];
        if (!global.POOL) {
          return x("POOL NOT INITIALIZED");
        }
        if (!global.POOL[name]) {
          return x("DATABASE NOT FOUND");
        }
        function query(q, s, ndx, cb) {
          if (!s[ndx]) return cb();
          q.query(s[ndx], function (e, r) {
            //console.log(e);
            if (e) logs.push({ error: e });
            logs.push({ response: r });
            query(q, s, ndx + 1, cb);
          });
        }
        var script = [];
        if (!Array.isArray(o)) o = [o];
        for (var i = 0; i < o.length; i++) {
          var item = o[i];
          if (item.type == "STRING") {
            script.push(
              "ALTER TABLE `" +
                tb +
                "` ADD `" +
                item.name +
                "` varchar(255) NULL default '-';"
            );
            script.push(
              "ALTER TABLE `" +
                tb +
                "` MODIFY `" +
                item.name +
                "` varchar(255) NULL default '-';"
            );
          }
          if (item.type == "INT") {
            script.push(
              "ALTER TABLE `" +
                tb +
                "` ADD `" +
                item.name +
                "` bigint NULL default '0';"
            );
            script.push(
              "ALTER TABLE `" +
                tb +
                "` MODIFY `" +
                item.name +
                "` bigint NULL default '0';"
            );
          }
          if (item.type == "NUMBER") {
            script.push(
              "ALTER TABLE `" +
                tb +
                "` ADD `" +
                item.name +
                "` float NULL default '0.00';"
            );
            script.push(
              "ALTER TABLE `" +
                tb +
                "` MODIFY `" +
                item.name +
                "` float NULL default '0.00';"
            );
          }
        }
        getConnection(global.POOL[name], function (e, q) {
          query(q, script, 0, function (logs) {
            q.release();
            x(null, logs);
          });
        });
      },
    },
    update: function (name, from, dest, x) {
      if (!global.POOL) {
        return x("POOL NOT INITIALIZED");
      }
      if (!global.POOL[name]) {
        return x("DATABASE NOT FOUND");
      }
      getConnection(global.POOL[name], function (e, q) {
        if (e) return x(e);
        q.query("RENAME TABLE " + from + " TO " + dest, function (e, r) {
          q.release();
          x(e, r);
        });
      });
    },
    create: function (name, x) {
      var tb = name.split("://")[1];
      name = name.split("://")[0];
      if (!global.POOL) {
        return x("POOL NOT INITIALIZED");
      }
      if (!global.POOL[name]) {
        return x("DATABASE NOT FOUND");
      }
      getConnection(global.POOL[name], function (e, q) {
        if (e) return x(e);
        var create_query = `CREATE TABLE \`%s\` (
  \`KEY_%s\` bigint NOT NULL AUTO_INCREMENT,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`KEY_%s\`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;`;
        q.query(require("util").format(create_query, tb, tb, tb), function (
          e,
          r
        ) {
          if (e) return x(e);
          q.release();
          x(null, r);
        });
      });
    },
    remove: function (name, x) {
      var tb = name.split("://")[1];
      name = name.split("://")[0];
      if (!global.POOL) {
        return x("POOL NOT INITIALIZED");
      }
      if (!global.POOL[name]) {
        return x("DATABASE NOT FOUND");
      }
      getConnection(global.POOL[name], function (e, q) {
        if (e) return x(e);
        q.query("DROP TABLE " + tb + ";", function (e, r) {
          if (e) return x(e);
          q.release();
          x(null, r);
        });
      });
    },
  },

  query: function (name, sql, fn, x) {
    if (!global.POOL) {
      if (x) return x("POOL NOT INITIALIZED");
      else return fn("POOL NOT INITIALIZED");
    }
    if (name.indexOf("://") > -1) {
      var q = require("./dbquery");
      var z = {
        __SQL__: name,
        db: require(__dirname + "/db"),
      };
      return q.exec(z, function (e, x) {
        if (x.data) x = x.data;
        sql(e, x);
      });
    }
    if (!global.POOL[name]) {
      if (x) return x("DATABASE NOT FOUND");
      else return fn("DATABASE NOT FOUND");
    }
    getConnection(global.POOL[name], function (e, q) {
      if (e) return x(e);
      if (x)
        q.query(sql, fn, function (err, rows, fields) {
          q.release();
          x(err, rows, fields);
        });
      else
        q.query(sql, function (err, rows, fields) {
          q.release();
          fn(err, rows, fields);
        });
    });
  },
  model: function (name, sql, fn, o) {
    if (name.indexOf("://") > -1) {
      var q = require("./dbquery");
      var z = {
        __SQL__: name,
        db: require(__dirname + "/db"),
      };
      return q.exec(z, function (e, x) {
        sql(e, x);
      });
    }
    function getMySQLType(typ) {
      var types = require("mysql2").Types;
      for (var el in types) {
        if (types[el] == typ) return el;
      }
    }
    try {
      if (sql.toLowerCase().indexOf("limit") > -1)
        sql = sql.substr(0, sql.toLowerCase().indexOf("limit"));
    } catch (e) {
      return fn("NO SQL");
    }
    var model = {
      type: "raw",
      metaData: {
        idProperty: -1,
        totalProperty: "total",
        successProperty: "success",
        root: "data",
        fields: [],
        columns: [],
      },
      total: 0,
      data: [],
      success: false,
      message: "failure",
    };

    if (!global.POOL) return fn("POOL NOT INITIALIZED");
    if (!global.POOL[name]) {
      return fn("DATABASE NOT FOUND");
    }
    var from = sql.substr(sql.toUpperCase().indexOf("FROM"), sql.length);
    var psql = "SELECT STRAIGHT_JOIN COUNT(*) total " + from;
    getConnection(global.POOL[name], function (e, q) {
      if (e) return fn(e);
      q.query(psql, function (err, rows, fields) {
        if (!err) {
          var total = rows[0].total;
          var ORDER_BY = [];
          if (o) {
            if (total < o.start) {
              o.start = 0;
              o.page = 1;
            }
            var ll = o.start + o.limit;
            if (ll >= total) o.limit = total - o.start;

            if (o.sort) {
              for (var i = 0; i < o.sort.length; i++) {
                ORDER_BY.push(o.sort[i].property + " " + o.sort[i].direction);
              }
              ORDER_BY = " order by " + ORDER_BY.join(",") + " ";
            } else ORDER_BY = "";
            sql = sql + ORDER_BY + " limit " + o.start + "," + o.limit;
          }

          if (sql.toUpperCase().indexOf("STRAIGHT_JOIN") == -1) {
            sql = sql.replace(/select/i, "SELECT STRAIGHT_JOIN");
          }

          if (e) return fn(e);
          q.query(sql, function (err, rows, fields) {
            if (!err) {
              model.success = true;
              model.message = "OK";
              model.data = rows;
              model.total = total;
              for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                var typ = getMySQLType(field.columnType).toLowerCase();
                if (typ == "var_string") typ = "string";
                if (typ == "long") typ = "int";
                if (typ == "longlong") typ = "int";
                if (typ == "newdecimal") typ = "float";
                if (typ == "blob") typ = "string";
                if (typ == "tiny") typ = "boolean";
                if (typ == "short") typ = "int";
                if (typ == "int24") typ = "int";
                if (typ == "double") typ = "float";
                if (field.flags == "16899")
                  model.metaData.idProperty = field.name;
                var o = {
                  name: field.name,
                  type: typ,
                  length: field.length,
                };
                if (o.type.indexOf("date") > -1) {
                  o.dateFormat = "c";
                  o.type = "date";
                }
                model.metaData.fields[model.metaData.fields.length] = o;
              }
            } else {
              model.message = err;
            }
            q.release();
            fn(err, model);
          });
        } else {
          model.message = err;
          fn(err, model);
        }
      });
    });
  },
  del: function (name, tb, ndx, cb) {
    if (!global.POOL) return cb("POOL NOT INITIALIZED");
    if (!global.POOL[name]) return cb("DATABASE NOT FOUND");

    var q = global.POOL[name];
    var sql = "";
    if (!ndx.isArray) ndx = [ndx];
    for (var i = 0; i < ndx.length; i++) {
      ndx[i] = qstr(ndx[i]);
    }
    // get index
    q.query(
      "show index from " + tb + " where Key_name = 'PRIMARY' ;",
      function (e, r) {
        if (r.length > 0) {
          var x = r[0].Column_name;
          //console.log('_____ DELETE');
          var sql =
            "DELETE FROM " + tb + " WHERE " + x + " in (" + ndx.join(",") + ")";
          //console.log(sql);
          q.query(sql, function (err, rows, fields) {
            cb(err, rows);
          });
        }
      }
    );
  },
  posts: function (name, tb, o, ndx, results, cb) {
    var _p = this;
    this.post(name, tb, o[ndx], function (e, r) {
      if (ndx + 1 < o.length) {
        if (e) results.push(e);
        else results.push(r);
        _p.posts(name, tb, o, ndx + 1, results, cb);
      } else {
        if (e) results.push(e);
        else results.push(r);
        cb(null, results);
      }
    });
  },
  getIndex: function (name, tb, cb) {
    if (!global.POOL) return cb("POOL NOT INITIALIZED");
    if (!global.POOL[name]) return cb("DATABASE NOT FOUND");
    var q = global.POOL[name];
    var sql = "";
    // get index
    //console.log("show index from "+tb+" where Key_name = 'PRIMARY' ;");
    q.query(
      "show index from " + tb + " where Key_name = 'PRIMARY' ;",
      function (e, r) {
        //console.log(e);
        if (!r) cb(false);
        else if (r.length > 0) {
          var ndx = r[0].Column_name;
          cb(ndx);
        } else cb(false);
      }
    );
  },
  makeTree: function (name, tb, cb) {
    var _makeTree = function (options) {
      var children, e, id, o, pid, temp, _i, _len, _ref;
      id = "id";
      pid = "parent";
      children = "children";
      temp = {};
      o = [];
      _ref = options.q;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        e = _ref[_i];
        e.leaf = true;
        e[children] = [];
        temp[e[id]] = e;
        if (temp[e[pid]] != null) {
          temp[e[pid]][children].push(e);
          if (temp[e[pid]][children].length > 0) temp[e[pid]].leaf = false;
        } else {
          o.push(e);
        }
      }

      return o;
    };
    this.query(name, tb, function (e, r) {
      cb(_makeTree({ q: r }));
    });
  },
  q: function (db, sql, x) {
    var me = this;
    return new Promise((resolve, reject) => {
      me.query(
        db,
        sql,
        function (err, result) {
          if (err) return reject(err);
          resolve(result);
        },
        x
      );
    });
  },
  post: function (name, tb, o, cb) {
    var response = {
      type: "raw",
      success: false,
      message: "failure",
      data: [],
    };
    if (name.indexOf("://") > -1) {
      cb = o;
      o = tb;
      tb = name.split("://")[1];
      name = name.split("://")[0];
    }
    if (Object.prototype.toString.call(o) === "[object Array]") {
      if (o.length == 0) {
        response.message = "success";
        response.success = true;
        cb(response);
        return;
      }
      this.posts(name, tb, o, 0, [], cb);
      return;
    }

    function isDate(fld, e, response) {
      for (var i = 0; i < response.length; i++) {
        if (response[i].Field == fld) {
          if (response[i].Type.indexOf("date") > -1) return true;
          else return false;
        }
      }
    }

    function ISODateString(d) {
      if (!d) return null;

      function isDate(d) {
        return d instanceof Date && !isNaN(date.valueOf());
      }
      String.prototype.toDate = function () {
        try {
          var mydate = this.split("T")[0];
          var mytime = this.split("T")[1].split("Z")[0];
          var y = mydate.split("-")[0] * 1;
          var M = mydate.split("-")[1] * 1 - 1;
          var d = mydate.split("-")[2] * 1;
          var h = mytime.split(":")[0] * 1;
          var m = mytime.split(":")[1] * 1;
          var s = mytime.split(":")[2] * 1;
          var x = new Date(y, M, d, h, m, s);
          //x.setHours(x.getHours() - x.getTimezoneOffset() / 60);
          return x;
        } catch (e) {
          return new Date(0, 0, 0, 0, 0, 0);
        }
      };

      function pad(n) {
        return n < 10 ? "0" + n : n;
      }
      try {
        if (!isDate(d)) d = d.toDate();
      } catch (e) {}
      return (
        d.getFullYear() +
        "-" +
        pad(d.getMonth() + 1) +
        "-" +
        pad(d.getDate()) +
        " " +
        pad(d.getHours()) +
        ":" +
        pad(d.getMinutes()) +
        ":" +
        pad(d.getSeconds())
      );
    }

    function getBase64(fld, x, ob, cb) {
      if (!fld[x]) cb();
      else {
        var path = ob[fld[x].Field];
        if (!path) {
          x++;
          getBase64(fld, x, ob, cb);
          return;
        }
        try {
          var request = App.using("request").defaults({
            encoding: null,
          });
        } catch (e) {
          var request = global.request;
        }

        if (!request) return getBase64(fld, x + 1, ob, cb);
        try {
          if (path.substr(0, 4) == "url(")
            path = path.substr(path.indexOf("url(") + 1, path.length - 1);
          if (path.substr(0, 3) == "://")
            request.get(path, function (error, response, body) {
              if (!error && response.statusCode == 200) {
                data =
                  "data:" +
                  response.headers["content-type"] +
                  ";base64," +
                  new Buffer(body, "binary").toString("base64");
                ob[fld[x].Field] = data;
                x++;
                getBase64(fld, x, ob, cb);
              } else {
                // ressource non disponible
                x++;
                getBase64(fld, x, ob, cb);
              }
            });
          else {
            x++;
            getBase64(fld, x, ob, cb);
          }
        } catch (e) {
          x++;
          getBase64(fld, x, ob, cb);
        }
      }
    }
    var isDBX = 0;
    if (!global.POOL) return cb("POOL NOT INITIALIZED");
    if (!global.POOL[name]) return cb("DATABASE NOT FOUND");
    var q = global.POOL[name];
    var sql = "";
    // get index
    var all_o = [];
    for (var el in o) all_o.push(el);
    q.query("SHOW COLUMNS FROM " + tb, function (e, response) {
      if (e) return cb(tb + " NOT FOUND");
      var r = [];
      var _fields = [];
      var _boolean = [];
      var zobj = {};
      for (var i = 0; i < response.length; i++) {
        if (all_o.indexOf(response[i].Field) > -1)
          zobj[response[i].Field] = o[response[i].Field];
        if (response[i].Key == "PRI")
          r.push({
            Column_name: response[i].Field,
          });
        var tytpe = response[i].Type.toUpperCase();
        if (response[i].Field == "createdAt") isDBX = 1;

        if (tytpe.indexOf("TINYINT") > -1) _boolean.push(response[i].Field);
        if (
          tytpe == "LONGTEXT" ||
          tytpe.indexOf("BLOB") > -1 ||
          tytpe.indexOf("BINARY") > -1
        )
          _fields.push(response[i]);
      }
      o = zobj;
      //console.log(o);
      getBase64(_fields, 0, o, function () {
        if (r.length > 0) {
          //console.log(o);
          var ndx = r[0].Column_name;
          if (!o[ndx]) {
            //console.log('_____ INSERT');
            var fields = [];
            var values = [];
            for (var el in o) {
              fields.push(el);
              if (_boolean.indexOf(el) > -1) {
                if (o[el] == "true") o[el] = "1";
                if (o[el] == "false") o[el] = "0";
                if (o[el]) o[el] = "1";
                if (!o[el]) o[el] = "0";
                if (o[el] === null) o[el] = "0";
              }

              if (isDate(el, o[el], response)) {
                try {
                  if (o[el].indexOf("T") > -1)
                    values.push(
                      qstr(
                        o[el].split("T")[0] +
                          " " +
                          o[el].split("T")[1].split("Z")[0]
                      )
                    );
                  else values.push(o[el]);
                } catch (e) {
                  values.push(qstr(ISODateString(o[el])));
                }
              } else {
                if (typeof o[el] === "object")
                  values.push(qstr(JSON.stringify(o[el])));
                else {
                  try {
                    if (o[el].toLowerCase() == "null")
                      values.push(o[el].toUpperCase());
                    else {
                      if (o[el].indexOf("{{") == 0)
                        values.push(
                          "(" + o[el].split("{{")[1].split("}}")[0] + ")"
                        );
                      else values.push(qstr(o[el]));
                    }
                  } catch (e) {
                    values.push(qstr(o[el]));
                  }
                }
              }
            }
            /*if (isDBX == 1) {
              fields.push("createdAt");
              values.push(
                qstr(new Date().toISOString().slice(0, 19).replace("T", " "))
              );
              fields.push("updatedAt");
              values.push(
                qstr(new Date().toISOString().slice(0, 19).replace("T", " "))
              );
            }*/
            var sql =
              "INSERT INTO " +
              tb +
              " (`" +
              fields.join("`,`") +
              "`) VALUES (" +
              values.join(",") +
              ")";
            //console.log(sql);
            q.query(sql, function (err, rows, fields) {
              if (rows) {
                err = null;
                rows.method = "INSERT";
              } else rows = err;
              cb(err, rows);
            });
          } else {
            var sql = "SELECT * FROM " + tb + " WHERE ";
            var params = [];
            for (var j = 0; j < r.length; j++) {
              var ndx = r[j].Column_name;
              params.push(ndx + "=" + qstr(o[ndx]));
            }
            sql += params.join(" AND ");
            q.query(sql, function (err, rows) {
              if (rows.length == 0) {
                // console.log('_____ INSERT');
                var fields = [];
                var values = [];
                var ol = 0;
                for (var el in o) {
                  fields.push(el);
                  if (_boolean.indexOf(el) > -1) {
                    if (o[el] == "true") o[el] = "1";
                    if (o[el] == "false") o[el] = "0";
                    if (o[el]) o[el] = "1";
                    if (!o[el]) o[el] = "0";
                    if (o[el] === null) o[el] = "0";
                  }
                  if (isDate(el, o[el], response)) {
                    try {
                      if (o[el].indexOf("T") > -1)
                        values.push(
                          qstr(
                            o[el].split("T")[0] +
                              " " +
                              o[el].split("T")[1].split("Z")[0]
                          )
                        );
                    } catch (e) {
                      values.push(qstr(ISODateString(o[el])));
                    }
                  } else {
                    if (typeof o[el] === "object")
                      values.push(qstr(JSON.stringify(o[el])));
                    else {
                      try {
                        if (o[el].toLowerCase() == "null")
                          values.push(o[el].toUpperCase());
                        else values.push(qstr(o[el]));
                      } catch (e) {
                        values.push(qstr(o[el]));
                      }
                    }
                  }
                  if (!values[ol]) values.push("NULL");
                  ol++;
                }
                /*if (isDBX == 1) {
                  fields.push("createdAt");
                  values.push(
                    qstr(
                      new Date().toISOString().slice(0, 19).replace("T", " ")
                    )
                  );
                  fields.push("updatedAt");
                  values.push(
                    qstr(
                      new Date().toISOString().slice(0, 19).replace("T", " ")
                    )
                  );
                }*/
                var sql =
                  "INSERT INTO " +
                  tb +
                  " (`" +
                  fields.join("`,`") +
                  "`) VALUES (" +
                  values.join(",") +
                  ")";
                //console.log(sql);
                q.query(sql, function (err, rows, fields) {
                  if (rows) {
                    err = null;
                    rows.method = "INSERT";
                  } else rows = err;
                  cb(err, rows);
                });
              } else {
                //console.log('_____ UPDATE');
                var fields = [];
                for (var el in o) {
                  if (_boolean.indexOf(el) > -1) {
                    if (o[el] == "true") o[el] = "1";
                    if (o[el] == "false") o[el] = "0";
                    if (o[el]) o[el] = "1";
                    if (!o[el]) o[el] = "0";
                    if (o[el] === null) o[el] = "0";
                  }
                  if (isDate(el, o[el], response)) {
                    try {
                      if (o[el].indexOf("T") > -1)
                        values.push(
                          "`" +
                            el +
                            "`" +
                            "=" +
                            qstr(
                              o[el].split("T")[0] +
                                " " +
                                o[el].split("T")[1].split("Z")[0]
                            )
                        );
                    } catch (e) {
                      fields.push(
                        "`" + el + "`" + "=" + qstr(ISODateString(o[el]))
                      );
                    }
                  } else {
                    if (typeof o[el] === "object")
                      fields.push(
                        "`" + el + "`" + "=" + qstr(JSON.stringify(o[el]))
                      );
                    else {
                      try {
                        if (o[el].toLowerCase() == "null")
                          fields.push("`" + el + "`" + "=" + o[el]);
                        else fields.push("`" + el + "`" + "=" + qstr(o[el]));
                      } catch (e) {
                        fields.push("`" + el + "`" + "=" + qstr(o[el]));
                      }
                    }
                  }
                }
                /*if (isDBX == 1) {
                  fields.push("updatedAt");
                  values.push(
                    'updatedAt="' +
                      new Date().toISOString().slice(0, 19).replace("T", " ") +
                      '"'
                  );
                }*/
                var sql =
                  "UPDATE " +
                  tb +
                  " SET " +
                  fields.join(",") +
                  " WHERE " +
                  params.join(" AND ");
                //console.log(sql);
                q.query(sql, function (err, rows, fields) {
                  if (rows) {
                    err = null;
                    rows.method = "UPDATE";
                    rows.indexID = ndx;
                    rows.indexValue = o[ndx];
                  } else rows = err;
                  cb(err, rows);
                });
              }
            });
          }
        } else cb("ERR: No index in table", null);
      });
    });
  },
  get: function (q, objects, where, cb) {
    var callsite = require("callsite");
    var path = require("path");
    var stack = callsite();
    var fs = require("fs");
    var requester = stack[1].getFileName();
    var d =
      path.dirname(requester) + path.sep + "sql" + path.sep + q + ".universe";
    if (cb) {
      fs.readFile(d, function (e, r) {
        if (e) return cb("NOT_FOUND", null);
        var sql = r.toString("utf-8").split("\n");
        var dbname = sql[0];
        sql = sql.splice(0);
        sql = sql.join(" ");
        sql = sql.replace("$_OBJECTS", objects.join(", "));
        if (where.length > 0) {
          where.splice(0, 0, "WHERE");
          sql = sql.replace("$_WHERE", where.join(" "));
        }
        var sqlfollows = "";
        for (var i = 2; i < sql.split("SELECT").length; i++) {
          sqlfollows += " SELECT " + sql.split("SELECT")[i];
        }
        cb(
          null,
          "SELECT " +
            sql
              .replace(/\n/g, "")
              .replace(/\r/g, "")
              .replace(/\s/g, " ")
              .split("SELECT")[1] +
            sqlfollows
        );
      });
      return;
    }
    // DO NOT USE DEPRECATED
    if (fs.existsSync(d)) {
      var sql = fs.readFileSync(d, "utf-8").split("\n");
      var dbname = sql[0];
      sql = sql.splice(0);
      sql = sql.join(" ");
      sql = sql.replace("$_OBJECTS", objects.join(", "));
      if (where.length > 0) {
        where.splice(0, 0, "WHERE");
        sql = sql.replace("$_WHERE", where.join(" "));
      }
      var sqlfollows = "";
      for (var i = 2; i < sql.split("SELECT").length; i++) {
        sqlfollows += " SELECT " + sql.split("SELECT")[i];
      }
      return (
        "SELECT " +
        sql
          .replace(/\n/g, "")
          .replace(/\r/g, "")
          .replace(/\s/g, " ")
          .split("SELECT")[1] +
        sqlfollows
      );
    }
  },
};
