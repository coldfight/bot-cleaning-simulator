const express = require("express");
const router = express.Router();
const SocketIO = require("socket.io");
const NeoBot = require("../entities/NeoBot");
let io;

router.post("/new", function(req, res) {
  // @todo: retrieve the txt file
  // @todo: parse txt file to convert it into a map
  // @todo: create a new NeoBot
  // @todo: start the cleaning process but don't wait for it to finish before sending "DONE"

  const map = req.body.map;
  const theOne = new NeoBot(io.sockets, map);
  theOne.simulateCleaning();

  res.json({
    message: `Started a new cleaning bot: ${theOne.getId()}`
  });
});

module.exports = function(socketIo) {
  io = socketIo;

  if (!(io instanceof SocketIO)) {
    throw new Error(
      "An instance of socket.io must be passed as an argument to api router."
    );
  }

  return router;
};
