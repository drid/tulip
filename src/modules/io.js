// TODO This is a module that only interfaces with the app, refactor to make that the only coupling
var Io = Class({

  importGPX: function (gpx) {
    try {
      var gpxDoc = $.parseXML(gpx.trim());
      this.gpx = $(gpxDoc);
    } catch (e) {
      globalNode.dialog().showMessageBoxSync({
        message: "Error parsing GPX :-(",
        type: 'error',
        buttons: ['OK']
      });
      app.stopLoading();
      return;
    }

    var name, desc;
    // Find name and description from route/track
    this.gpx.find('trk').each(function () {
      const $trk = $(this);
      name = $trk.find('name').text() || false
      desc = $trk.find('desc').text() || false
    });

    if (!(name || desc)) {
      this.gpx.find('rte').each(function () {
        const $rte = $(this);
        name = $rte.find('name').text() || false
        desc = $rte.find('desc').text() || false
      });
    }

    if (app.roadbook.name() == 'Name your roadbook')
      app.roadbook.name(name || "GPX Import");
    if (app.roadbook.desc() == 'Describe your roadbook' && desc !== false)
      app.roadbook.desc(desc);

    // Load track points and fallback to route points
    path = this.gpx.find("trkpt");
    if (path.length == 0) {
      globalNode.dialog().showMessageBoxSync({
        message: "No track is found, trying to load route",
        type: 'warning',
        buttons: ['Continue']
      });
      path = this.gpx.find("rtept")
    }
    // Fallback to just waypoints
    if (path.length == 0) {
      globalNode.dialog().showMessageBoxSync({
        message: "No track or route is found, trying to load waypoints",
        type: 'warning',
        buttons: ['Continue']
      });
      path = this.gpx.find("wpt");
    }

    if (path.length == 0) {
      globalNode.dialog().showMessageBoxSync({
        message: "No usable points found, aborting",
        type: 'error',
        buttons: ['OK']
      });
      return;
    }

    this.importGPXTracks($.makeArray(path));
    this.importGPXWaypoints($.makeArray(this.gpx.find("wpt")));
    this.roadbookHasWaypoints();
    app.mapModel.updateRoadbookAndInstructions();
  },

  addWaypoint: function (marker) {
    if (marker) {
      app.mapModel.addInstruction(marker);
    }
  },

  roadbookHasWaypoints() {
    if (app.mapModel.markers[0].instruction == null) {
      this.addWaypoint(app.mapModel.markers[0]);
    }
    // TODO abstract this to the app
    if (app.mapModel.markers[(app.mapModel.markers.length - 1)].instruction == null) {
      this.addWaypoint(app.mapModel.markers[(app.mapModel.markers.length - 1)]);
    }

  },

  // TODO DRY this up
  exportGPX: function () {
    var gpxString = "<?xml version='1.0' encoding='UTF-8'?>";
    gpxString += "<gpx xmlns='http://www.topografix.com/GPX/1/1' version='1.1' creator='Tulip' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.topografix.com/GPX/gpx_style/0/2 http://www.topografix.com/GPX/gpx_style/0/2/gpx_style.xsd http://www.topografix.com/GPX/gpx_overlay/0/3 http://www.topografix.com/GPX/gpx_overlay/0/3/gpx_overlay.xsd http://www.topografix.com/GPX/gpx_modified/0/1 http://www.topografix.com/GPX/gpx_modified/0/1/gpx_modified.xsd http://www.topografix.com/GPX/Private/TopoGrafix/0/4 http://www.topografix.com/GPX/Private/TopoGrafix/0/4/topografix.xsd'>";
    var waypoints = "";
    var trackPoints = "<trk><trkseg>";
    // TODO abstract this to the app
    var points = app.mapModel.markers;
    var wptCount = 1;
    for (var i = 0; i < points.length; i++) {
      if (points[i].instruction) {
        var name = this.buildNameString(wptCount, points[i].instruction);
        var desc = this.buildDescString(wptCount, points[i].instruction);
        var waypoint = "<wpt lat='" + points[i].getPosition().lat() + "' lon='" + points[i].getPosition().lng() + "'><name>" + name + "</name><desc>" + desc + "</desc></wpt>";
        waypoints += waypoint;
        wptCount++;
      }
      var trackPoint = "<trkpt lat='" + points[i].getPosition().lat() + "' lon='" + points[i].getPosition().lng() + "'></trkpt>"
      trackPoints += trackPoint;
    }
    trackPoints += "</trkseg></trk>";
    gpxString += waypoints;
    gpxString += trackPoints;
    gpxString += "</gpx>";

    return gpxString;
  },
  // TODO DRY this up
  exportOpenRallyGPX: function (strict) {
    // Create a new XML document
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString('<?xml version="1.0" encoding="UTF-8"?><gpx></gpx>', 'application/xml');

    // Get the root element
    const root = xmlDoc.getElementsByTagName('gpx')[0];
    root.setAttribute('xmlns', 'http://www.topografix.com/GPX/1/1');
    root.setAttribute('creator', 'Tulip ' + globalNode.getVersion() + " - https://gitlab.com/drid/tulip");
    root.setAttribute('version', '1.1');
    root.setAttribute('xmlns:openrally', 'http://www.openrally.org/xmlschemas/GpxExtensions/v1.0.3');
    root.setAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
    root.setAttribute('xsi:schemaLocation', 'http://www.topografix.com/GPX/1/1\
       http://www.topografix.com/GPX/1/1/gpx.xsd\
       http://www.topografix.com/GPX/gpx_style/0/2\
       http://www.topografix.com/GPX/gpx_style/0/2/gpx_style.xsd\
       http://www.topografix.com/GPX/gpx_overlay/0/3\
       http://www.topografix.com/GPX/gpx_overlay/0/3/gpx_overlay.xsd\
       http://www.topografix.com/GPX/gpx_modified/0/1\
       http://www.topografix.com/GPX/gpx_modified/0/1/gpx_modified.xsd\
       http://www.topografix.com/GPX/Private/TopoGrafix/0/4\
       http://www.topografix.com/GPX/Private/TopoGrafix/0/4/topografix.xsd');

    // Metadata
    var element = xmlDoc.createElement('metadata');
    var extensions = xmlDoc.createElement('extensions');
    var child = xmlDoc.createElement('openrally:units');
    child.textContent = 'metric';
    extensions.appendChild(child);

    child = xmlDoc.createElement('openrally:distance');
    child.textContent = app.roadbook.totalDistance();
    extensions.appendChild(child);
    element.appendChild(extensions);
    root.appendChild(element);

    // Waypoints and tracks
    const tracks = xmlDoc.createElement('trk');
    tracks.appendChild(xmlDoc.createElement("name")).textContent = app.roadbook.name();
    const trkseg = xmlDoc.createElement("trkseg");

    // TODO abstract this to the app
    var points = app.mapModel.markers;
    var instCount = 1;
    for (var i = 0; i < points.length; i++) {
      if (points[i].instruction) {
        var waypoint = xmlDoc.createElement('wpt');
        waypoint.setAttribute('lat', points[i].getPosition().lat());
        waypoint.setAttribute('lon', points[i].getPosition().lng());
        waypoint.appendChild(xmlDoc.createElement("name")).textContent = instCount++;
        var desc = xmlDoc.createElement('desc');
        desc.textContent = "";
        waypoint.appendChild(desc);
        waypoint.appendChild(this.buildOpenRallyExtensionsString(xmlDoc, points[i].instruction, strict));
        root.appendChild(waypoint);
      }
      // Tracks
      var trkpt = xmlDoc.createElement("trkpt")
      trkpt.setAttribute('lat', points[i].getPosition().lat());
      trkpt.setAttribute('lon', points[i].getPosition().lng());
      trkseg.appendChild(trkpt);
    }

    tracks.appendChild(trkseg);
    root.appendChild(tracks);

    // Create XML string
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(xmlDoc);
    return this.prettyPrintXML(xmlString);
  },

  /*
    OpenRally enhanced GPX format... route metadata without overriding GPX user-land variables.
    strict: Comply with openrally 1.0.2 or follow unpublished changes
  */
  buildOpenRallyExtensionsString: function (xmlDoc, waypoint, strict = false) {

    extensions = xmlDoc.createElement('extensions');
    distance = xmlDoc.createElement('openrally:distance');
    distance.textContent = (waypoint.kmFromStart() - waypoint.resetDistance());
    extensions.appendChild(distance);

    const tulipCdata = xmlDoc.createCDATASection(waypoint.tulip.toPNG());
    extensions.appendChild(xmlDoc.createElement('openrally:tulip')).appendChild(tulipCdata);
    const noteCdata = xmlDoc.createCDATASection(waypoint.note.toPNG());
    extensions.appendChild(xmlDoc.createElement('openrally:notes')).appendChild(noteCdata);

    if (waypoint.showCoordinates())
      extensions.appendChild(xmlDoc.createElement('openrally:show_coordinates'))
    if (waypoint.hasResetGlyph())
      extensions.appendChild(xmlDoc.createElement('openrally:reset'))
    if (waypoint.hasFuelGlyph())
      extensions.appendChild(xmlDoc.createElement('openrally:fuel'))
    if (waypoint.dangerLevel() > 0)
      extensions.appendChild(xmlDoc.createElement('openrally:danger')).textContent = waypoint.dangerLevel();
    if (waypoint.showHeading())
      extensions.appendChild(xmlDoc.createElement('openrally:cap')).textContent = Math.round(waypoint.exactHeading());
    if (waypoint.speedLimit())
      extensions.appendChild(xmlDoc.createElement('openrally:speed')).textContent = waypoint.speedLimit();
    if (waypoint.hasTimedStop())
      extensions.appendChild(xmlDoc.createElement('openrally:stop')).textContent = waypoint.stopTimeSec();
    for (tag of waypoint.safetyTags()) {
      extensions.appendChild(xmlDoc.createElement('openrally:' + tag));
    }
    // Notification
    if (waypoint.notification && waypoint.notification.openrallytype) {
      notification = xmlDoc.createElement("openrally:" + waypoint.notification.openrallytype);
      this.setWaypointXMLAttributes(notification, waypoint);
      if (waypoint.notification.openrallytype == ('neutralization')) {
        if (strict) {
          notification.removeAttribute('open');
          notification.removeAttribute('clear');
        }
        notification.removeAttribute('time');
        notification.textContent = waypoint.notification.time;
      }
      extensions.appendChild(notification);

      // Gracefully close zones
      if (['ft', 'fn'].includes(waypoint.notification.openrallytype) && waypoint.inSpeedZone()) {
        console.log(waypoint)
        extra_z = xmlDoc.createElement('openrally:fz');
        extensions.appendChild(extra_z);
      }

      // Add speed limit modifier
      if (['dns', 'dts'].includes(waypoint.notification.type)) {
        extra_z = xmlDoc.createElement('openrally:dz');
        extra_z.removeAttribute('time');
        extensions.appendChild(extra_z);
      }

      // Remove time from dt when strict
      if (waypoint.notification.openrallytype == 'dt' && strict)
        notification.removeAttribute('time');
    }
    return extensions;
  },

  setWaypointXMLAttributes: function (notification, waypoint) {
    if (waypoint.notification.openRadius) {
      notification.setAttribute("open", waypoint.notification.openRadius);
    }

    if (waypoint.notification.validationRadius) {
      notification.setAttribute("clear", waypoint.notification.validationRadius);
    }

    if (waypoint.notification.time) {
      notification.setAttribute("time", waypoint.notification.time);
    }

    if (waypoint.notification.waypointNumber) {
      notification.setAttribute("name", waypoint.waypointNumber());
    }
  },

  /*
    New rally blitz and rally comp format notification
  */
  buildNameString: function (count, waypoint) {
    var string;
    if (waypoint.notification) {
      var type = waypoint.notification.type
      type = (type == "wpm" ? type + count : type).toUpperCase();
      var dist = type == "wpm" ? ":" + waypoint.kmFromStart().toFixed(2) : "";
      var validationRadius = waypoint.notification.validationRadius ? ":" + waypoint.notification.validationRadius : ""
      string = type + validationRadius + dist;
    } else {
      string = count;
    }
    return string;
  },
  /*
    legacy rally blitz notification
  */
  buildDescString: function (count, waypoint) {
    var string = "";
    if (waypoint.notification) {
      var type = waypoint.notification.type
      // TODO Speed Zone
      string = (type == "wpm" ? "WP" + count : (type == "wps" ? "!!!" : (type == "dsz" ? "SZ" + waypoint.notification.validationRadius : "")));
    }
    return string;
  },

  importGPXTracks: function (tracks) {
    if (tracks.length > 0) {
      var tracks = this.processGpxTracksForImport(tracks);

      for (var i = 0; i < tracks.length; i++) {

        var latLng = new google.maps.LatLng(tracks[i].lat, tracks[i].lng);
        // TODO abstract this to the app
        app.mapController.addRoutePoint(latLng);
      }

      var latLng = new google.maps.LatLng(tracks[0].lat, tracks[0].lng);
      app.mapController.setMapCenter(latLng);
      app.mapController.setMapZoom(14);
    }
  },


  importGPXWaypoints: function (waypoints) {
    //logic to import into roadbook
    if (waypoints.length > 0) {
      for (waypoint of waypoints) {
        var index = this.waypointSharesTrackpoint(waypoint);

        if (index == -1) {
          var latLng = new google.maps.LatLng($(waypoint).attr('lat'), $(waypoint).attr('lon'));
          index = app.mapController.insertLatLngIntoRoute(latLng);
        }

        if (index !== undefined) {
          this.addWaypoint(app.mapModel.markers[index]);
        }
      }
    }
  },


  parseGpxTracksToArray: function (gpxTracks) {
    var tracks = []
    for (var i = 0; i < gpxTracks.length; i++) {
      var point = { lat: parseFloat($(gpxTracks[i]).attr('lat')), lng: parseFloat($(gpxTracks[i]).attr('lon')) }
      tracks.push(point);
    }
    return tracks;
  },

  processGpxTracksForImport: function (tracks) {
    this.tracks = this.parseGpxTracksToArray(tracks);
    var simplify = new Simplify();
    this.tracks = simplify.simplifyDouglasPeucker(this.tracks, 7e-9);
    return this.tracks;
  },

  /*
    try to think of a more efficient way to do this
  */
  waypointSharesTrackpoint: function (waypoint) {
    var tracks = this.tracks;
    var index = -1;
    for (var i = 0; i < tracks.length; i++) {
      if (tracks[i].lat == parseFloat($(waypoint).attr('lat')) && tracks[i].lng == parseFloat($(waypoint).attr('lon'))) {
        index = i;
        break;
      }
    }

    return index;
  },

  prettyPrintXML: function (xml) {
    let formatted = '', indent = '';
    const tab = '  '; // 2 spaces for indentation
    xml.split(/>\s*</).forEach(node => {
      if (node.startsWith("<?xml")) {
        formatted += `${node}>\n`;
        return;
      }
      if (node.match(/^\/\w/)) indent = indent.slice(tab.length); // Decrease indent for closing tags
      formatted += `${indent}<${node}>\n`;
      if (node.match(/^<?\w[^>]*[^\/]$/)) indent += tab; // Increase indent for opening tags
    });
    return formatted.slice(0, -2); // Remove trailing newline
  },

  // Rally Navigator 2 import
  importRN(data) {
    const rnr = JSON.parse(data);
    if (rnr.route.name)
      app.roadbook.name(rnr.route.name)
    if (rnr.route.description)
      app.roadbook.desc(rnr.route.description)
    var instructionIdx = 0;
    var lastTrackType = 'track';
    this._rn_CalcExitEndPoints(rnr.route);
    rnr.route.waypoints.forEach(waypoint => {
      // Create map point
      var latLng = new google.maps.LatLng(waypoint.lat, waypoint.lon);
      app.mapController.addRoutePoint(latLng);
      if (!waypoint.show) return;
      console.log("Processing instruction ", instructionIdx + 1)
      this.addWaypoint(app.mapModel.markers[waypoint.waypointid]);
      // Notification
      if (waypoint.waypointIcon) {

        const n = {
          type: this._rn_WaypointMap(waypoint.waypointIcon.type),
          openRadius: waypoint.waypointIcon.options.open ?? null,
          validationRadius: waypoint.waypointIcon.options.clear ?? null,
          time: waypoint.waypointIcon.options.time ?? null
        }
        app.roadbook.instructions()[instructionIdx].manageWaypoint(n);
      }
      // Heading and coordinates visibility
      app.roadbook.instructions()[instructionIdx].showHeading(waypoint.showHeading);
      app.roadbook.instructions()[instructionIdx].showCoordinates(waypoint.showCoordinates);
      app.roadbook.instructions()[instructionIdx].tulip.clear();
      // Import Tulip elements
      waypoint.tulip.elements.forEach(tulipElement => {
        switch (tulipElement.type) {
          case "Track":
            // Set defaults
            console.log("Adding track. In handles", tulipElement.roadIn.handles.length, ", Out handles", tulipElement.roadOut.handles.length)
            if (!tulipElement.roadOut.start)
              tulipElement.roadOut.start = { "x": 90, "y": 90 };
            if (!tulipElement.roadOut.end)
              tulipElement.roadOut.end = { "x": 0, "y": -70 };
            if (!tulipElement.roadIn.end)
              tulipElement.roadIn.end = { "x": 0, "y": 40 };

            tulipElement.roadIn.start = tulipElement.roadOut.start;

            var entry = {
              path: this._rn_generateTrackPath(tulipElement.roadIn, true)
            };
            var exit = {
              path: this._rn_generateTrackPath(tulipElement.roadOut)
            };
            // Entry
            if (tulipElement.roadIn.typeId)
              lastTrackType = this._rn_getTrackType(tulipElement.roadIn.typeId);
            app.roadbook.instructions()[instructionIdx].tulip.buildEntryTrackFromJson(entry, lastTrackType);
            app.roadbook.instructions()[instructionIdx].entryTrackType = lastTrackType;
            // Exit
            if (tulipElement.roadOut.typeId)
              lastTrackType = this._rn_getTrackType(tulipElement.roadOut.typeId);
            app.roadbook.instructions()[instructionIdx].tulip.buildExitTrackFromJson(exit, lastTrackType);
            app.roadbook.instructions()[instructionIdx].exitTrackType = lastTrackType;
            app.roadbook.instructions()[instructionIdx].tulip.exitTrackEdited = (tulipElement.roadOut.edited);
            break;
          case "Road":
            if (!tulipElement.start)
              tulipElement.start = { "x": 90, "y": 90 };
            else {
              const oldStart = { ...tulipElement.start };
              tulipElement.start.x += 100;
              tulipElement.start.y += 85;
              tulipElement.end = {
                x: tulipElement.end.x - oldStart.x,
                y: tulipElement.end.y - oldStart.y
              };

              tulipElement.handles = tulipElement.handles.map(h => ({
                x: h.x - oldStart.x,
                y: h.y - oldStart.y
              }));
            }
            // Added tracks
            var track = [{
              path: this._rn_generateTrackPath(tulipElement),
              type: this._rn_getTrackType(tulipElement.typeId)
            }]
            app.roadbook.instructions()[instructionIdx].tulip.buildAddedTracksFromJson(track);
            break;
          case "Line":
            app.roadbook.instructions()[instructionIdx].tulip.canvas.add(this._rn_createFabricPath(tulipElement));
            break;
          case "Icon":
            const glyph = this.findByRnid(app.glyphStructure, tulipElement.id);
            if (glyph)  // Add glyph. Left is scaled down to match width
              app.roadbook.instructions()[instructionIdx].tulip.addGlyph({ left: tulipElement.x * 180 / 200, top: tulipElement.y }, glyph.src, tulipElement.w);
            break;
          default:
            break;
        }
      });
      instructionIdx++;

    });
    app.mapModel.updateRoadbookAndInstructions();
  },

  _rn_getTrackType(id) {
    const rnmap = {
      15: 'lowVisTrack',
      16: 'offPiste',
      4: 'smallTrack',
      17: 'track',
      18: 'tarmacRoad',
      12: 'dcw'
    }
    return rnmap[id] ?? 'track';
  },

  /**
 * Modifies the route object in place to add 'end' coordinates to roadOut.
 * @param {Object} route - The main route object containing waypoints.
 */
  _rn_CalcExitEndPoints(route) {
    const DISTANCE = 54;
    const waypoints = route.waypoints;

    if (!waypoints || waypoints.length < 2) return;

    // Helper to get absolute bearing between two points
    const getBearing = (p1, p2) => {
      const latRad = p1.lat * (Math.PI / 180);
      const dLat = p2.lat - p1.lat;
      const dLon = (p2.lon - p1.lon) * Math.cos(latRad);
      return Math.atan2(dLon, dLat);
    };

    for (let i = 0; i < waypoints.length - 1; i++) {
      const curr = waypoints[i];
      const next = waypoints[i + 1];
      let relativeAngle;

      if (i === 0) {
        // First waypoint: No previous point, so we use absolute bearing to next
        relativeAngle = 0; // Or getBearing(curr, next) if you want it relative to North
      } else {
        // Standard waypoints: Difference between entry and exit
        const prev = waypoints[i - 1];
        const entryBearing = getBearing(prev, curr);
        const exitBearing = getBearing(curr, next);
        relativeAngle = exitBearing - entryBearing;
      }

      // Calculate integer coordinates
      const endX = Math.round(DISTANCE * Math.sin(relativeAngle));
      const endY = Math.round(-(DISTANCE * Math.cos(relativeAngle)));

      // Inject 'end' into the roadOut object
      const index = curr.tulip.elements.findIndex(item => item.type === "Track");
      const roadOut = curr.tulip?.elements?.[index]?.roadOut;
      roadOut.edited = (roadOut.end !== undefined) || roadOut.handles.length > 0;
      if (roadOut && !roadOut.end) {
        roadOut.end = {
          x: endX,
          y: endY
        };
      }
    }
  },

  _rn_generateTrackPath(data, reverse = false) {
    let { start, handles, end } = data;

    // 1. Handle Reversal Logic
    if (reverse) {
      const absoluteEnd = { x: start.x + end.x, y: start.y + end.y };
      // New handles relative to the new start (the old absolute end)
      const reversedHandles = handles.map(h => ({
        x: (start.x + h.x) - absoluteEnd.x,
        y: (start.y + h.y) - absoluteEnd.y
      })).reverse();

      const reversedEnd = {
        x: start.x - absoluteEnd.x,
        y: start.y - absoluteEnd.y
      };

      start = absoluteEnd;
      handles = reversedHandles;
      end = reversedEnd;
    }

    // 2. Convert to absolute coordinates for calculation
    const pStart = { x: start.x, y: start.y };
    const pEnd = { x: start.x + end.x, y: start.y + end.y };
    let points = [pStart];

    // 3. Coordinate Distribution Logic
    if (!handles || handles.length === 0) {
      // 0 Handles: Linear distribution at 33% and 66%
      points.push({ x: pStart.x + (pEnd.x - pStart.x) * 0.33, y: pStart.y + (pEnd.y - pStart.y) * 0.33 });
      points.push({ x: pStart.x + (pEnd.x - pStart.x) * 0.66, y: pStart.y + (pEnd.y - pStart.y) * 0.66 });
      points.push(pEnd);
    }
    else if (handles.length === 1) {
      // 1 Handle: Place handle at 50%, add points at 25% and 75%
      const h1 = { x: start.x + handles[0].x, y: start.y + handles[0].y };
      points = [
        pStart,
        { x: pStart.x + (h1.x - pStart.x) * 0.5, y: pStart.y + (h1.y - pStart.y) * 0.5 }, // 25% mark
        h1,                                                                          // 50% mark
        { x: h1.x + (pEnd.x - h1.x) * 0.5, y: h1.y + (pEnd.y - h1.y) * 0.5 },         // 75% mark
        pEnd
      ];
      points = [
        pStart,
        { x: pStart.x + (h1.x - pStart.x) * 0.7, y: pStart.y + (h1.y - pStart.y) * 0.7 },
        { x: h1.x + (pEnd.x - h1.x) * 0.3, y: h1.y + (pEnd.y - h1.y) * 0.3 },
        pEnd
      ];
    }
    else {
      // 2+ Handles: Use Start, H1, H2, End
      points.push({ x: start.x + handles[0].x, y: start.y + handles[0].y });
      points.push({ x: start.x + handles[1].x, y: start.y + handles[1].y });
      points.push(pEnd);
    }

    // 4. Generate the [M, C, C, C] Array
    const pathArray = [['M', points[0].x, points[0].y]];
    const tension = 0.9;

    for (let i = 0; i < 3; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
      const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
      const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
      const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

      pathArray.push(['C', cp1x, cp1y, cp2x, cp2y, p2.x, p2.y]);
    }

    return pathArray;
  },

  /**
   * Converts custom Line objects into Fabric.js Path instances.
   * @param {Object} data - The custom object containing path and styles.
   * @returns {fabric.Path}
   */
  _rn_createFabricPath(data) {
    // 1. Transform nested arrays into the format Fabric expects: 
    // e.g., [['M', 10, 20], ['L', 30, 40]]
    // Since your input is already in this structure, we just ensure it's a clean copy.
    const pathData = data.path;

    // 2. Map custom properties to Fabric-specific properties
    let options = {
      ...data,
      fill: data.fill === 'transparent' ? '' : data.fill,
      originX: !data.left ? 'left' : 'center',
      originY: !data.top ? 'top' : 'center',
      pathOffset: (!data.left && !data.top) ? undefined : data.pathOffset,
      left: data.left || data.pathOffset?.x || 0,
      top: data.top || data.pathOffset?.y || 0,
    };
    // Ensure the path stays exactly where coordinates say it should be
    var line = new fabric.Path(pathData, options);
    return line;
  },

  findByRnid(data, id) {
    // Check if current level is what we want
    if (data && data.rnid === id) return data;

    // If it's an array, iterate through it
    if (Array.isArray(data)) {
      for (let item of data) {
        let result = this.findByRnid(item, id);
        if (result) return result;
      }
    }
    // If it's an object, check all keys (like 'tabs' or 'items')
    else if (data !== null && typeof data === 'object') {
      for (let key of Object.keys(data)) {
        let result = this.findByRnid(data[key], id);
        if (result) return result;
      }
    }
    return null;
  },

  _rn_WaypointMap(rnType) {
    const map = {
      'dz': 'dsz',
      'fz': 'fsz',
      'sn': 'dn',
      'ass': 'fss'
    }
    return map[rnType] || rnType;
  }
});
