global.authKey = '0mneediaRulez!';

const http = require('http');
const eetase = require('eetase');
const socketClusterServer = require('socketcluster-server');
const express = require('express');
const serveStatic = require('serve-static');
const path = require('path');
const uuid = require('uuid');
const fs = require('fs');
var spawn = require('child_process').spawn;
var compression = require('compression');
var ora = require('ora');
var chalk = require('chalk');
var Queue = require('bull');
global.JOBS = {};

const sccBrokerClient = require('scc-broker-client');
var cookieParser = require('cookie-parser');
global.request = require('request');
var logSymbols = require('log-symbols');
var shelljs = require('shelljs');
const winston = require('winston');
const debugFormat = require('winston-format-debug').DebugFormat;

global.log = winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        new debugFormat({
          levels: winston.config.syslog.levels,
          colors: winston.config.syslog.colors,
        })
      ),
    }),
  ],
});

if (process.env.ENV != 'prod')
  console.log = function (txt) {
    return global.log.info(txt);
  };

if (process.env.ENV == 'prod') process.argv.push('--prod');

if (process.env.dir) {
  global.dir = process.env.dir;
  global.config = JSON.parse(process.env.config);

  global.project = {
    home: path.normalize(global.dir + '/src'),
  };
  var manifest = global.dir + '/manifest.yaml';
} else {
  global.dir = process.cwd();
  global.project = {
    home: path.normalize(global.dir),
  };
  var manifest = global.project.home + '/manifest.yaml';
}

global.project.bin = global.dir + '/bin';
global.project.api = global.project.home + '/api';
global.project.fn = global.project.home + '/services';
global.project.res = global.project.home + '/resources';
global.project.culture = global.project.home + '/culture';
global.project.auth = global.project.home + '/auth';
global.project.system = global.project.home + '/system';
global.project.jobs = global.project.home + '/jobs';
global.project.reports = global.project.home + '/reports';
global.project.io = global.project.home + '/io';
global.project.dist = global.dir + '/dist';
global.project.config = global.dir + '/config';

Date.prototype.getWeek = function () {
  var date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  );
};

Date.prototype.toMySQL = function () {
  function twoDigits(d) {
    if (0 <= d && d < 10) return '0' + d.toString();
    if (-10 < d && d < 0) return '-0' + (-1 * d).toString();
    return d.toString();
  }
  return (
    this.getFullYear() +
    '-' +
    twoDigits(1 + this.getMonth()) +
    '-' +
    twoDigits(this.getDate()) +
    ' ' +
    twoDigits(this.getHours()) +
    ':' +
    twoDigits(this.getMinutes()) +
    ':' +
    twoDigits(this.getSeconds())
  );
};

if (!('toJSON' in Error.prototype))
  Object.defineProperty(Error.prototype, 'toJSON', {
    value: function () {
      var alt = {};
      Object.getOwnPropertyNames(this).forEach(function (key) {
        alt[key] = this[key];
      }, this);
      return alt;
    },
    configurable: true,
    writable: true,
  });

