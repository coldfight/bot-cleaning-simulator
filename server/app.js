const express = require("express");
const logger = require("morgan");
const http = require("http");

const util = require("./lib/util");

const app = express();

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
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', util.onError);
server.on('listening', util.onListening(server));

