const moment = require("moment");

function arraysHaveSameElements(array1, array2) {
  if (array1.length !== array2.length) {
    return false;
  }

  const sortedArray1 = array1.slice().sort();
  const sortedArray2 = array2.slice().sort();

  return sortedArray1.every((value, index) => value === sortedArray2[index]);
}

const determineDateBoundaries = (dateFilter) => {
  const weekDays = [1, 2, 3, 4, 5];
  const weekendDays = [0, 6];

  const dateBoundaries = [];

  //   const today = new Date("March 10, 2024 03:24:00");
  const today = new Date();
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

  const dateMapping = {
    "Aujourd'hui": "Today",
    Demain: "Tomorrow",
    "Cette semaine": "Week",
    "Ce week-end": "Weekend",
  };

  if (arraysHaveSameElements(dateFilter, ["Today"])) {
    dateBoundaries.push([today, todayEnd]);
  } else if (arraysHaveSameElements(dateFilter, ["Tomorrow"])) {
    dateBoundaries.push([tomorrowStart, tomorrowEnd]);
  } else if (arraysHaveSameElements(dateFilter, ["Week"])) {
    dateBoundaries.push([startOfWeek, endOfWeek]);
  } else if (arraysHaveSameElements(dateFilter, ["Weekend"])) {
    dateBoundaries.push([startOfWeekend, endOfWeekend]);
  } else if (arraysHaveSameElements(dateFilter, ["Week", "Weekend"])) {
    if (weekDays.includes(todayDay)) {
      dateBoundaries.push([startOfWeek, endOfWeekend]);
    } else if (weekendDays.includes(todayDay)) {
      dateBoundaries.push([startOfWeekend, endOfWeek]);
    }
  } else if (arraysHaveSameElements(dateFilter, ["Today", "Tomorrow"])) {
    dateBoundaries.push([today, tomorrowEnd]);
  } else if (arraysHaveSameElements(dateFilter, ["Today", "Weekend"])) {
    if (weekDays.includes(todayDay)) {
      dateBoundaries
        .push([today, todayEnd])
        .push([startOfWeekend, endOfWeekend]);
    } else if (weekendDays.includes(todayDay)) {
      dateBoundaries.push([startOfWeekend, endOfWeekend]);
    }
  } else if (arraysHaveSameElements(dateFilter, ["Tomorrow", "Weekend"])) {
    if (weekDays.includes(todayDay)) {
      dateBoundaries
        .push([tomorrowStart, tomorrowEnd])
        .push([startOfWeekend, endOfWeekend]);
    } else if (todayDay === 6) {
      dateBoundaries.push([startOfWeekend, endOfWeekend]);
    } else if (todayDay === 0) {
      dateBoundaries.push([startOfWeekend, tomorrowEnd]);
    }
  } else if (arraysHaveSameElements(dateFilter, ["Today", "Week"])) {
    if (weekDays.includes(todayDay) || todayDay === 0) {
      dateBoundaries.push([today, endOfWeek]);
    } else if (todayDay === 6) {
      dateBoundaries.push([today, todayEnd]).push([startOfWeek, endOfWeek]);
    }
  } else if (arraysHaveSameElements(dateFilter, ["Tomorrow", "Week"])) {
    if (weekDays.includes(todayDay) || todayDay === 6) {
      dateBoundaries.push([tomorrowStart, endOfWeek]);
    } else if (todayDay === 0) {
      dateBoundaries.push([startOfWeek, endOfWeek]);
    }
  } else if (
    arraysHaveSameElements(dateFilter, ["Today", "Tomorrow", "Weekend"])
  ) {
    if (todayDay === 1 || todayDay === 2 || todayDay === 3) {
      dateBoundaries
        .push([today, tomorrowEnd])
        .push([startOfWeekend, endOfWeekend]);
    } else if (todayDay === 4 || todayDay === 5) {
      dateBoundaries.push([today, endOfWeekend]);
    } else if (todayDay === 6) {
      dateBoundaries.push([startOfWeekend, endOfWeekend]);
    } else if (todayDay === 0) {
      dateBoundaries.push([today, tomorrowEnd]);
    }
  } else if (
    arraysHaveSameElements(dateFilter, ["Today", "Tomorrow", "Week"])
  ) {
    if (
      todayDay === 1 ||
      todayDay === 2 ||
      todayDay === 3 ||
      todayDay === 6 ||
      todayDay === 0
    ) {
      dateBoundaries.push([today, endOfWeek]);
    } else if (todayDay === 4 || todayDay === 5) {
      dateBoundaries.push([today, tomorrowEnd]);
    }
  } else if (
    arraysHaveSameElements(dateFilter, ["Today", "Tomorrow", "Week", "Weekend"])
  ) {
    dateBoundaries.push([today, endOfWeekend]);
  }

  return dateBoundaries;
};

const dateFilter = ["Today", "Tomorrow"];
console.log(determineDateBoundaries(dateFilter));

module.exports = { determineDateBoundaries };
