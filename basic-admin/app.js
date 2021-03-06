/*Copyright (c) Shelloid Systems LLP. All rights reserved.
 The use and distribution terms for this software are covered by the
 GNU Affero General Public License 3.0 (http://www.gnu.org/licenses/agpl-3.0.html)
 which can be found in the file LICENSE at the root of this distribution.
 By using this software in any fashion, you are agreeing to be bound by
 the terms of this license.
 You must not remove this notice, or any other, from this software.
 */
process.env.NODE_ENV = "development";

var shuttingDown = false;

global.config = {
    PUBLIC_HTML: "public",
    SESSION_EXPIRY: 30 * 60,
    NOTIFY_TIMEOUT: 10,
    GENERAL_ACTION_RETRY_TIMES: 3
};

var express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    http = require("http"),
    fs = require("fs"),
    mysql = require('mysql'),
    genericPool = require('generic-pool'),
    passport = require('passport'),
    redis = require("redis"),
    winston = require('winston'),
    ejs = require('ejs'),
    RedisStore = require('connect-redis')(express);

process.on('uncaughtException', function (err) {
    var stack = err.stack;
    console.log("uncaughtException: " + stack);
});

global.logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ level: 'debug', timestamp: true })
    ]
});

global.getNewSalt = function () {
    var range = {min: 1000, max: 9999};
    return Math.round((Math.random() * (range.max - range.min)) + range.min);
}

global.redirect = function (res, url) {
    res.writeHead(302, {
        'Location': url
    });
    res.end();
};

global.getNormalDate = function (timestamp) {
    return timestamp.getTime() - 19800000;
};

function readSettingsFile() {
    var settingsFile = JSON.parse(fs.readFileSync("./config.json"));
    global.config = extend({}, global.config, settingsFile);
}

function extend(target) {
    var sources = [].slice.call(arguments, 1);
    sources.forEach(function (source) {
        for (var prop in source) {
            if (source.hasOwnProperty(prop)) {
                target[prop] = source[prop];
            }
        }
    });
    return target;
}

readSettingsFile();

global.dbPool = genericPool.Pool({
    name: 'mysql',
    create: function (callback) {
        var c = mysql.createConnection(
            {
                host: global.config.db.DB_HOST,
                user: global.config.db.DB_USER,
                password: global.config.db.DB_PASSWORD,
                database: global.config.db.DB_NAME,
                timezone: "+0000"
            });
        c.connect();
        callback(null, c);
    },
    destroy: function (client) {
        client.end();
    },
    max: global.config.db.MAX_DB_CONNECTIONS,
    min: 2,
    idleTimeoutMillis: 30000,
    log: false
});

global.easydb = require('./lib/easydb');
global.notify = require('./lib/notify');
global.utils = require('./lib/utils');

global.subscribeRedisClient = redis.createClient(global.config.redis.REDIS_PORT, global.config.redis.REDIS_HOST);
global.subscribeRedisClient.auth(global.config.redis.REDIS_PASSWORD);

redisPool = genericPool.Pool({
    name: 'redis',
    create: function (callback) {
        var client = redis.createClient(global.config.redis.REDIS_PORT, global.config.redis.REDIS_HOST);
        client.auth(global.config.redis.REDIS_PASSWORD);
        client.on("error", function (err) {
            console.log("Redis error event - " + client.host + ":" + client.port + " - " + err + " (From Pool)");
            console.log(err.stack)
        });
        callback(null, client);
    },
    destroy: function (client) {
        client.quit();
    },
    max: global.config.redis.MAX_REDIS_CONNECTIONS,
    min: 2,
    idleTimeoutMillis: 30000,
    log: false
});

global.acquireRedis = function (callback) {
    redisPool.acquire(function (err, redis) {
        callback(err, redis);
    });
};

global.releaseRedis = function (redis) {
    redisPool.release(redis);
};

var pages = require('./routes/app/pages'),
    getSalt = require('./routes/user/getSalt'),
    isSessionActive = require('./routes/user/isSessionActive'),
    signin = require('./routes/user/signin'),
    signout = require('./routes/user/signout'),
    deleteUser = require('./routes/user/deleteUser'),
    signup = require('./routes/user/signup'),
    listUsers = require('./routes/user/listUsers'),
    addUser = require('./routes/user/addUser'),
    getUserInfo = require('./routes/user/getUserInfo'),
    updateUserData = require('./routes/user/updateUserData'),
    getRegDetails = require('./routes/user/getRegDetails'),
    changePassword = require('./routes/user/changePassword');


var app = express();