fs.readFile(manifest, 'utf-8', function (e, r) {
  manifest = require('yaml').parse(r);
  global.manifest = manifest;

  var _settings = global.dir + '/config/settings.json';
  if (process.argv.indexOf('--prod') > -1) _settings = '/run/secrets/config';

  fs.readFile(_settings, 'utf-8', function (e, r) {
    if (r) global.settings = JSON.parse(r);
    else
      global.settings = {
        auth: [],
        db: [],
        jobs: [],
        environment: {
          client: {},
          server: {},
        },
      };
    if (process.env.PROXY) {
      var request = require('request');
      global.request = request.defaults({
        proxy: process.env.PROXY,
      });
    }
    if (global.settings.environment) {
      if (global.settings.environment.server)
        process.env = Object.assign(
          process.env,
          global.settings.environment.server
        );
    }

    if (process.argv.indexOf('--job') > -1) return;
    const ENVIRONMENT = process.env.ENV || 'dev';
    const SOCKETCLUSTER_PORT = process.env.SOCKETCLUSTER_PORT || 8000;
    const SOCKETCLUSTER_WS_ENGINE = process.env.SOCKETCLUSTER_WS_ENGINE || 'ws';
    const SOCKETCLUSTER_SOCKET_CHANNEL_LIMIT =
      Number(process.env.SOCKETCLUSTER_SOCKET_CHANNEL_LIMIT) || 1000;
    const SOCKETCLUSTER_LOG_LEVEL = process.env.SOCKETCLUSTER_LOG_LEVEL || 2;

    const SCC_INSTANCE_ID = uuid.v4();
    const SCC_STATE_SERVER_HOST = process.env.SCC_STATE_SERVER_HOST || null;
    const SCC_STATE_SERVER_PORT = process.env.SCC_STATE_SERVER_PORT || null;
    const SCC_MAPPING_ENGINE = process.env.SCC_MAPPING_ENGINE || null;
    const SCC_CLIENT_POOL_SIZE = process.env.SCC_CLIENT_POOL_SIZE || null;
    const SCC_AUTH_KEY = process.env.SCC_AUTH_KEY || global.authKey;
    const SCC_INSTANCE_IP = process.env.SCC_INSTANCE_IP || null;
    const SCC_INSTANCE_IP_FAMILY = process.env.SCC_INSTANCE_IP_FAMILY || null;
    const SCC_STATE_SERVER_CONNECT_TIMEOUT =
      Number(process.env.SCC_STATE_SERVER_CONNECT_TIMEOUT) || null;
    const SCC_STATE_SERVER_ACK_TIMEOUT =
      Number(process.env.SCC_STATE_SERVER_ACK_TIMEOUT) || null;
    const SCC_STATE_SERVER_RECONNECT_RANDOMNESS =
      Number(process.env.SCC_STATE_SERVER_RECONNECT_RANDOMNESS) || null;
    const SCC_PUB_SUB_BATCH_DURATION =
      Number(process.env.SCC_PUB_SUB_BATCH_DURATION) || null;
    const SCC_BROKER_RETRY_DELAY =
      Number(process.env.SCC_BROKER_RETRY_DELAY) || null;

    let agOptions = {};

    if (process.env.SOCKETCLUSTER_OPTIONS) {
      let envOptions = JSON.parse(process.env.SOCKETCLUSTER_OPTIONS);
      Object.assign(agOptions, envOptions);
    }

    let httpServer = eetase(http.createServer());

    agOptions = {
      authKey: global.authKey,
    };

    let agServer = socketClusterServer.attach(httpServer, agOptions);

    if (SOCKETCLUSTER_LOG_LEVEL >= 2) {
      if (process.argv.indexOf('--reload') > -1)
        console.info(
          `\n  ${colorText('[Reload]', 32)} omneedia app-engine with PID ${
            process.pid
          } is listening on port ${SOCKETCLUSTER_PORT}\n`
        );
      else
        console.info(
          `\n  ${colorText('[Active]', 32)} omneedia app-engine with PID ${
            process.pid
          } is listening on port ${SOCKETCLUSTER_PORT}\n`
        );

      (async () => {
        for await (let { warning } of agServer.listener('warning')) {
          console.log('WARNING:');
          console.warn(warning);
        }
      })();
    }

    let app = express();

    app.use(function (req, res, next) {
      if (req.originalUrl.indexOf('/_') > -1) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header(
          'Access-Control-Allow-Headers',
          'Origin, X-Requested-With, Content-Type, Accept'
        );
      }
      next();
    });

    app.use(compression());

    app.use(function (req, res, next) {
      res.removeHeader('x-powered-by');
      next();
    });

    if (process.argv.indexOf('--verbose') > -1)
      app.use(function (req, res, next) {
        global.log.info(
          req.protocol.toUpperCase() +
            ' ' +
            req.method +
            ' - ' +
            req.originalUrl
        );
        next();
      });

    var bodyParser = require('body-parser');

    app.use(cookieParser());

    // parse application/x-www-form-urlencoded
    app.use(
      bodyParser.urlencoded({
        extended: false,
      })
    );

    // parse application/json
    app.use(bodyParser.json());

    app.set('trust proxy', 1); // trust first proxy

    var session = require('express-session');

    if (process.env.ENV == 'prod') {
      if (process.env.SESSION) {
        //console.log("using: " + process.env.SESSION);
        if (process.env.SESSION.indexOf('redis://') > -1) {
          var redis = require('redis');
          var client = redis.createClient({
            url: process.env.SESSION,
          });
          var RedisStore = require('connect-redis')(session);
          app.use(
            session({
              secret: '0mneediaRulez!',
              saveUninitialized: true,
              resave: false,
              store: new RedisStore({ client }),
            })
          );
        }
      } else {
        var FileStore = require('session-file-store')(session);
        app.use(
          session({
            store: new FileStore({ logFn: function () {} }),
            secret: '0mneediaRulez!',
            resave: false,
            saveUninitialized: true,
          })
        );
      }
    } else {
      var FileStore = require('session-file-store')(session);
      if (process.env.session_dir) var mySessionPath = process.env.session_dir;
      else var mySessionPath = global.dir;
      app.use(
        session({
          store: new FileStore({ path: mySessionPath, logFn: function () {} }),
          secret: '0mneediaRulez!',
          resave: false,
          saveUninitialized: true,
        })
      );
    }

    if (process.argv.indexOf('--prod') == -1) {
      if (global.manifest.engine != 'typescript') {
        app.use(express.static(global.project.home + '/app'));
      }
    }

    // Add GET /health-check express route
    app.get('/health-check', (req, res) => {
      res.status(200).send('OK');
    });

    // HTTP request handling loop.
    (async () => {
      for await (let requestData of httpServer.listener('request')) {
        app.apply(null, requestData);
      }
    })();

    // SocketCluster/WebSocket connection handling loop.
    (async () => {
      for await (let { socket } of agServer.listener('connection')) {
        global.log.info('connected client id#' + socket.id);
        require('./lib/io.js')(socket, app, express, agServer, ENVIRONMENT);
      }
    })();

    global.POOL = require('./lib/dbpool')(app, express, agServer);

    require('./lib/client')(app, express);
    require('./lib/fn')(app, express, agServer, POOL);
    require('./lib/system')(app, express, agServer, POOL);
    require('./lib/auth')(app, express, agServer, POOL);
    if (process.env.ENV != 'prod') {
      require('./lib/_')(app, express, agServer, POOL);
      if (process.argv.indexOf('--ide') > -1)
        require('../../node_modules/@omneedia/ide/ide')(
          app,
          express,
          agServer,
          POOL
        );
    }

    // watcher client side
    if (process.argv.indexOf('--prod') == -1) {
      if (process.argv.indexOf('--ide') == -1) {
        var chokidar = require('chokidar');
        var shelljs = require('shelljs');
        //app
        var watcher = chokidar.watch(global.project.home + '/', {
          ignored: /^\./,
          persistent: true,
          ignoreInitial: true,
        });

        watcher
          .on('add', function (path) {
            if (path.indexOf('.DS_Store') > -1) return;
            if (path.indexOf('/bin/www') > -1) return;
            if (path.indexOf('/node_modules/') > -1) return;
            console.log('add file:' + path.split(global.dir)[1]);
            builder((err, stats) => {
              console.log('x');
              agServer.exchange.transmitPublish('dev', 'reload');
            });
          })
          .on('change', function (path) {
            if (path.indexOf('.DS_Store') > -1) return;
            if (path.indexOf('/bin/www') > -1) return;
            if (path.indexOf('/node_modules/') > -1) return;
            console.log('change file:' + path.split(global.dir)[1]);
            builder((err, stats) => {
              console.log('x');
              agServer.exchange.transmitPublish('dev', 'reload');
            });
          })
          .on('unlink', function (path) {
            if (path.indexOf('.DS_Store') > -1) return;
            if (path.indexOf('/bin/www') > -1) return;
            if (path.indexOf('/node_modules/') > -1) return;
            console.log('unlink file: ' + path.split(global.dir)[1]);
            builder((err, stats) => {
              console.log('x');
              agServer.exchange.transmitPublish('dev', 'reload');
            });
          })
          .on('error', function (error) {
            console.log(chalk.red.bold('error: ') + error);
          });
      }
    }

    function builder(cb) {
      if (global.manifest.engine == 'typescript') {
        var shelljs = require('shelljs');
        shelljs.cd(global.project.home + '/app');
        const { fork } = require('child_process');
        const wc = fork(__dirname + '/../../node_modules/.bin/ng', ['build']);
        wc.on('exit', function () {
          save_index_html(function () {
            fs.unlink(global.project.bin + '/www/favicon.ico', function () {
              return cb();
            });
          });
        });
      } else return cb();
    }

    function save_index_html(cb) {
      var sep = '/';
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
              'lib/tpl' +
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
          '<link rel="icon" href="/favicon.ico" type="image/x-icon"/><link rel="shortcut" href="/favicon.ico" type="image/x-icon"/><style>' +
          _style +
          '</style>' +
          tpl.boot +
          '</head>' +
          tpl.html.split('</head>')[1];
        tpl.html = mktpl(tpl.html);
        var minify = require('html-minifier').minify;
        fs.mkdir(global.project.bin + '/www', function () {
          fs.writeFile(
            global.project.bin + '/www/index.html',
            minify(tpl.html.replace(/\t/g, '').replace(/\n/g, '')),
            cb
          );
        });
      });
    }

    if (process.env.ENV != 'prod') {
      if (process.argv.indexOf('--reload') == -1) {
        var opn = require('open');
        var browser = {};
        function open_browser() {
          if (global.config) {
            if (global.config.browser) {
              var b = global.config.browser.default;
              // a écrire et a tester pour windows et linux... Les racourcis ne sont pas les mêmes.
              if (require('os').platform() == 'win32') {
                if (b == 'google') browser.app = 'chrome';
                if (b == 'chrome') browser.app = 'chrome';
                if (b == 'safari') browser.app = 'safari';
                if (b == 'opera') browser.app = 'opera';
                if (b == 'firefox') browser.app = 'firefox';
              } else {
                if (b == 'canary') browser.app = 'google chrome canary';
                if (b == 'google') browser.app = 'google chrome';
                if (b == 'chrome') browser.app = 'google chrome';
                if (b == 'safari') browser.app = 'safari';
                if (b == 'opera') browser.app = 'opera';
                if (b == 'firefoxdev')
                  browser.app = 'firefox developer edition';
              }
            }
          }

          if (process.argv.indexOf('--reload') == -1) {
            if (process.argv.indexOf('--ide') > -1) {
              opn('http://localhost:' + SOCKETCLUSTER_PORT + '/ide', {
                app: browser.app,
              });
            } else {
              opn('http://localhost:' + SOCKETCLUSTER_PORT + '/index.html', {
                app: browser.app,
              });
            }
          }
        }

        if (global.manifest.engine == 'typescript') {
          fs.mkdir(global.project.bin + '/www', function () {
            builder((err, stats) => {
              open_browser();
            });
          });
        } else open_browser();
      }
    }

    require('./jobs_client.js')();
    if (global.manifest.engine) {
      app.all('/*', function (req, res, next) {
        res.sendFile('index.html', { root: global.project.bin + '/www' });
      });
    }
    if (process.env.ENV != 'prod') {
      const { errorReporter } = require('express-youch');
      app.use(
        errorReporter({
          links: [
            ({ message }) => {
              const url = `https://stackoverflow.com/search?q=${encodeURIComponent(
                `[node.js] ${message}`
              )}`;
              return `<a href="${url}" target="_blank" title="Search on stackoverflow">Search stackoverflow</a>`;
            },
          ],
        })
      );
    }
    require('./lib/errors.js')(app, express);

    httpServer.listen(SOCKETCLUSTER_PORT);

    if (SOCKETCLUSTER_LOG_LEVEL >= 1) {
      (async () => {
        for await (let { error } of agServer.listener('error')) {
          console.log('ERROR:');
          console.error(error);
        }
      })();
    }

    function colorText(message, color) {
      if (color) {
        return `\x1b[${color}m${message}\x1b[0m`;
      }
      return message;
    }

    if (SCC_STATE_SERVER_HOST) {
      // Setup broker client to connect to SCC.
      let sccClient = sccBrokerClient.attach(agServer.brokerEngine, {
        instanceId: SCC_INSTANCE_ID,
        instancePort: SOCKETCLUSTER_PORT,
        instanceIp: SCC_INSTANCE_IP,
        instanceIpFamily: SCC_INSTANCE_IP_FAMILY,
        pubSubBatchDuration: SCC_PUB_SUB_BATCH_DURATION,
        stateServerHost: SCC_STATE_SERVER_HOST,
        stateServerPort: SCC_STATE_SERVER_PORT,
        mappingEngine: SCC_MAPPING_ENGINE,
        clientPoolSize: SCC_CLIENT_POOL_SIZE,
        authKey: SCC_AUTH_KEY,
        stateServerConnectTimeout: SCC_STATE_SERVER_CONNECT_TIMEOUT,
        stateServerAckTimeout: SCC_STATE_SERVER_ACK_TIMEOUT,
        stateServerReconnectRandomness: SCC_STATE_SERVER_RECONNECT_RANDOMNESS,
        brokerRetryDelay: SCC_BROKER_RETRY_DELAY,
      });

      if (SOCKETCLUSTER_LOG_LEVEL >= 1) {
        (async () => {
          /*for await (let { error } of sccClient.listener("error")) {
            error.name = "SCCError";
            console.error(error);
          }*/
        })();
      }
    }
  });
});
