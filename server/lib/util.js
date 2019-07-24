const debug = require("debug")("server:server");

module.exports = {
  /**
   * Normalize a port into a number, string, or false.
   */
  normalizePort(val) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
      // named pipe
      return val;
    }

    if (port >= 0) {
      // port number
      return port;
    }

    return false;
  },

  /**
   * Event listener for HTTP server "error" event.
   */
  onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  },

  /**
   * Event listener for HTTP server "listening" event.
   */
  onServerListening(server) {
    return function () {
      const addr = server.address();
      const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
      debug('Listening on ' + bind);
    }
  },

  /**
   * Event listener for Socket.io "connection" event
   */
  onSocketConnected(socket) {
    debug("Socket.io client connected");
  },

  generateIdentifier() {
    const s4 = function() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    };

    return (
      s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4()
    );
  }
}