app.configure('development', function () {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function () {
    app.use(express.errorHandler());
    var winstonStream = {
        write: function (message, encoding) {
            winston.info(message);
        }
    };
    app.use(express.logger({stream: winstonStream}));
});

var sessionStoreRedisClient = redis.createClient(global.config.redis.REDIS_PORT, global.config.redis.REDIS_HOST);

sessionStoreRedisClient.auth(global.config.redis.REDIS_PASSWORD, function (err) {
    if (err) {
        console.log("Redis auth failed: " + err);
    }
    else {
        console.log("Connected to Redis for storing session");
    }
});

global.sessionStoreRedisClient = sessionStoreRedisClient;
global.subscribeRedisClient = redis.createClient(global.config.redis.REDIS_PORT, global.config.redis.REDIS_HOST);
global.subscribeRedisClient.auth(global.config.redis.REDIS_PASSWORD);
notify.init();
app.set("views", __dirname + "/views");
app.set('view engine', 'ejs');
app.use(express.static(global.config.PUBLIC_HTML));
app.use(cookieParser());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(session({
    resave: true,
    saveUninitialized: true,
    key: global.config.SESSION_KEY,
    secret: global.config.SESSION_SECRET,
    cookie: {
        httpOnly: false,
        maxAge: null,
        path: '/'
    },
    store: new RedisStore({
        prefix: global.config.redis.REDIS_SESSIION_PREFIX,
        client: sessionStoreRedisClient
    })
}));

app.use(function (req, res, next) {
    var sock = req.socket;
    sock.removeAllListeners('timeout');
    sock.setTimeout(15 * 1000);
    sock.on('timeout', function () {
        if (shuttingDown) {
            logger.debug("Socket timeout in shutdown mode. closing...");
            sock.destroy();
        }
    });
    if (!shuttingDown) {
        return next();
    }
    else {
        logger.debug("Got request in shutdown mode: closing connection....");
        res.setHeader("Connection", "close");
        res.send(502, "Server is in the process of restarting");
        req.socket.destroy();
    }
});
app.use(passport.initialize());
app.use(passport.session());
app.use(function (req, res, next) {
    res.setHeader("Cache-Control", "max-age=3600");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Set-Cookie, Cookie");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Origin", "*");
    var proto = req.get("X-Forwarded-Proto");
    if (proto == "http") {
        var url = "https://" + req.host + req.path;
        res.redirect(url);
    } else {
        return next();
    }
});
app.use(app.router);
app.get('/', pages.index);
app.get('/console', pages.console);
app.post('/signin', signin.index);
app.post('/addUser', addUser.index);
app.post('/listUsers', listUsers.index);
app.post('/signout', signout.index);
app.post('/signup', signup.index);
app.post('/getUserInfo', getUserInfo.index);
app.post('/getUserInfoById', getUserInfo.byId);
app.post('/isSessionActive', isSessionActive.index);
app.post('/getSalt', getSalt.index);
app.post('/updateUserData', updateUserData.index);
app.post('/getRegDetails', getRegDetails.index);
app.post('/deleteUser', deleteUser.index);
app.post('/changePassword', changePassword.index);
app.use(function (req, res, next) {
    res.status(404);
    if (req.accepts('html')) {
        res.render('404', {url: req.url, title: "Error 404 - Shelloid"});
        return;
    }
    if (req.accepts('json')) {
        res.send({ status: 404, msg: 'Not found' });
        return;
    }
    res.type('txt').send('Not found');
});

var server = http.createServer(app).listen(global.config.APP_PORT, global.config.APP_HOST, function () {
    console.log("App running on " + global.config.APP_HOST + ":" + global.config.APP_PORT + " in " + process.env.NODE_ENV + " mode.");
});

function gracefulExit() {
    if (shuttingDown) {
        logger.info("Shutdown already in progress");
        //	return; //TODO add return
    }
    logger.info("Received kill signal (SIGTERM), shutting down gracefully.");
    shuttingDown = true;
    server.close(function () {
        logger.info("Closed out remaining connections.");
        dbPool.drain(function () {
            dbPool.destroyAllNow();
            logger.info("Drained the DB pool.");
        });
        redisPool.drain(function () {
            redisPool.destroyAllNow();
            logger.info("Drained the Redis pool.");
            process.exit();
        });
    });

    setTimeout(function () {
        logger.info("Could not close connections in time, forcefully shutting down");
        process.exit(1);
    }, 60 * 1000);
}

process.on('SIGTERM', gracefulExit).on('SIGINT', gracefulExit);