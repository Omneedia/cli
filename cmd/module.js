module.exports = function (args, root) {
  var REGISTRY_NPM = 'https://npm.siipro.fr';
  var url_modules =
    'https://gitlab.com/api/v4/projects/20222374/repository/tree';
  var oa_registry_url = 'https://gitlab.com/oa-registry/';
  var oa_registry_pkg =
    oa_registry_url +
    'repository/-/raw/master/%PACKAGE/package.yaml?inline=true';
  var oa_registry_zip =
    oa_registry_url +
    'repository/-/archive/master/repository-master.zip?path=PACKAGE';
  var findUp = require('find-up');
  var prettyjson = require('prettyjson');
  var shelljs = require('shelljs');
  var logSymbols = require('log-symbols');
  var chalk = require('chalk');
  const fs = require('node-fs-extra');
  const path = require('path');
  var boxen = require('boxen');
  var yaml = require('yaml');
  var error = require('../lib/utils/error');
  var stripCssComments = require('strip-css-comments');
  var rmdir = require('rimraf');
  var UglifyCSS = require('uglifycss');
  var UglifyJS = require('terser');
  const ora = require('ora');
  var unzip = require('unzip-stream');
  var rimraf = require('rimraf');
  var mod = [];
  var MOD = [];

  var JS = [];
  var CSS = [];
  var resources = [];
  var ITEMS = [];

  Array.prototype.remove = function () {
    var what,
      a = arguments,
      L = a.length,
      ax;
    while (L && this.length) {
      what = a[--L];
      while ((ax = this.indexOf(what)) !== -1) {
        this.splice(ax, 1);
      }
    }
    return this;
  };

  function loadBase64Image(ITEMS, len, cb, i) {
    if (!i) i = 0;
    if (i == len) {
      console.log(logSymbols.success + '  processed.');
      return cb(ITEMS);
    }
    var cp = 0;
    var item = '';
    var el = '';
    for (var elx in ITEMS) {
      if (cp == i) {
        el = elx;
        item = ITEMS[elx];
      }
      cp++;
    }
    console.log(
      '   [' +
        (i + 1) +
        '/' +
        len +
        ']\t' +
        chalk.bold(' adding asset \t(' + path.basename(item) + ')')
    );
    if (item.indexOf('.woff') > -1) {
      ITEMS[el] =
        'fonts/' + item.substr(item.lastIndexOf('/') + 1, item.length);
      return fs.mkdir(global.rootDir + '/dist/fonts/', function () {
        fs.copyFile(
          item,
          global.rootDir + '/dist/fonts/' + path.basename(item),
          function () {
            loadBase64Image(ITEMS, len, cb, i + 1);
          }
        );
      });
    }
    if (item.indexOf('://') == -1) {
      fs.readFile(item, function (e, body) {
        if (body) {
          var base64prefix = 'data:' + getMIME(item) + ';base64,',
            image = body.toString('base64');
          ITEMS[el] = base64prefix + image;
        } else {
          var str = '	! NOT FOUND: ' + item;
          ITEMS[el] = '';
        }
        process.stdout.clearLine(); // clear current text
        process.stdout.cursorTo(0);
        loadBase64Image(ITEMS, len, cb, i + 1);
      });
    } else {
      request(
        {
          url: item,
          encoding: null,
          gzip: true,
        },
        function (err, res, body) {
          if (!err && res.statusCode == 200) {
            // So as encoding set to null then request body became Buffer object
            var base64prefix =
                'data:' + res.headers['content-type'] + ';base64,',
              image = body.toString('base64');
            ITEMS[el] = base64prefix + image + '';
          } else {
            ITEMS[el] = '';
          }
          process.stdout.clearLine(); // clear current text
          process.stdout.cursorTo(0);

          loadBase64Image(ITEMS, len, cb, i + 1);
        }
      );
    }
  }

  function getMIME(filename) {
    if (filename.indexOf('.gif') > -1) return 'image/gif';
    if (filename.indexOf('.jpg') > -1) return 'image/jpeg';
    if (filename.indexOf('.png') > -1) return 'image/png';
    if (filename.indexOf('.eot') > -1) return 'application/vnd.ms-fontobject';
    if (filename.indexOf('.woff') > -1) return 'application/font-woff';
    if (filename.indexOf('.woff2') > -1) return 'application/font-woff2';
    if (filename.indexOf('.ttf') > -1) return 'application/font-ttf';
    if (filename.indexOf('.svg') > -1) return 'image/svg+xml';
  }

  function compileCSS(body, cb, url) {
    console.log(
      '   processing: ' + url.substr(url.lastIndexOf('/') + 1, url.length)
    );
    var notrendered = false;

    if (global.config) {
      if (global.config.css == 'not-render') {
        var css = stripCssComments(body, {
          preserve: false,
        });
        css = UglifyCSS.processString(css);
        CSS.push(css);
        return cb();
      }
    }
    // remote content
    var durl = url.lastIndexOf('/');
    durl = url.substr(0, durl);
    var result = body.split('url(');
    var o = [];
    o[0] = '-1';
    if (body == '\n') return cb();
    if (body == '') return cb();
    var prefix = result[0];

    var ITEMS = {};

    for (var i = 1; i < result.length; i++) {
      var tt = result[i].indexOf(')');
      var test = result[i].substr(0, tt).split('?')[0];
      test = test.replace(/["']/g, '');
      var type = test.lastIndexOf('.');
      var type = test.substr(type + 1, test.length).toLowerCase();
      if (
        type == 'gif' ||
        type == 'jpg' ||
        type == 'png' ||
        type == 'eot' ||
        type == 'ttf' ||
        type == 'woff' ||
        type == 'woff2' ||
        type == 'svg'
      ) {
        o.push(durl + '/' + test);
        ITEMS[test] = durl + '/' + test;
      } else {
        o.push('-1');
      }
    }

    var len = 0;
    for (var el in ITEMS) {
      len++;
    }

    loadBase64Image(ITEMS, len, function (ITEMS) {
      var text = body;

      for (var el in ITEMS) {
        var re = new RegExp(el, 'g');
        text = text.replace(re, ITEMS[el]);
      }

      var css = stripCssComments(text, {
        preserve: false,
      });

      css = UglifyCSS.processString(css);
      CSS.push(css);

      cb();
    });
  }

  function tpl(url) {
    var params = [];
    for (var el in global.config) {
      if (el != 'src') params.push(el);
    }
    for (var j = 0; j < params.length; j++) {
      var replace = '{' + params[j] + '}';
      var re = new RegExp(replace, 'g');
      url = url.replace(re, global.config[params[j]]);
    }
    return url;
  }

  function transpiler(src, ndx, cb) {
    if (!src[ndx]) return cb();
    var dir = tpl(global.config.src[ndx]);

    if (dir.indexOf('.js') > -1) {
      var spinner = ora(
        'adding javascript: ' + chalk.bold(path.basename(dir))
      ).start();

      setTimeout(function () {
        fs.readFile(global.rootDir + '/src/' + dir, 'utf-8', function (e, b) {
          var result = UglifyJS.minify(b);
          if (e) return error('Source not found');
          JS.push(result.code);
          if (!result.code) {
            spinner.fail(
              ' adding javascript: ' + chalk.red.bold(path.basename(dir))
            );
            return error(result.error);
          }
          spinner.succeed(
            ' added javascript: ' + chalk.bold(path.basename(dir))
          );
          transpiler(src, ndx + 1, cb);
        });
      }, 1000);
      return;
    }

    if (dir.indexOf('.css') > -1) {
      var spinner = ora(
        'adding resource:   ' + chalk.bold(path.basename(dir))
      ).start();
      fs.readFile(global.rootDir + '/src/' + dir, 'utf-8', function (e, b) {
        spinner.succeed(' added resource:   ' + chalk.bold(path.basename(dir)));
        compileCSS(
          b,
          function () {
            transpiler(src, ndx + 1, cb);
          },
          global.rootDir + '/src/' + dir
        );
      });
    }
  }

  function build_i18n(cb) {
    if (!global.config.i18n) return cb();
    var i18n_dir = global.rootDir + '/src/' + tpl(global.config.i18n);
    function update_langs(langs, ndx, cb) {
      if (!langs) return cb();
      if (!langs[ndx]) return cb();
      var lang = langs[ndx].split('.yaml')[0];
      fs.readFile(i18n_dir + '/' + lang + '.yaml', function (e, r) {
        if (e) return update_langs(langs, ndx + 1, cb);
        var l = yaml.parse(r.toString('utf-8'));
        for (var el in l) {
          l[el] = l[el].toString();
          if (l[el])
            CSS.push(
              ':lang(' +
                lang +
                ').' +
                el +
                ":before { content: '" +
                l[el].replace(/'/g, "\\'") +
                "' }"
            );
        }
        update_langs(langs, ndx + 1, cb);
      });
    }
    fs.readdir(i18n_dir, function (e, langs) {
      update_langs(langs, 0, cb);
    });
  }

  function install_pkg(pkg, cb) {
    var pkg2 = pkg.replace('@', '_');
    var url = oa_registry_zip.replace(/PACKAGE/g, pkg2);

    console.log(chalk.bold('\n- loading module ' + pkg + '\t'));

    spinner = ora('loading module').start();
    fs.stat(
      global.project.bin + '/web_modules/dist/' + pkg2 + '/package.yaml',
      function (e, s) {
        if (s) return cb();
        if (e)
          return global
            .request(url)
            .pipe(
              unzip.Extract({ path: global.project.bin + '/web_modules/dist' })
            )
            .on('close', function () {
              spinner.succeed(chalk.green.bold(' ok'));
              //repository-master-extjs-core-classic_6.6.0
              shelljs.mv(
                global.project.bin +
                  '/web_modules/dist/repository-master-' +
                  pkg2,
                global.project.bin + '/web_modules/dist/' + pkg2
              );
              cb();
            });
      }
    );
  }

  function builder(pkg, cbz) {
    function fabrik(test) {
      if (!test)
        return error('You must be inside an omneedia module directory');
      global.rootDir = path.normalize(path.dirname(test) + '/..');

      fs.readFile(test, 'utf-8', function (e, r) {
        try {
          global.config = yaml.parse(r);
        } catch (e) {
          var u = test.substr(0, test.lastIndexOf('/'));
          u = u.substr(u.lastIndexOf('/') + 1, u.length).replace('_', '@');
          if (!cbz) error('There is an error with your package');
          else {
            return install_pkg(u, cbz);
          }
        }
        if (!cbz) {
          console.log(
            boxen(
              chalk.cyan(
                ' ' +
                  'Module : ' +
                  chalk.bold(global.config.module) +
                  '@' +
                  chalk.bold(global.config.version) +
                  ' '
              ),
              { float: 'center', borderStyle: 'round', borderColor: 'cyan' }
            )
          );
          if (!global.rootDir) return error('Directory error');
          console.log(chalk.yellow.bold('\nBuilding module'));
        } else {
          var u = test.substr(0, test.lastIndexOf('/'));
          u = u.substr(u.lastIndexOf('/') + 1, u.length).replace('_', '@');
          console.log(chalk.bold('\n- building module: ' + u));
        }
        rmdir(global.rootDir + '/dist', function () {
          fs.mkdir(
            global.rootDir + '/dist',
            {
              recursive: true,
            },
            function (e) {
              var cmd = [];
              build_i18n(function () {
                transpiler(global.config.src, 0, function () {
                  fs.writeFile(
                    global.rootDir + '/dist/index.js',
                    JS.join(';'),
                    function () {
                      if (global.config.assets) {
                        const fse = require('fs-extra');
                        const srcDir =
                          global.rootDir + '/src/' + global.config.assets + '/';
                        const destDir =
                          global.rootDir + '/dist/' + global.config.assets;

                        return fse
                          .copy(srcDir, destDir)
                          .then(function () {
                            fs.writeFile(
                              global.rootDir + '/dist/resources.css',
                              CSS.join(' '),
                              async function () {
                                if (cbz) {
                                  //
                                  var src = global.rootDir;
                                  var dest = require('path').normalize(
                                    global.rootDir +
                                      '/../../dist/' +
                                      src.substr(
                                        src.lastIndexOf('/'),
                                        src.length
                                      )
                                  );
                                  fs.copy(src, dest, function (err) {
                                    if (err) {
                                      console.error(err);
                                    } else {
                                      if (!cbz)
                                        console.log(
                                          '\n' +
                                            logSymbols.success +
                                            '  module has been built\n'
                                        );
                                      cbz();
                                    }
                                  });
                                } else if (!cbz)
                                  console.log(
                                    '\n' +
                                      logSymbols.success +
                                      '  module has been built\n'
                                  );
                              }
                            );
                          })
                          .catch((err) => console.error(err));
                      }
                      fs.writeFile(
                        global.rootDir + '/dist/resources.css',
                        CSS.join(' '),
                        async function () {
                          if (cbz) {
                            //
                            var src = global.rootDir;
                            var dest = require('path').normalize(
                              global.rootDir +
                                '/../../dist/' +
                                src.substr(src.lastIndexOf('/'), src.length)
                            );
                            fs.copy(src, dest, function (err) {
                              if (err) {
                                console.error(err);
                              } else {
                                if (!cbz)
                                  console.log(
                                    '\n' +
                                      logSymbols.success +
                                      '  module has been built\n'
                                  );
                                cbz();
                              }
                            });
                          } else if (!cbz)
                            console.log(
                              '\n' +
                                logSymbols.success +
                                '  module has been built\n'
                            );
                        }
                      );
                    }
                  );
                });
              });
            }
          );
        });
      });
    }
    if (!pkg) findUp('src/package.yaml').then(fabrik);
    else fabrik(pkg, cbz);
  }

  if (args[0] == 'clean') {
    if (!global.dir)
      return error("You're not inside an omneedia app directory");
    global.project = {
      home: global.dir,
    };
    global.project.bin = global.dir + '/bin';
    global.project.api = global.project.home + '/services';
    global.project.res = global.project.home + '/resources';
    global.project.culture = global.project.home + '/culture';
    global.project.auth = global.project.home + '/auth';
    global.project.system = global.project.home + '/system';
    global.project.io = global.project.home + '/io';
    var rmdir = require('rimraf');
    rmdir(global.project.bin + '/web_modules/dist', function (error) {
      console.log(
        chalk.bold('\n' + logSymbols.success + ' modules cleaned. \n')
      );
    });
    return;
  }

  function install_pkg() {
    if (!args[1]) return error('NO MODULE SPECIFIED');
    findUp('manifest.yaml').then(function (o) {
      if (!o) return error('You must be inside an omneedia project directory');
      fs.readFile(o, 'utf-8', function (e, r) {
        var pkg = yaml.parse(r);
        pkg.modules.push(args[1]);
        var shelljs = require('shelljs');
        var dir = path.dirname(o) + '/bin/';
        var spinner = ora('Updating application').start();
        fs.mkdir(dir, function (e, r) {
          fs.readFile(dir + 'package.json', 'utf-8', function (e, r) {
            if (e)
              return error('You must run oa install before adding module.');
            shelljs.cd(dir);
            shelljs.exec(
              'npm_config_registry=' + REGISTRY_NPM + ' npm install ' + args[1],
              { silent: true },
              function (a, b, c) {
                if (a == 0) {
                  fs.writeFile(o, yaml.stringify(pkg), function () {
                    spinner.succeed('application updated.\n');
                  });
                } else {
                  spinner.fail(
                    "CAN'T UPDATE APPLICATION. SEE LOGS FOR DETAILS"
                  );
                  console.log('------');
                  console.log(c);
                  console.log('------');
                  return;
                }
              }
            );
          });
        });
      });
    });
  }

  function uninstall_pkg() {
    if (!args[1]) return error('NO MODULE SPECIFIED');
    findUp('manifest.yaml').then(function (o) {
      if (!o) return error('You must be inside an omneedia project directory');
      fs.readFile(o, 'utf-8', function (e, r) {
        var pkg = yaml.parse(r);
        if (pkg.modules.indexOf(args[1]) == -1)
          return error('PACKAGE NOT FOUND');
        pkg.modules.remove(args[1]);
        var shelljs = require('shelljs');
        var dir = path.dirname(o) + '/bin/';
        var spinner = ora('Updating application').start();
        fs.mkdir(dir, function (e, r) {
          fs.readFile(dir + 'package.json', 'utf-8', function (e, r) {
            if (e)
              return error('You must run oa install before deleting module.');
            shelljs.cd(dir);
            shelljs.exec(
              'npm_config_registry=' +
                REGISTRY_NPM +
                ' npm uninstall ' +
                args[1],
              { silent: true },
              function (a, b, c) {
                if (a == 0) {
                  fs.writeFile(o, yaml.stringify(pkg), function () {
                    spinner.succeed('application updated.\n');
                  });
                } else {
                  spinner.fail(
                    "CAN'T UPDATE APPLICATION. SEE LOGS FOR DETAILS"
                  );
                  console.log('------');
                  console.log(c);
                  console.log('------');
                  return;
                }
              }
            );
          });
        });
      });
    });
  }

  if (args[0] == 'install') install_pkg();

  if (args[0] == 'uninstall') uninstall_pkg();

  if (args[0] == 'build') builder();
};
