const moment = require("moment");

const determineDateBoundaries = () => {
  const weekDays = [1, 2, 3, 4, 5];
  const weekendDays = [0, 6];

  const today = new Date("March 10, 2024 03:24:00");
  //   const today = new Date();
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const todayDate = today.getDate();
  const todayDay = today.getDay();
  console.log("today: ", today);
  console.log("todayEnd: ", todayEnd);
  console.log("todayDate: ", todayDate);
  console.log("todayDay: ", todayDay);

  const tomorrowStart = new Date();
  tomorrowStart.setDate(todayDate + 1);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date();
  tomorrowEnd.setDate(todayDate + 1);
  tomorrowEnd.setHours(23, 59, 59, 999);
  console.log("tomorrowStart: ", tomorrowStart);
  console.log("tomorrowEnd: ", tomorrowEnd);

  let startOfWeek = new Date();
  if (weekDays.includes(todayDay)) {
    startOfWeek = today;
  } else if (weekendDays.includes(todayDay)) {
    if (todayDay == 6) {
      startOfWeek.setDate(todayDate + 2);
    } else if (todayDay == 0) {
      startOfWeek.setDate(todayDate + 1);
    }
    startOfWeek.setHours(0, 0, 0, 0);
  }
  console.log("startOfWeek: ", startOfWeek);

  const endOfWeek = new Date();
  if (weekDays.includes(todayDay)) {
    endOfWeek.setDate(todayDate + (5 - todayDay));
  } else if (weekendDays.includes(todayDay)) {
    if (todayDay == 6) {
      endOfWeek.setDate(todayDate + 6);
    } else if (todayDay == 0) {
      endOfWeek.setDate(todayDate + 5);
    }
  }
  endOfWeek.setHours(23, 59, 59, 999);
  console.log("endOfWeek: ", endOfWeek);

  let startOfWeekend = new Date();
  if (weekDays.includes(todayDay)) {
    startOfWeekend.setDate(endOfWeek.getDate() + 1);
    startOfWeekend.setHours(0, 0, 0, 0);
  } else if (weekendDays.includes(todayDay)) {
    startOfWeekend = today;
  }
  console.log("startOfWeekend: ", startOfWeekend);

  let endOfWeekend = new Date();
  if (weekDays.includes(todayDay)) {
    endOfWeekend.setDate(endOfWeek.getDate() + 2);
    endOfWeekend.setHours(23, 59, 59, 999);
  } else if (weekendDays.includes(todayDay)) {
    if (todayDay == 6) {
      endOfWeekend.setDate(todayDate + 1);
    } else if (todayDay == 0) {
      endOfWeekend = today;
    }
    endOfWeekend.setHours(23, 59, 59, 999);
  }
  console.log("endOfWeekend: ", endOfWeekend);
};

determineDateBoundaries();

module.exports = { determineDateBoundaries };
