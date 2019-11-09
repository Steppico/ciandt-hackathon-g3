/*global firebase, document */
/*jslint browser:true */
"use strict";

/**
 * Reads data from Firestore and updates information
 * displayed on the dashboard
 * @param {String} sensor The sensor key.
 */

let state = {
  useful_data: {},
  isAirCon: true
};

function readData(sensor) {
  let db = firebase.firestore();
  db.collection(sensor).onSnapshot(function(querySnapshot) {
    querySnapshot.forEach(function(doc) {
      if (doc.data().date) {
        state.useful_data[sensor] = doc.data();
      } else {
        state.useful_data[sensor] = doc.data().value;
      }
      document.getElementById(sensor).innerText = doc.data().value;
      let today = new Date();
      let date =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate();
      let time =
        today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      let dateTime = date + " " + time;
      document.getElementById("last-update").innerText = dateTime;
    });
  });
}

function printMessage() {
  const in_temp = state.useful_data.temperature;
  const out_temp = state.useful_data["outdoor_temperature"];
  const diff = in_temp - out_temp;
  const message = document.getElementsByClassName("message")[0];
  const otherMessage = state.isAirCon ? "You don't need the aircon!" : "";
  if (diff > 3) {
    message.innerText =
      "The temperature is too high! Consider cooling." + otherMessage;
  } else if (diff < -3) {
    message.innerText = "The temperature is too low! Consider heating.";
  } else {
    message.innerText = "The temperature is fine." + " " + otherMessage;
  }
}

function processSensors(sensors) {
  sensors.forEach(sensor => {
    readData(sensor);
  });
}

let tempDiff = 0;
/**
 * Triggered once DOM is loaded.
 */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    document.getElementById("aircon").classList.add("isOn");
    let sensors = ["temperature", "outdoor_temperature"];
    // processSensors(sensors);
    let db = firebase.firestore();
    db.collection("data")
      .where("seconds", ">=", 0)
      .get()
      .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          state.useful_data[doc.data().seconds] = doc.data();
        });
      })
      .then(result => {
        let max = 0;
        for (const data in state.useful_data) {
          if (state.useful_data[data].seconds > max) {
            max = state.useful_data[data].seconds;
          }
        }
        for (const sensor of sensors) {
          document.getElementById(sensor).innerText =
            state.useful_data[max][sensor];
        }
        document.getElementById("last-update").innerText =
          state.useful_data[max].date;
      });

    //
  } catch (e) {
    console.error(e);
  }
});

const airconControl = document.getElementsByClassName("airconControl")[0];

airconControl.addEventListener("click", () => {
  if (state.isAirCon) {
    state.isAirCon = false;
    document.getElementById("aircon").classList.add("isOff");
    document.getElementById("aircon").classList.remove("isOn");
  } else {
    state.isAirCon = true;
    document.getElementById("aircon").classList.toggle("isOn");
    document.getElementById("aircon").classList.remove("isOff");
  }
});

const checkDiff = document.getElementsByClassName("checkdiff")[0];
checkDiff.addEventListener("click", () => printMessage());
