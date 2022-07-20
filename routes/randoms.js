const express = require("express");
const { fork } = require("child_process");
const forked = fork("./calculo.js");


const { Router } = express;

let router = new Router();

router.get("/randoms", (req, res) => {
  if (req.query.cant) {
    forked.send(req.query.cant);
  } else {
    forked.send(100000000);
  }
  forked.on("message", (msj) => {
    res.render('random' ,{data: msj})
  });
});

module.exports = router