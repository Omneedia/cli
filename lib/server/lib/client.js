module.exports = function (app, express) {
  var fs = require('fs');
  var sep = '/';

  // making settings
  var CDN = '/modules';
  if (!global.manifest.paths)
    global.manifest.paths = {
      cdn: CDN,
      cdnx: global.project.bin + '/node_modules/',
    };
  if (!global.manifest.paths.cdn) global.manifest.paths.cdn = CDN;

  function mktpl(texto) {
    var dot = require('dot-prop');
    var item = texto.split('{{');
    for (var i = 0; i < item.length; i++) {
      if (item[i].indexOf('}}') > -1) {
        var obj = item[i].substr(0, item[i].indexOf('}}'));
        var o = eval(obj.split('.')[0]);
        var dots = obj.substr(obj.indexOf('.') + 1, obj.length);
        item[i] =
          dot.get(o, dots) +
          item[i].substr(item[i].lastIndexOf('}}') + 2, item[i].length);
      }
    }
    return item.join('');
  }

  function display_image(req, res) {
    var sharp = require('sharp');
    var temoin = false;
    if (process.env.dir) {
      var root = process.env.dir;
    } else {
      var root = global.project.home;
    }

    fs.readFile(root + sep + 'webapp/' + req.params.img, function (err, body) {
      if (err) {
        fs.readFile(root + sep + '.template/assets.json', function (err, body) {
          var template_config = JSON.parse(mktpl(body.toString('utf-8')));

          for (var i = 0; i < template_config.length; i++) {
            if (template_config[i].dest == 'webapp/' + req.params.img) {
              var p = i;
              temoin = true;
              const readStream = fs.createReadStream(
                root + '/' + template_config[i].src
              );
              let transform = sharp();
              if (template_config[p].transform.resize) {
                var values = template_config[p].transform['resize'].split(',');
                transform = transform.resize(values[0] * 1, values[1] * 1);
              }
              res.set('Content-Type', 'image/png');
              return readStream.pipe(transform).pipe(res);
            }
          }
          if (!temoin) res.status(404).send('NOT_FOUND');
        });
      } else res.send(body);
    });
  }

  function display_index(req, res) {
    var appID = require('shortid').generate() + require('shortid').generate();

    var tpl = {};
    var reader = function (list, i, cb) {
      if (!list[i]) return cb();
      var obj = list[i];
      for (var el in obj)
        fs.readFile(obj[el], function (e, r) {
          if (r) tpl[el] = r.toString('utf-8');
          reader(list, i + 1, cb);
        });
    };
    if (!manifest.bootstrap)
      manifest.bootstrap = 'bootstrap-' + manifest.platform;
    if (process.env.dir) {
      var list = [
        {
          html: process.env.dir + sep + '.template/assets.html',
        },
        {
          style: process.env.dir + sep + '.template/assets.css',
        },
        {
          json: process.env.dir + sep + '.template/assets.json',
        },
        {
          boot:
            __dirname +
            sep +
            'tpl' +
            sep +
            'bootstrap-' +
            manifest.platform +
            '.tpl',
        },
      ];
    } else {
      var list = [
        {
          html: global.project.home + sep + '.template/assets.html',
        },
        {
          style: global.project.home + sep + '.template/assets.css',
        },
        {
          json: global.project.home + sep + '.template/assets.json',
        },
        {
          boot: global.project.home + sep + '.omneedia/bootstrap-webapp.tpl',
        },
      ];
    }

    reader(list, 0, function () {
      var _style = tpl.style;
      // template_config
      var template_config = mktpl(tpl.json);

      ///
      _style +=
        '\t.omneedia-overlay{z-index: 9999999999;position:absolute;left:0px;top:0px;width:100%;height:100%;display:none;}\n';

      //
      tpl.html =
        tpl.html.split('</head>')[0] +
        '<script src="/socketcluster-client.js"></script>' +
        '<base href="' +
        req.protocol +
        '://' +
        req.get('host') +
        '">' +
        '<link rel="icon" href="/favicon.ico" type="image/x-icon"/><link rel="shortcut" href="/favicon.ico" type="image/x-icon"/><style>' +
        _style +
        '</style>' +
        tpl.boot +
        '</head>' +
        tpl.html.split('</head>')[1];
      tpl.html = mktpl(tpl.html);
      var minify = require('html-minifier').minify;
      res.set('Content-Type', 'text/html');
      res.end(minify(tpl.html.replace(/\t/g, '').replace(/\n/g, '')));
    });
  }
  function display_new_index(req, res) {
    var appID = require('shortid').generate() + require('shortid').generate();

    var tpl = {};
    var reader = function (list, i, cb) {
      if (!list[i]) return cb();
      var obj = list[i];
      for (var el in obj)
        fs.readFile(obj[el], function (e, r) {
          if (r) tpl[el] = r.toString('utf-8');
          reader(list, i + 1, cb);
        });
    };
    if (!manifest.bootstrap)
      manifest.bootstrap = 'bootstrap-' + manifest.platform;
    if (process.env.dir) {
      var list = [
        {
          html: process.env.dir + sep + '.template/assets.html',
        },
        {
          style: process.env.dir + sep + '.template/assets.css',
        },
        {
          json: process.env.dir + sep + '.template/assets.json',
        },
        {
          boot:
            __dirname +
            sep +
            'tpl' +
            sep +
            'bootstrap-' +
            manifest.platform +
            '.tpl',
        },
      ];
    } else {
      var list = [
        {
          html: global.project.home + sep + '.template/assets.html',
        },
        {
          style: global.project.home + sep + '.template/assets.css',
        },
        {
          json: global.project.home + sep + '.template/assets.json',
        },
        {
          boot: global.project.home + sep + '.omneedia/bootstrap-webapp.tpl',
        },
      ];
    }

    reader(list, 0, function () {
      var _style = tpl.style;
      // template_config
      var template_config = mktpl(tpl.json);

      ///
      _style +=
        '\t.omneedia-overlay{z-index: 9999999999;position:absolute;left:0px;top:0px;width:100%;height:100%;display:none;}\n';

      //
      tpl.html =
        tpl.html.split('</head>')[0] +
        '<script src="/socketcluster-client.js"></script>' +
        '<base href="' +
        req.protocol +
        '://' +
        req.get('host') +
        '">' +
        '<link rel="icon" href="/favicon.ico" type="image/x-icon"/><link rel="shortcut" href="/favicon.ico" type="image/x-icon"/><style>' +
        _style +
        '</style>' +
        tpl.boot +
        '</head>' +
        tpl.html.split('</head>')[1];
      tpl.html = mktpl(tpl.html);
      var minify = require('html-minifier').minify;
      res.set('Content-Type', 'text/html');
      res.end(minify(tpl.html.replace(/\t/g, '').replace(/\n/g, '')));
    });
  }

  if (process.argv.indexOf('--prod') == -1) {
    if (global.manifest.engine == 'typescript') {
      app.get('/index.html', display_index);
      app.get('/index.htm', display_index);
      app.get('/default', display_index);
    } else {
      app.get('/', display_index);
      app.get('/index.html', display_index);
      app.get('/index.htm', display_index);
      app.get('/default', display_index);
    }
  } else {
    app.use(express.static(global.project.bin + '/www'));
  }

  app.get('/modules/(*)', function (req, res) {
    var url = req.url.split('/modules/')[1];
    if (url.indexOf('.woff2') > -1) res.setHeader('content-type', 'font/woff2');
    if (url.indexOf('.woff') > -1) res.setHeader('content-type', 'font/woff');
    if (url.indexOf('.js') > -1)
      res.setHeader('content-type', 'text/javascript');
    if (url.indexOf('.css') > -1) res.setHeader('content-type', 'text/css');
    if (url.indexOf('.png') > -1) res.setHeader('content-type', 'image/png');
    if (url.indexOf('.jpg') > -1) res.setHeader('content-type', 'image/jpeg');
    var readStream = fs.createReadStream(
      global.project.bin + '/node_modules/' + url.split('?')[0]
    );
    readStream.pipe(res);
  });

  app.use(
    '/modules/src',
    express.static(global.project.bin + '/web_modules/src')
  );

  app.use('/assets', express.static(global.dir + '/assets'));
  app.use('/resources', express.static(global.project.res));
  app.get('/resources/webapp/:img', display_image);

  app.get('/socketcluster-client.js', function (req, res) {
    try {
      res.set('Content-Type', 'text/javascript');
    } catch (e) {}
    require('fs').readFile(
      __dirname + '/client/socketcluster-client.js',
      'utf-8',
      function (e, r) {
        res.end(r);
      }
    );
  });

  // i18n (internationalization)
  app.use(function (req, res, next) {
    if (req.originalUrl.indexOf('.yaml') > -1) {
      if (req.originalUrl.indexOf('/modules/') > -1) {
        var module =
          global.dir + '/web_modules/' + req.originalUrl.split('/modules/')[1];
        module = module.replace('/res/', '/');
        fs.readFile(module, 'utf-8', function (e, r) {
          if (e) return res.status(404).end('NOT_FOUND');
          res.end(r);
        });
        return;
      }
    }
    next();
  });
  app.get('/i18n', function (req, res) {
    try {
      res.set('Content-Type', 'text/javascript');
    } catch (e) {}
    res.send(req.headers['accept-language'].split(';')[0]);
  });
  app.get('/env.js', function (req, res) {
    res.type('application/javascript');
    if (!global.settings) return res.end('// no settings');
    if (!global.settings.environment) return res.end('// no environment');
    if (!global.settings.environment.client)
      return res.end('// no environment');
    var ENV = JSON.stringify(global.settings.environment.client);
    var script =
      `if (!window.ENV) window.ENV={};window.ENV=Object.assign(window.ENV,` +
      ENV +
      `)`;
    res.end(script);
  });
  if (process.argv.indexOf('--prod') == -1) {
    app.get('/resources/i18n.css', function (req, res) {
      var yaml = require('yaml');
      var fs = require('fs');
      res.set('Content-Type', 'text/css');
      var langs = global.manifest.langs;
      var CSS = [];
      var LANG = [];

      function update_langs(langs, ndx, cb) {
        if (!langs[ndx]) return cb();
        var lang = langs[ndx];
        fs.readFile(global.project.culture + '/' + lang + '.yaml', function (
          e,
          r
        ) {
          if (e) return update_langs(langs, ndx + 1, cb);
          var l = yaml.parse(r.toString('utf-8'));
          //:lang(es).msg-title:before { content: '¡Hola Mundo!' }
          for (var el in l) {
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

      function update_module_langs(dir, langs, ndx, cb) {
        if (!langs[ndx]) return cb();
        var lang = langs[ndx];
        fs.readFile(dir + '/' + lang, function (e, r) {
          if (e) return update_module_langs(dir, langs, ndx + 1, cb);
          var l = yaml.parse(r.toString('utf-8'));
          //:lang(es).msg-title:before { content: '¡Hola Mundo!' }
          for (var el in l) {
            if (l[el])
              CSS.push(
                ':lang(' +
                  lang.split('.')[0] +
                  ').' +
                  el +
                  ":before { content: '" +
                  l[el].replace(/'/g, "\\'") +
                  "' }"
              );
          }
          update_module_langs(dir, langs, ndx + 1, cb);
        });
      }

      function global_langs(loaders, ndx, cb) {
        if (!loaders[ndx]) return cb(LANG);
        var url = loaders[ndx];
        var request = require('request');
        if (url.indexOf('://') == -1)
          url = req.protocol + '://' + req.get('host') + url;
        request(url, function (e, r, b) {
          if (e) return global_langs(loaders, ndx + 1, cb);
          if (r.statusCode == 404) return global_langs(loaders, ndx + 1, cb);
          var list = b.split('\n');
          for (var j = 0; j < list.length; j++) {
            if (list[j].indexOf('<span class="errorcode">') > -1)
              return global_langs(loaders, ndx + 1, cb);
            var lang = url
              .substr(url.lastIndexOf('/') + 1, url.length)
              .split('.yaml')[0];
            //:lang(es).msg-title:before { content: '¡Hola Mundo!' }
            var item = list[j];
            if (list[j].split(':')[0])
              LANG.push(
                ':lang(' +
                  lang +
                  ').' +
                  list[j].split(':')[0] +
                  ":before { content: '" +
                  list[j].split(':')[1].trim().replace(/'/g, "\\'") +
                  "' }"
              );
          }
          return global_langs(loaders, ndx + 1, cb);
        });
      }

      function update_modules(m, ndx, cb) {
        if (!m[ndx]) return cb();
        var module = m[ndx];
        if (typeof module == 'string') return update_modules(m, ndx + 1, cb);
        else {
          if (!module.i18n) return update_modules(m, ndx + 1, cb);
          var dir = module.i18n.replace('{version}', module.version);
          dir =
            global.project.home +
            '/../bin/web_modules/src/' +
            module.module +
            '_' +
            module.version +
            '/src/' +
            dir;
          fs.readdir(dir, function (e, d) {
            if (e) return update_modules(m, ndx + 1, cb);
            update_module_langs(dir, d, 0, function () {
              update_modules(m, ndx + 1, cb);
            });
          });
        }
      }

      update_langs(langs, 0, function () {
        update_modules(global.manifest.modules, 0, function () {
          res.end(CSS.join(' '));
        });
      });
    });

    app.get('/favicon.ico', function (req, res) {
      var sharp = require('sharp');
      if (process.env.dir) {
        var root = process.env.dir;
      } else {
        var root = global.project.home;
      }
      res.set('Content-Type', 'image/x-icon');
      const readStream = fs.createReadStream(
        root + sep + global.manifest.icon.file
      );
      let transform = sharp();
      transform = transform.resize(16, 16);
      return readStream.pipe(transform).pipe(res);
    });

    app.get('/registry.json', function (req, res) {
      res.end('{}');
    });

    //    app.get('/app', express.static(global.project.home));

    app.get('/Settings.js', function (req, res) {
      function lookup_modules(modules, i, cb) {
        if (!modules[i]) return cb();
        var item = modules[i];
        if (typeof item == 'string') {
          if (item.split(':')[0].indexOf('.') > -1) {
            Settings.PATHS['Ext'] =
              global.manifest.paths.cdn + '/omneedia/modules/Ext';
            Settings.PATHS['Ext.ux'] =
              global.manifest.paths.cdn + '/omneedia/modules/Ext/ux';
            Settings.PATHS['Ext.plugin'] =
              global.manifest.paths.cdn + '/omneedia/modules/Ext/plugin';
            Settings.PATHS['Ext.util'] =
              global.manifest.paths.cdn + '/omneedia/modules/Ext/util';
            if (!Settings.ux) Settings.ux = [];
            Settings.ux.push(item);
            lookup_modules(modules, i + 1, cb);
          } else {
            if (item.indexOf(':') == -1) var version = 'latest';
            else var version = item.split(':')[1];
            if (item.indexOf('://') == -1)
              var url =
                global.manifest.paths.cdnx +
                item.split(':')[0] +
                '/dist/index.js';
            else var url = item;
            fs.stat(url, function (e, s) {
              if (s) {
                Settings.MODULES.push(
                  global.manifest.paths.cdn +
                    '/' +
                    item.split(':')[0] +
                    '/dist/index.js'
                );
                Settings.MODULES.push(
                  global.manifest.paths.cdn +
                    '/' +
                    item.split(':')[0] +
                    '/dist/resources.css'
                );
                lookup_modules(modules, i + 1, cb);
              } else {
                var url =
                  global.manifest.paths.cdnx +
                  item.split(':')[0] +
                  '/package.json';
                fs.readFile(url, 'utf-8', function (e, r) {
                  if (e) {
                    console.log(
                      '! package ' + item.split(':')[0] + ' not found.'
                    );
                    return lookup_modules(modules, i + 1, cb);
                  }
                  var o = JSON.parse(r);
                  if (o.browser) {
                    Settings.MODULES.push(
                      global.manifest.paths.cdn +
                        '/' +
                        item.split(':')[0] +
                        '/' +
                        o.browser
                    );
                    return lookup_modules(modules, i + 1, cb);
                  }
                  if (o.main) {
                    Settings.MODULES.push(
                      global.manifest.paths.cdn +
                        '/' +
                        item.split(':')[0] +
                        '/' +
                        o.main
                    );
                    return lookup_modules(modules, i + 1, cb);
                  } else {
                    console.log(
                      '! package ' + item.split(':')[0] + ' not found.'
                    );
                    return lookup_modules(modules, i + 1, cb);
                  }
                });
              }
            });
          }
        } else {
          var params = [];
          for (var el in item) {
            if (el != 'src') params.push(el);
          }
          for (var k = 0; k < item.src.length; k++) {
            var url = item.src[k];
            for (var j = 0; j < params.length; j++) {
              var replace = '{' + params[j] + '}';
              var re = new RegExp(replace, 'g');
              url = url.replace(re, item[params[j]]);
            }
            if (url.indexOf('://') == -1)
              var url =
                global.manifest.paths.cdn +
                '/src/' +
                item.module +
                '_' +
                item.version +
                '/src/' +
                url;
            Settings.MODULES.push(url);
          }
          lookup_modules(modules, i + 1, cb);
        }
      }
      var Settings = {};
      Settings.DEBUG = true;
      Settings.NAMESPACE = global.manifest.namespace;
      Settings.TITLE = global.manifest.title;
      Settings.DESCRIPTION = global.manifest.description;
      Settings.COPYRIGHT = global.manifest.copyright;
      Settings.TYPE = global.manifest.type;
      Settings.PLATFORM = global.manifest.platform;
      Settings.TYPE = global.manifest.platform;
      Settings.LANGS = global.manifest.langs;
      Settings.PATHS = global.manifest.paths;
      Settings.AUTH = {
        passports: [],
        passport: {},
      };
      var paths = {};
      for (var el in global.manifest.paths) {
        paths[el] = global.manifest.paths[el];
      }
      var modules = global.manifest.modules;
      Settings.MODULES = [];

      lookup_modules(modules, 0, function () {
        Settings.CONTROLLERS = [];
        if (global.manifest.controllers)
          for (var i = 0; i < global.manifest.controllers.length; i++)
            Settings.CONTROLLERS.push(global.manifest.controllers[i]);
        Settings.LIBRARIES = [];
        if (global.manifest.libraries)
          for (var i = 0; i < global.manifest.libraries.length; i++)
            Settings.LIBRARIES.push(global.manifest.libraries[i]);
        Settings.AUTHORS = [];
        Settings.API = [];
        Settings.DB = {};
        Settings.API.push('__QUERY__');
        fs.readdir(global.project.fn, function (e, r) {
          if (r) {
            for (var i = 0; i < r.length; i++) {
              var js = r[i].substr(0, r[i].lastIndexOf('.js'));
              if (js != '') Settings.API.push(js);
            }
          }
          Settings.AUTHORS.push({
            role: 'owner',
            name: global.manifest.author.name,
            mail: global.manifest.author.mail,
            twitter: global.manifest.author.twitter,
            web: global.manifest.author.web,
            github: global.manifest.author.github,
          });
          for (var el in global.manifest.team) {
            var tabx = global.manifest.team[el];
            var role = el;
            if (tabx) {
              for (var i = 0; i < tabx.length; i++) {
                Settings.AUTHORS.push({
                  role: role,
                  name: tabx[i].name,
                  mail: tabx[i].mail,
                  twitter: tabx[i].twitter,
                  web: tabx[i].web,
                  github: tabx[i].github,
                });
              }
            }
          }
          Settings.VERSION = global.manifest.version;
          Settings.BUILD = global.manifest.build;

          if (global.manifest.blur) Settings.blur = global.manifest.blur;
          else Settings.blur = 1;

          // Auth
          function do_auth(cb) {
            function do_i18n(d, ndx, txt, cb) {
              var yaml = require('yaml');
              if (!d[ndx]) return cb();
              fs.readFile(
                global.project.culture + '/' + d[ndx],
                'utf-8',
                function (e, r) {
                  if (e) return do_i18n(d, ndx + 1, txt, cb);
                  try {
                    var l = yaml.parse(r);
                  } catch (e) {
                    if (e) return do_i18n(d, ndx + 1, txt, cb);
                  }
                  if (!l[txt]) l[txt] = txt;
                  else return do_i18n(d, ndx + 1, txt, cb);
                  fs.writeFile(
                    global.project.culture + '/' + d[ndx],
                    yaml.stringify(l),
                    function (e) {
                      return do_i18n(d, ndx + 1, txt, cb);
                    }
                  );
                }
              );
            }
            function me_auth(auth, i, cb) {
              if (!auth) return cb();
              if (!auth[i]) return cb();
              if (process.env.dir) var root = __dirname + sep + 'tpl';
              else var root = global.project.home + sep + '.omneedia';
              var t0 = root + sep + 'auth' + sep + auth[i] + '.json';
              fs.readFile(t0, function (e, r) {
                if (e) return res.status(404).end('AUTH template not found');
                try {
                  var t0 = JSON.parse(r.toString('utf-8'));
                } catch (e) {
                  return res.status(404).end('AUTH template not readable');
                }
                Settings.AUTH.passports.push(t0.type);
                Settings.AUTH.passport[t0.type] = {
                  caption: 'PASSPORT_' + global.manifest.auth[i].toUpperCase(),
                };
                var dir = fs.readdir(global.project.culture, function (e, dir) {
                  do_i18n(
                    dir,
                    0,
                    'PASSPORT_' + global.manifest.auth[i].toUpperCase(),
                    function () {
                      me_auth(auth, i + 1, cb);
                    }
                  );
                });
              });
            }
            me_auth(global.manifest.auth, 0, cb);
          }
          // resources
          function getRES(cb) {
            fs.readdir(global.project.res, function (e, r) {
              var css = [];
              for (var i = 0; i < r.length; i++) {
                if (r[i].indexOf('.css') > -1) css.push('resources/' + r[i]);
              }
              css.push('resources/i18n.css');
              cb(css);
            });
          }

          do_auth(function () {
            getRES(function (css) {
              Settings.MODULES = Settings.MODULES.concat(css);
              try {
                res.set('Content-Type', 'text/javascript');
              } catch (e) {}
              res.end('Settings=' + JSON.stringify(Settings, null, 4));
            });
          });
        });
      });
    });
  }
};
