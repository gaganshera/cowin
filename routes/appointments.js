var express = require("express");
var router = express.Router();
const appointmentsService = require("../services/appointmentsService");
const { states, districts } = require("../app_configs/app.constants");

router.get("/", function (req, res, next) {
  res.render("appointments", { states, districts, DOCKERISED: process.env.DOCKERISED });
});

router.post("/", async function (req, res, next) {
  console.log(req.body);
  let data = await appointmentsService.scheduleIntervals(req, res);
  res.json(data);
});

module.exports = router;
