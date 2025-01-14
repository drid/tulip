'use strict';
/*
  This class provides a structured data format to store
  and modify notifications which can be exported via GPX
  for use in RallyBlitz and RallyComp.

  Any other parties interested in integrating should also be accomodated.

  // NOTE this is a straight up model and the simplicity of such is beautiful
  // NOTE Buuuuut there are two static calls in the constructor, maybe look at the factory pattern
*/
class Notification {
  constructor(name) {
    var type = Notification.mapFileNameToType(name);
    if (type) {
      var notification = Notification.buildNotification(type);
      this.type = notification.type;
      this.openrallytype = notification.openrallytype;
      this.openRadius = notification.openRadius;
      this.validationRadius = notification.validationRadius;
      this.modMin = notification.modMin;
      this.modMax = notification.modMax;
      this.modStep = notification.modStep;
      this.fill = notification.fill;
      this.time = notification.time;
    }
  }

  static mapFileNameToType(filename, reverse = false) {
    var map = {
      "waypoint-masked": "wpm",
      "waypoint-visible": "wpv",
      "waypoint-eclipsed": "wpe",
      "waypoint-control": "wpc",
      "waypoint-navigation": "wpn",
      "waypoint-precise": "wpp",
      "waypoint-security": "wps",
      "control-start-selective-section": "dss",
      "start": "dss",
      "control-arrival-selective-section": "fss",
      "finish": "fss",
      "control-checkpoint": "cp",
      "speed-start": "dsz",
      "speed-end": "fsz",
      "control-start-neutralization": "dn",
      "control-start-neutralization-speed-limit": "dns",
      "control-finish-neutralization": "fn",
      "control-start-transfer": "dt",
      "control-start-transfer-speed-limit": "dts",
      "control-finish-transfer": "ft",
    }
    if (reverse)
      return Object.keys(map).find(key => map[key] === filename);
    return map[filename];
  }


  static buildNotification(type) {
    var types = {
      wpm: {
        type: "wpm",
        openrallytype: "wpm",
        fill: '#008CBA',
        openRadius: 800,
        validationRadius: 90,
        modMin: 100,
        modMax: 1000,
        modStep: 100,
      },
      wpv: {
        type: "wpv",
        openrallytype: "wpv",
        fill: '#008CBA',
        validationRadius: 200,
        modMin: 5,
        modMax: 800,
        modStep: 100,
      },
      wpe: {
        type: "wpe",
        openrallytype: "wpe",
        fill: '#008CBA',
        openRadius: 1000,
        validationRadius: 90,
        modMin: 5,
        modMax: 1000,
        modStep: 100,
      },
      wpn: {
        type: "wpn",
        openrallytype: "wpn",
        fill: '#ff20fb',
        openRadius: 800,
        validationRadius: 200,
        modMin: 200,
        modMax: 1000,
        modStep: 100,
      },
      wpc: {
        type: "wpc",
        openrallytype: "wpc",
        fill: '#ffffb9',
        validationRadius: 300,
      },
      wpp: {
        type: "wpp",
        openrallytype: "wpp",
        fill: '#cccccc',
        openRadius: 100,
        validationRadius: 20,
        modMin: 5,
        modMax: 1000,
        modStep: 100,
      },
      wps: {
        type: "wps",
        openrallytype: "wps",
        fill: '#ff4200',
        openRadius: 1000,
        validationRadius: 30,
        modMin: 100,
        modMax: 2000,
        modStep: 100,
      },
      dss: {
        type: "dss",
        openrallytype: "dss",
        fill: '#ff4242',
        openRadius: 1000,
        validationRadius: 200,
        modMin: 5,
        modMax: 1000,
        modStep: 100,
      },
      fss: {
        type: "fss",
        openrallytype: "ass",
        fill: '#ff6060',
        openRadius: 800,
        validationRadius: 90,
        modMin: 5,
        modMax: 1000,
        modStep: 100,
      },
      dsz: {
        type: "dsz",
        openrallytype: "dz",
        fill: '#ffba29',
        openRadius: 1000,
        validationRadius: 90,
        modMin: 5,
        modMax: 1000,
        modStep: 5,
      },
      fsz: {
        type: "fsz",
        openrallytype: "fz",
        fill: '#ffba29',
        openRadius: 1000,
        validationRadius: 90,
        modMin: 5,
        modMax: 1000,
        modStep: 5,
      },
      cp: {
        type: "cp",
        openrallytype: "cp",
        fill: '#ba6bab',
        openRadius: 1000,
        validationRadius: 90,
        modMin: 5,
        modMax: 1000,
        modStep: 5,
      },
      dn: {
        type: "dn",
        openrallytype: "dn",
        fill: '#a8aaad',
        openRadius: 1000,
        validationRadius: 90,
        time: 600
      },
      dns: {
        type: "dns",
        openrallytype: "dn",
        fill: '#ffba29',
        openRadius: 1000,
        validationRadius: 90,
        time: 600
      },
      fn: {
        type: "fn",
        openrallytype: "fn",
        fill: '#a8aaad',
        openRadius: 1000,
        validationRadius: 90
      },
      dt: {
        type: "dt",
        openrallytype: "dt",
        fill: '#a8aaad',
        openRadius: 1000,
        validationRadius: 90,
        time: 600
      },
      dts: {
        type: "dts",
        openrallytype: "dt",
        fill: '#ffba29',
        openRadius: 1000,
        validationRadius: 90,
        time: 600
      },
      ft: {
        type: "ft",
        openrallytype: "ft",
        fill: '#a8aaad',
        openRadius: 1000,
        validationRadius: 90
      },
    }
    return types[type];
  }

  static nameMatchesClass(name, type) {
    return (Notification.mapFileNameToType(name) == type);
  }
}

/*
  Node exports for test suite
*/
// module.exports.nameMatchesClass = Notification.nameMatchesClass;
// module.exports.mapFileNameToType = Notification.mapFileNameToType;
// module.exports.buildNotification = Notification.buildNotification;
