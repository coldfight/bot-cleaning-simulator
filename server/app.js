const express = require("express");
const logger = require("morgan");
const http = require("http");
const app = express();
const router = express.Router();

const util = require("./lib/util");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Get port from environment and store in Express.
 */
const port = util.normalizePort(process.env.PORT || "3000");
app.set("port", port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Start up socket.io
 */
const io = require("socket.io")(server);

/**
 * Setup CORS
 */
app.use(require("./middleware/cors"));

/**
 * Setup routes
 */
app.use('/api', require("./routes/api"));

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', util.onError);
server.on('listening', util.onServerListening(server));
io.on('connection', util.onSocketConnected)
