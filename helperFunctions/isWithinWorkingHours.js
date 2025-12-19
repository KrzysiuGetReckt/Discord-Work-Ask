require('dotenv').config();

const {
    WORK_START_HOUR,
    WORK_END_HOUR,
    TIME_ZONE
} = process.env;

function getCETHour() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: TIME_ZONE,
        hour: 'numeric',
        hour12: false
    });
    return Number(formatter.format(now));
}

function isWithinWorkingHours() {
    const hour = getCETHour;
    return hour >= WORK_START_HOUR && hour < WORK_END_HOUR;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    isWithinWorkingHours,
    sleep
};