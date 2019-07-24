var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
  res.json({
    message: "root route for /api"
  });
});

module.exports = router;


