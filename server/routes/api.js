const express = require('express');
const router = express.Router();
const SocketIO = require('socket.io')
const NeoBot = require("../entities/NeoBot");
let io;

router.get('/', function (req, res) {
  const theOne = new NeoBot();

  res.json({
    message: "root route for /api"
  });
});

module.exports = function (socketIo) { 
  io = socketIo;

  if (!(io instanceof SocketIO)) {
    throw new Error("Need to pass an instance of socket.io as an argument to api router.")
  }

  return router;
}


