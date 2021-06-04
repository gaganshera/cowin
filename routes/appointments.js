const { default: axios } = require("axios");
var express = require("express");
var router = express.Router();
const async = require("async");
const moment = require("moment");
const { delhi_districts, vaccines } = require("../app_configs/app.constants");
const cron = require("node-cron");
const notifier = require("node-notifier");

function schedule() {
  console.log("dsafdskfdjkjslkadjsn");
  main();
  cron.schedule("* * * * *", () => {
    console.log("running a task every minute");
    main();
  });
}

router.get("/delhi", function (req, res, next) {
  main(req, res);
});

function main(req, res) {
  async.mapLimit(delhi_districts, 20, fetchAppointmentsInfo, function (err, results) {
    if (err) {
    } else {
      let cowin = [];
      let covaxinCenters = "";
      let cowin18 = 0;
      let cowin45 = 0;
      if (results && results[0]) {
        // console.log("sdadsfdv'", results);
        results.forEach((districtWise) => {
          districtWise.forEach((centerWise) => {
            if (centerWise.session && centerWise.session.vaccine === vaccines.COVAXIN) {
              console.log(centerWise, vaccines.COVAXIN);
              console.table(centerWise.session);
              console.log(centerWise.session);
              cowin.push(centerWise);
              covaxinCenters += `AGE => ${centerWise.session.min_age_limit}, ${
                centerWise.center.district_name
              } => ${centerWise.center.name.substring(0, 20)}\n`;
              if (centerWise.session.min_age_limit === 18) {
                ++cowin18;
              } else if (centerWise.session.min_age_limit === 45) {
                ++cowin45;
              }
            } else if (
              centerWise.session &&
              centerWise.session.vaccine === vaccines.COVISHIELD &&
              centerWise.session.min_age_limit === 18 &&
              centerWise.session.available_capacity_dose1 > 0
            ) {
              // console.log(centerWise, vaccines.COVISHIELD);
              // console.table(centerWise.session);
              // console.log(centerWise.session);
              // cowin.push(centerWise);
            }
          });
        });
      }
      if (res) {
        res.send(cowin);
      } else {
        if (cowin[0]) {
          notifier.notify({
            title: `Covaxin available!! 18+: ${cowin18}, 45+: ${cowin45}, Total ${cowin.length}`,
            message: covaxinCenters,
          });
        }
      }
    }
  });
}

async function fetchAppointmentsInfo(district, date = moment().format("DD-MM-YYYY")) {
  console.log(district);
  console.log(
    `${process.env.COWIN_URL}/appointment/sessions/public/calendarByDistrict?district_id=${district.district_id}&date=${date}`
  );
  let res = await axios.get(
    `${process.env.COWIN_URL}/appointment/sessions/public/calendarByDistrict?district_id=${district.district_id}&date=${date}`
  );
  if (res && res.data && res.data.centers) {
    //filter our available locations
    let centerDetails = [];
    res.data.centers.forEach((center) => {
      const { sessions } = center;
      let details;
      sessions.map((session) => {
        if (session.available_capacity > 0) {
          details = { center, session };
          centerDetails.push(details);
        }
      });
    });
    return centerDetails;
  } else {
    return null;
  }
}

module.exports = {
  router,
  schedule,
};
