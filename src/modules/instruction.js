// TODO seperate into tulip model and controller and try to abstract the instruction UI element from the data state
var Instruction = Class({
  /*

    wptJson: {
            distances: {
              kmFromStart: FLOAT,
              kmFromPrev: FLOAT,
            },
            angles: {
              heading: INTEGER,
              relativeAngle: INTEGER.
            },
            tulipJson: OBJECT,
            notes: {
              glyphs:[],
              text: STRING,
            },
    }
  */
  create: function (roadbook, wptJson) {
    // can all this knockout stuff be at the controller level then model data is updated when controller starts up or shuts down
    this.kmFromStart = ko.observable(wptJson.kmFromStart);
    this.kmFromPrev = ko.observable(wptJson.kmFromPrev);
    this.exactHeading = ko.observable(wptJson.heading);
    this.lat = ko.observable(wptJson.lat);
    this.lng = ko.observable(wptJson.long);
    this.notification = wptJson.notification || false;
    this._notification = ko.observable(this.notification);
    this._notification.subscribe((newValue) => {
      if (newValue !== this.notification) {
        this.notification = newValue; // Sync the local value
      }
    });
    this.inSpeedZone = ko.observable(false);
    this.checkpointNumber = ko.observable(false);
    this.speedLimit = ko.observable(false);
    this.dangerLevel = ko.observable(0);
    this.distFromPrev = ko.computed(this.computedDistanceFromPrev, this);
    this.closeProximity = ko.computed(this.instructionCloseProximity, this);
    this.waypointIcon = ko.computed(this.assignWaypointIcon, this);
    this.waypointColoring = ko.computed(this.assignWaypointColoring, this);
    this.waypointDanger2 = ko.computed(this.isWaypointDanger2, this)
    this.totalDistance = ko.computed(this.computedTotalDistance, this);
    this.heading = ko.computed(this.computedHeading, this);
    this.coordinates = ko.computed(this.computedCoordinates, this);

    this.showHeading = ko.observable((wptJson.showHeading == undefined ? app.settings.showCapHeading : wptJson.showHeading));
    this.showCoordinates = ko.observable((wptJson.showCoordinates == undefined ? app.settings.showCoordinates : wptJson.showCoordinates));
    this.entryTrackType = wptJson.entryTrackType == undefined ? 'track' : wptJson.entryTrackType;
    this.exitTrackType = wptJson.exitTrackType == undefined ? 'track' : wptJson.exitTrackType;

    // instruction don't get any note info when they are added via UI so intialize them to blank
    var text = wptJson.notes == undefined ? '' : wptJson.notes.text;
    this.noteHTML = ko.observable(text);
    this.noteHTML.subscribe((noteHTML) => {
      if (this.dangerLevel() == 3 && this.notification == false) {
        console.log('Settings waypoint to WPS');
        this._notification(new Notification('waypoint-security'));
      }
    })
    const glyphs = [...text.matchAll(/<img[^>]*src="[^"]*\/([a-z0-9,-]*)\.[^"]*"/g)]
      .map(match => match[1]); // Extract the captured group
    this.parseGlyphInfo(glyphs);

    this.roadbook = roadbook;
    this.routePointIndex = wptJson.routePointIndex == undefined ? null : wptJson.routePointIndex;
    // TODO refactor to make this one line
    if (this._notification()) {
      app.mapController.addWaypointBubble(this.routePointIndex, this._notification().openRadius || 0, this._notification().validationRadius, this._notification().fill)
    }

    var _this = this;
    var angle = wptJson.relativeAngle;
    var json = wptJson.tulipJson;
    var trackTypes = { entryTrackType: this.entryTrackType, exitTrackType: this.exitTrackType };
    ko.bindingHandlers.instructionCanvasRendered = {
      init: function (element) {
        _this.initTulip(element, angle, trackTypes, json);
        _this.initInstructionListeners($(element).parents('.waypoint'));
        _this.element = $(element).parents('.waypoint');
      }
    };
  },
  //TODO This needs refactored
  parseGlyphInfo(glyphs) {
    match = glyphs.join(' ').match(/danger-(\d+)/);
    this.dangerLevel(match ? match[1] : 0);
    match = glyphs.join(' ').match(/speed-(\d+)/);
    this.speedLimit(match ? match[1] : false);
  },

  hasNotification() {
    return this._notification() != false;
  },

  changeAddedTrackType(type) {
    this.tulip.changeAddedTrackType(type)
  },

  changeEntryTrackType(type) {
    this.entryTrackType = type;
    this.tulip.changeEntryTrackType(type)
  },

  changeExitTrackType(type) {
    this.exitTrackType = type;
    this.tulip.changeExitTrackType(type)
  },

  // definitelty needs to be put at controller level
  initTulip: function (element, angle, trackTypes, json) {
    this.tulip = new Tulip(element, angle, trackTypes, json);
  },

  updateInstruction: function (geoData, routePointIndex) {
    if (geoData.kmFromStart) {
      this.kmFromStart(geoData.kmFromStart);
    }
    if (geoData.kmFromPrev) {
      this.kmFromPrev(geoData.kmFromPrev);
    }
    if (geoData.heading) {
      this.exactHeading(geoData.heading);
    }
    if (geoData.relativeAngle) {
      this.tulip.changeExitAngle(geoData.relativeAngle, this.exitTrackType);
    }
    if (geoData.lat && geoData.long) {
      this.lat(geoData.lat);
      this.lng(geoData.long);
    }
    if (routePointIndex) {
      this.routePointIndex = routePointIndex
    }
  },

  computedDistanceFromPrev: function () {
    if (this.kmFromPrev() && this.kmFromPrev() > 0) {
      return this.kmFromPrev().toFixed(2);
    } else {
      return '0.00'
    }
  },

  instructionCloseProximity: function () {
    return (this.kmFromPrev() < (app.settings.tulipNearDistance / 1000) && this.kmFromPrev() > 0)
  },

  assignWaypointIcon: function () {
    if (this.hasNotification()) {
      filename = Notification.mapFileNameToType(this._notification().type, true);
      return "<img src='assets/svg/glyphs/" + filename + ".svg'>";
    }
  },

  assignWaypointColoring: function () {
    var instructionClass = "";
    instructionClass += ((this.dangerLevel() == 3) ? " waypoint-danger-3" : "");
    instructionClass += ((this.inSpeedZone()) ? " waypoint-speed-zone" : "");
    if (this.closeProximity())
      return ('waypoint-distance-close') + instructionClass;
    if (this.hasNotification()) {
      return "waypoint-type-" + this._notification().type + instructionClass;
    }
    return ""
  },

  assignInstructionColoring: function () {
    // Danger 3 coloring
    if (this.dangerLevel() == 3) return "instruction-danger-3";
    // Speed zone coloring
    if (this.hasNotification()) {
      if (["dsz", "dns", "dts"].includes(this.notification.type)) {
        return "instruction-DZ ";
      }
      if (["fsz", "fn", "ft"].includes(this.notification.type) && this.inSpeedZone()) {
        return "instruction-FZ ";
      }
    }
    if (this.inSpeedZone()) return "instruction-speed-zone";
    return "";
  },

  assignTulipColoring: function () {
    if (this.hasNotification() && (this.notification.type == "cp")) {
      return "waypoint-tulip-checkpoint";
    }
  },

  isWaypointDanger2: function () {
    return this.dangerLevel() == 2;
  },

  removeWaypoint: function () {
    this.notification = false;
    this._notification(false);
    $('#notification-options').addClass('hidden');
    app.mapController.deleteWaypointBubble(this.routePointIndex);
    this.assignWaypointColoring();
  },

  //TODO Refactor this function
  manageWaypoint(glyph) {
    if (this._notification() == false) {
      // create a new notification
      // grab the glyph name from the file name, agnostic to the path.
      this._notification(new Notification(glyph));
      if (this._notification().type == null) {
        this._notification(false);
      } else {
        app.mapController.addWaypointBubble(this.routePointIndex, this._notification().openRadius || 0, this._notification().validationRadius, this._notification().fill)
        // show notification options
        $('#notification-options').removeClass('hidden');
        app.noteControls.updateNotificationControls(this._notification());
      }
    } else {
      this._notification(new Notification(glyph));
      if (this._notification().type == null) {
        this.notification_(false);
      } else {
        app.mapController.updateWaypointBubble(this.routePointIndex, this._notification().openRadius || 0, this._notification().validationRadius, this._notification().fill);
        app.noteControls.updateNotificationControls(this._notification());
      }
    }
  },

  computedTotalDistance: function () {
    return this.kmFromStart().toFixed(2);
  },

  computedHeading: function () {
    var heading = Math.round(this.exactHeading());
    //round the exaxt heading and zero pad it
    return Array(Math.max(3 - String(heading).length + 1, 0)).join(0) + heading + '\xB0';
  },

  computedCoordinates: function () {
    var lat = this.lat();
    var lon = this.lng();
    return String((lat >= 0 ? 'N' : 'S') + this.degFormat(lat)) + '<br>' + String((lon >= 0 ? 'E' : 'W') + this.degFormat(lon))
  },

  degFormat: function (coordinate) {
    var d = Math.floor(coordinate)
    var m = (coordinate - d) * 60
    var s = (m - Math.floor(m)) * 60
    switch (app.settings.coordinatesFormat) {
      case 'dd':
        return coordinate.toFixed(6) + '&deg'
      case 'ddmm':
        return d + '&deg ' + m.toFixed(3) + "'"
      case 'ddmmss':
        return d + '&deg ' + Math.floor(m) + "' " + s.toFixed(3) + '"'
      default:
        return d + '&deg ' + m.toFixed(3) + "'"
    }
  },

  initInstructionListeners: function (element) {
    var _this = this;
    $(element).dblclick(function (e) {
      if (_this.roadbook.requestInstructionEdit(_this)) {
        _this.tulip.beginEdit();
      }
    });
    $(element).click(function (e) {
      $("div.waypoint").removeClass("waypoint-selected")
      element.addClass("waypoint-selected");
      app.mapController.centerOnInstruction(_this);
    });
  },

  instructionNumber: function () {
    return this.roadbook.instructions.indexOf(this) + 1;
  },

  serializeTulip: function () {
    return this.tulip.serialize();
  },

  tulipPNG: function () {
    return this.tulip.toPNG();
  },
});
