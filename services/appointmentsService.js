const axios = require("axios");
const async = require("async");
const moment = require("moment");
const { vaccines } = require("../app_configs/app.constants");
const notifier = require("node-notifier");
var io = require("../services/socketApi");
let interval;

async function scheduleIntervals(req, res) {
  const {
    vaccine = [vaccines.COVISHIELD, vaccines.COVAXIN],
    age = ["18", "45"],
    dose = ["1", "2"],
    refresh_rate = "30",
    sound,
    vaccine_type = ["paid", "free"],
  } = req.body;
  let { district_id } = req.body;
  if (!district_id) {
    return null;
  } else if (!Array.isArray(district_id)) {
    district_id = [district_id];
  }
  clearInterval(interval);
  if (refresh_rate != 0) {
    interval = setInterval(
      getFilteredAppointments,
      refresh_rate * 1000,
      vaccine,
      age,
      dose,
      district_id,
      sound,
      vaccine_type
    );
  }

  return await getFilteredAppointments(vaccine, age, dose, district_id, sound, vaccine_type);
}

async function getFilteredAppointments(vaccine, age, dose, district_id, sound, vaccine_type) {
  try {
    let results = await async.mapLimit(district_id, 20, fetchAppointmentsInfo);
    let availableCenters = [];
    let notificationText = "";
    let plus18 = 0;
    let plus45 = 0;
    if (results && results[0]) {
      results.forEach((districtWise) => {
        districtWise.forEach((centerWise) => {
          if (
            centerWise.center &&
            centerWise.session &&
            vaccine.includes(centerWise.session.vaccine) &&
            age.includes(String(centerWise.session.min_age_limit)) &&
            vaccine_type.includes(centerWise.center.fee_type.toLowerCase())
          ) {
            if (dose.includes("1") && centerWise.session.available_capacity_dose1 > 0) {
              availableCenters.push(centerWise);
              notificationText += `AGE: ${centerWise.session.min_age_limit}, ${
                centerWise.center.district_name
              }, ${centerWise.center.pincode}, ${centerWise.center.name.substring(0, 20)}\n`;
              if (centerWise.session.min_age_limit === 18) ++plus18;
              else if (centerWise.session.min_age_limit === 45) ++plus45;
            }
            if (dose.includes("2") && centerWise.session.available_capacity_dose2 > 0) {
              availableCenters.push(centerWise);
              notificationText += `AGE: ${centerWise.session.min_age_limit}, ${
                centerWise.center.district_name
              }, ${centerWise.center.pincode}, ${centerWise.center.name.substring(0, 20)}\n`;
              if (centerWise.session.min_age_limit === 18) ++plus18;
              else if (centerWise.session.min_age_limit === 45) ++plus45;
            }
          }
        });
      });
    }
    if (availableCenters[0]) {
      notifier.notify({
        title: `Covaxin available!! 18+: ${plus18}, 45+: ${plus45}, Total ${plus18 + plus45}`,
        message: notificationText,
        sound: sound ? true : false,
      });
    }
    console.log("ioioio");
    io.send({ availableCenters });
    return availableCenters;
  } catch (e) {
    console.log(e);
    return null;
  }
}

async function fetchAppointmentsInfo(district, date = moment().format("DD-MM-YYYY")) {
  console.log(district);
  const district_id = district.district_id ? district.district_id : district;
  console.log(
    `${process.env.COWIN_URL}/appointment/sessions/public/calendarByDistrict?district_id=${district_id}&date=${date}`
  );
  let res = await axios.get(
    `${process.env.COWIN_URL}/appointment/sessions/public/calendarByDistrict?district_id=${district_id}&date=${date}`
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

module.exports = { scheduleIntervals };
