/*
  Creates a tulip canvas object from either UI interaction or the loading of a saved file
  // TODO seperate into tulip model and tulip controller to seperate UI interaction from state the tulip canvas would be the view
*/
fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

var Tulip = Class({

  create: function (el, angle, trackTypes, json) {
    this.canvas = new fabric.Canvas(el);
    this.canvas.selection = false;
    this.canvas.hoverCursor = 'pointer';
    this.selectedTrackId = null;
    this.canvas.preserveObjectStacking = true;

    var _this = this;
    this.canvas.on('object:moving', function (e) {
      // NOTE I do not like this dependency
      if (e.target.editor) {
        if (e.target.editor.track instanceof ExitTrack && !_this.exitTrackEdited) {
          _this.exitTrackEdited = true;
        }
        e.target.editor.pointMoving(e.target);
      }
    });

    this.tracks = [];
    this.glyphs = [];
    this.activeEditors = [];
    this.addedTrackType = 'track';
    // TODO should this be checking JSON for this?
    this.exitTrackEdited = false;
    this.mainTrackColor = '#22F';
    this.markerAngle = 45;
    this.initTulip(angle, trackTypes, json);
  },

  clear: function () {
    this.canvas.clear();
    this.entryTrack = null;
    this.entryTrackOrigin = null;
    this.exitTrack = null;
    this.exitTrackEnd = null;
  },

  /*
    Creates a tulip either from passed in json from a file load or from a angle provided by UI wpt creation
  */
  initTulip: function (angle, trackTypes, json) {
    if (json !== undefined && angle == undefined) { //the map point has been created from serialized json
      if (json.markerAngle)
        this.markerAngle = json.markerAngle;
      this.buildFromJson(json, trackTypes);
    } else if (angle !== undefined && trackTypes !== undefined) {
      this.initEntry(trackTypes.entryTrackType);
      this.initExit(angle, trackTypes.exitTrackType);
      // Add km marker
      this.addKmMarker(this.markerAngle);
    }

    this.canvas.on('mouse:down', (options) => {
      if (options.target && options.target.type && options.target.type == "path" && options.target.selectable) {
        this.addTrackHandles(options);
        this.selectedTrackId = options.target.id;
      }
      if (options.target === undefined) {
        this.selectedTrackId = null;
        this.removeTrackHandles();
      }
    });
  },

  initEntry: function (trackType) {
    this.entryTrack = new EntryTrack(trackType, this.canvas);
  },

  initExit: function (angle, trackType) {
    this.exitTrack = new ExitTrack(angle, trackType, this.canvas);
  },

  initTracks: function (trackArray) {
    for (var i = 0; i < trackArray.length; i++) {
      this.tracks.push(new AddedTrack(null, null, null, { track: [trackArray[i]] }))
    }
  },

  /*
    Adds a track to tulip from UI interaction
  */
  addTrack: function (angle) {
    this.finishRemove();
    var track = new AddedTrack(angle, this.addedTrackType, this.canvas)
    // track.paths[0].on('mousedown', function(e) {
    //   console.log('Clicked on path!', e);
    // });
    this.tracks.push(track);

    //NOTE this solves the problem of having overlapping handles if a control is clicked twice or things get too close to one another.
    //     an alternate solution that may solve any performance issues this might cause is to loop through the active editors and bring all the
    //     handles to the front.
    this.finishEdit();
    this.beginEdit();
  },

  addGlyph: function (position, uri) {
    this.finishRemove();
    var _this = this;
    var position = position;
    var imgObj = new Image();
    imgObj.src = uri;
    imgObj.onload = function () {
      var image = new fabric.Image(imgObj);
      image.top = position.top;
      image.left = position.left;
      image.scaleToHeight(50);
      image.id = globalNode.randomUUID();
      const idx = _this.canvas.add(image);
      image.idx = idx._objects.length;
      _this.glyphs.push(image);
      app.roadbook.currentlyEditingInstruction.parseGlyphInfo(); // TODO: this must be handled by instruction
    }
  },
  /*
    Builds the tulip from passed in JSON
  */
  // NOTE this is going to have to handle legacy data structure and translate it into new style
  buildFromJson: function (json, trackTypes) {
    this.exitTrackEdited = json.exitTrackEdited !== undefined ? json.exitTrackEdited : false;
    var _this = this;
    var numTracks = json.tracks.length;
    /*
      Default Tracks
      // NOTE this will handle legacy track structure but they need to be converted
    */
    if (json.entry.path && json.exit.path) {
      console.log("old style");
      // build a propperly formatted json string to import
      var json = {
        "objects": [json.entry.point, json.entry.path, json.exit.path, json.exit.point].concat(json.tracks).concat(json.glyphs.reverse()),
      };
      var obs = [];
      this.canvas.loadFromJSON(json, this.canvas.renderAll.bind(this.canvas), function (o, object) {
        obs.push(object);
        if (object.type == "image") {
          //if the object is an image add it to the glyphs array
          _this.glyphs.push(object);
        }
      });
      var objects = { origin: obs[0], paths: [obs[1]] };
      this.entryTrack = new EntryTrack(null, null, objects);

      var objects = { end: obs[3], paths: [obs[2]] };
      this.exitTrack = new ExitTrack(null, null, null, objects);
      /*
        Aux tracks
      */
      // slice and dice obs
      if (numTracks > 0) {
        var tracks = obs.slice(4, 4 + numTracks);
        this.initTracks(tracks);
      }
    } else {
      // we load the glyphs from JSON to avoid race conditions with asyncronius image loading
      this.canvas.loadFromJSON({ "objects": json.glyphs.reverse() }, function () {
        _this.canvas.renderAll();
        //render the canvas then load the tracks after all images have loaded to make sure things render nice
        _this.buildEntryTrackFromJson(json.entry, trackTypes.entryTrackType);
        _this.buildExitTrackFromJson(json.exit, trackTypes.exitTrackType);
        _this.buildAddedTracksFromJson(json.tracks);
        _this.canvas.forEachObject((object, index, array) => {
          if (object.idx)
            _this.canvas.moveTo(object, object.idx)
        })
        _this.addKmMarker(_this.markerAngle);
      }, function (o, object) {
        object.selectable = false;
        if (object.id === undefined)
          object.id = globalNode.randomUUID();
        if (object.type == "TextElement") {
          //if the object is an image add it to the glyphs array
          _this.glyphs.push(object);
        }
        if (object.type == "image") {
          //if the object is an image add it to the glyphs array
          _this.glyphs.push(object);

          fabric.util.loadImage(object.src, function (img, isError) {
            if (isError || !img) {
              console.error(`Failed to load image: ${object.src}`);
              // Fallback: Set a default image source
              remmapedSrc = _this.remapOldGlyphs(object.src);
              if (remmapedSrc === false) {
                remmapedSrc = './assets/svg/glyphs/missing-glyph.svg';
              }
              object.setSrc(remmapedSrc, function () {
                // _this.canvas.renderAll();
              }, { crossOrigin: 'anonymous' });
            }
          }, null, 'anonymous');
        }
        _this.canvas.renderAll();
      });
    }
  },

  // TODO: This needs to move to a common place
  remapOldGlyphs(oldPath) {
    // This function remaps old glyph paths to new ones in the roadbook instructions
    glyphMappings = {
      "./assets/svg/glyphs/bridge.svg": "./assets/svg/glyphs/under-bridge.svg",
      "./assets/svg/glyphs/bad.svg": "./assets/svg/glyphs/abbr-MVS.svg",
      "./assets/svg/glyphs/finish-of-selective-section.svg": "./assets/svg/glyphs/abbr-ASS.svg",
      "./assets/svg/glyphs/start-of-selective-section.svg": "./assets/svg/glyphs/abbr-DSS.svg",
      "./assets/svg/glyphs/dune-L1.svg": "./assets/svg/glyphs/abbr-L1.svg",
      "./assets/svg/glyphs/dune-L2.svg": "./assets/svg/glyphs/abbr-L2.svg",
      "./assets/svg/glyphs/dune-L3.svg": "./assets/svg/glyphs/abbr-L3.svg",
      "./assets/svg/glyphs/abbr-dune.svg": "./assets/svg/glyphs/abbr-DN.svg",
      "./assets/svg/glyphs/always.svg": "./assets/svg/glyphs/abbr-TJS.svg",
      "./assets/svg/glyphs/collapsed.svg": "./assets/svg/glyphs/abbr-EFF.svg",
      "./assets/svg/glyphs/gravel.svg": "./assets/svg/glyphs/abbr-GV.svg",
      "./assets/svg/glyphs/imperative.svg": "./assets/svg/glyphs/abbr-IMP.svg",
      "./assets/svg/glyphs/main-track.svg": "./assets/svg/glyphs/abbr-PP.svg",
      "./assets/svg/glyphs/many.svg": "./assets/svg/glyphs/abbr-NBX.svg",
      "./assets/svg/glyphs/off-track.svg": "./assets/svg/glyphs/abbr-HP.svg",
      "./assets/svg/glyphs/parallel-tracks.svg": "./assets/svg/glyphs/abbr-.svg",
      "./assets/svg/glyphs/road.svg": "./assets/svg/glyphs/abbr-RO.svg",
      "./assets/svg/glyphs/rut.svg": "./assets/svg/glyphs/abbr-ORN.svg",
      "./assets/svg/glyphs/sand.svg": "./assets/svg/glyphs/abbr-SA.svg",
      "./assets/svg/glyphs/small-dune.svg": "./assets/svg/glyphs/abbr-DNT.svg",
      "./assets/svg/glyphs/stone.svg": "./assets/svg/glyphs/abbr-CX.svg",
      "./assets/svg/glyphs/vegetation.svg": "./assets/svg/glyphs/abbr-CX.svg",
      "./assets/svg/glyphs/track.svg": "./assets/svg/glyphs/abbr-P.svg",
    }
    return glyphMappings[oldPath] || false;
  },

  buildEntryTrackFromJson(entry, entryTrackType) {
    entry.paths = entry.paths.map(obj => {
      if (obj.stroke === '#000') {
        return { ...obj, stroke: this.mainTrackColor };
      }
      return obj;
    });
    entry.point.stroke = this.mainTrackColor;
    entry.point.fill = this.mainTrackColor;
    entry.point.selectable = false;
    var paths = this.buildPaths(entry.paths);
    var point = new fabric.Circle(entry.point);
    this.canvas.add(point);
    this.entryTrack = new EntryTrack(entryTrackType, null, { origin: point, paths: paths });
  },

  buildExitTrackFromJson(exit, exitTrackType) {
    exit.paths = exit.paths.map(obj => {
      if (obj.stroke === '#000') {
        return { ...obj, stroke: this.mainTrackColor };
      }
      return obj;
    });
    exit.point.stroke = this.mainTrackColor;
    exit.point.fill = this.mainTrackColor;
    var paths = this.buildPaths(exit.paths);
    var point = new fabric.Triangle(exit.point)
    this.canvas.add(point);
    this.exitTrack = new ExitTrack(null, exitTrackType, null, { end: point, paths: paths });
  },

  buildAddedTracksFromJson(tracks) {
    for (var i = 0; i < tracks.length; i++) {
      var paths = this.buildPaths(tracks[i].paths);
      var track = new AddedTrack(null, tracks[i].type, this.canvas, { track: paths });
      this.tracks.push(track);
    }
    this.canvas.renderAll();
  },

  buildPaths(array) {
    var paths = [];
    for (var i = 0; i < array.length; i++) {
      var path = new fabric.Path(array[i].path, array[i]);
      Track.disableDefaults(path);
      this.canvas.add(path);
      paths.push(path)
    }
    return paths;
  },

  beginEdit: function () {
    this.activeEditors.push(new EntryTrackEditor(this.canvas, this.entryTrack));
    this.activeEditors.push(new ExitTrackEditor(this.canvas, this.exitTrack));
    this.canvas.forEachObject(function (obj) {
      obj.selectable = true;
    });
  },

  removeActiveGlyph: function () {
    const activeObject = this.canvas.getActiveObject();
    var tracks = this.tracks;
    var glyphs = this.glyphs;
    if (activeObject && activeObject.id) {
      this.canvas.remove(activeObject);
      this.canvas.discardActiveObject();
      tracks.find((element, idx, arr) => {
        if (element.id == activeObject.id) {
          this.removeTrack(element)
        }
      });
      this.canvas.renderAll();
      this.glyphs = glyphs.filter(g => g.id !== activeObject.id);
      this.tracks = tracks.filter(g => g.id !== activeObject.id);
    }
  },

  sendBackwardActiveGlyph: function () {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject && activeObject.id) {
      this.canvas.sendToBack(activeObject);
      this.canvas.forEachObject((object, index, array) => {
        object.idx=index;
      })
      this.canvas.renderAll();
    }
  },
  
  bringForwardActiveGlyph: function () {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject && activeObject.id) {
      this.canvas.bringToFront(activeObject);
      this.canvas.forEachObject((object, index, array) => {
        object.idx=index;
      })
      this.canvas.renderAll();
    }
  },

  changeAddedTrackType(type) {
    this.addedTrackType = type
    if (this.selectedTrackId) {
      var track = this.tracks.find(({ id }) => id === this.selectedTrackId);
      this.finishEdit();
      track.changeType(type, this.canvas, false);
      track.type = type;
      this.canvas.renderAll();
      this.beginEdit()
    }
  },

  changeEntryTrackType(type) {
    this.finishEdit();
    this.entryTrack.changeType(type, this.canvas);
    this.beginEdit()
  },

  changeExitTrackType(type) {
    this.finishEdit();
    this.exitTrack.changeType(type, this.canvas);
    this.beginEdit()
  },

  changeExitAngle(angle, exitTrackType) {
    if (!this.exitTrackEdited && this.exitTrack) {
      this.exitTrack.changeAngle(angle, exitTrackType, this.canvas);
      if (this.activeEditors.length) {
        this.finishEdit();
        this.beginEdit();
      }
    }
  },

  finishEdit: function () {
    for (var i = 0; i < this.activeEditors.length; i++) {
      this.activeEditors[i].destroy();
    }
    delete this.entryTrack.editor
    delete this.exitTrack.editor
    for (var i = 0; i < this.tracks.length; i++) {
      delete this.tracks[i].editor
    }
    this.activeEditors = [];
    // remove controls from glyphs and update the canvas' visual state
    this.canvas.forEachObject(function (obj) {
      obj.selectable = false;
    });
    this.canvas.deactivateAllWithDispatch();
    this.selectedTrackId = null;
    this.canvas.deactivateAll().renderAll();
  },

  finishRemove: function () {
    // remove controls from glyphs and update the canvas' visual state
    this.canvas.deactivateAll().renderAll();
  },

  removeLastGlyph: function () {
    var glyph = this.glyphs.pop()
    this.canvas.remove(glyph);
  },

  removeTrack: function (track) {
    if (track) {
      for (var i = 0; i < track.paths.length; i++) {
        this.canvas.remove(track.paths[i]);
      }
      for (var i = 0; i < this.activeEditors.length; i++) {
        if (this.activeEditors[i].track == track) {
          this.activeEditors[i].destroy();
        }
      }
    }
  },

  removeLastTrack: function () {
    this.removeTrack(this.tracks.pop());
  },

  /*
    return the canvas object as JSON so it can be persisted
  */
  serialize: function () {
    var json = {
      entry: {
        point: this.entryTrack.origin,
        paths: this.entryTrack.paths
      },
      exitTrackEdited: this.exitTrackEdited,
      exit: {
        point: this.exitTrack.end,
        paths: this.exitTrack.paths,
      },
      tracks: this.serializeTracks(),
      glyphs: this.serializeGlyphs(),
      markerAngle: this.markerAngle,
    };
    return json;
  },

  serializeGlyphs: function () {
    var glyphsJson = [];
    // NOTE not sure, but again here the for loop doesn't error out like the for each
    for (glyph of this.glyphs) {
      var json = glyph.toJSON()
      if (glyph.type == 'image')
        json.src = this.truncateGlyphSource(json.src);
      json.id = glyph.id;
      json.idx = glyph.idx;
      glyphsJson.push(json);
    }
    return glyphsJson;
  },

  serializeTracks: function () {
    var tracksJson = [];
    // NOTE not sure, but again here the for loop doesn't error out like the for each
    for (track of this.tracks) {
      var json = { paths: track.paths, type: track.type, id: track.id };
      tracksJson.push(json);
    }
    return tracksJson;
  },

  toPNG: function () {
    return this.canvas.toDataURL('image/png', 1);
  },

  toSVG: function () {
    return this.canvas.toSVG();
  },

  truncateGlyphSource: function (src) {
    var index = src.lastIndexOf("assets/svg/glyphs");
    return "./" + src.slice(index);
  },

  addTrackHandles(options) {
    const target = options.target;
    if (target && target.id) {
      track = this.tracks.find(({ id }) => id === target.id);

      for (var i = 0; i < this.activeEditors.length; i++) {
        if (this.activeEditors[i] instanceof EntryTrackEditor || this.activeEditors[i] instanceof ExitTrackEditor)
          continue
        this.activeEditors[i].destroy();
        this.activeEditors.splice(i, 1);
      }

      for (var i = 0; i < this.tracks.length; i++) {
        delete this.tracks[i].editor
      }
      this.activeEditors.push(new AddedTrackEditor(this.canvas, track));
    }
  },

  removeTrackHandles(options) {
    for (var i = 0; i < this.activeEditors.length; i++) {
      if (this.activeEditors[i] instanceof EntryTrackEditor || this.activeEditors[i] instanceof ExitTrackEditor)
        continue
      this.activeEditors[i].destroy();
      this.activeEditors.splice(i, 1);
    }

    for (var i = 0; i < this.tracks.length; i++) {
      delete this.tracks[i].editor
    }
  },

  setTextStyle(style) {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject && activeObject.id && activeObject.type == 'TextElement') {
      activeObject.setTextStyle(style);
      this.canvas.renderAll();
    }
  },

  addKmMarker(angle = 45) {
    const lineLength = 20;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    var line = new fabric.Line([0, 0, lineLength, 0], {  // We'll rotate it later
      stroke: 'black',
      strokeWidth: 2,
      originX: 'center',
      originY: 'center'
    });
    var circle = new fabric.Circle({
      radius: 3,
      fill: 'black',
      originX: 'center',
      originY: 'center',
      left: lineLength,  // Positioned at the end of the line
      top: 0
    });
    var marker = new fabric.Group([line, circle], {
      left: centerX,
      top: centerY,
      originX: 'top',
      originY: 'center',
      angle: angle,  // Rotate the entire group 45 degrees
      selectable: false,   // Cannot be selected
      evented: false,      // Ignores mouse events (fully non-interactive)
      hoverCursor: 'default',
      id: "kmMarker"
    });

    // Add group to canvas
    this.canvas.add(marker);
  },

  rotateKmMarker() {
    var group = this.canvas.getObjects().find(obj => obj.id === 'kmMarker');
    if (group) {
      this.markerAngle += 90;
      if (this.markerAngle > 360) this.markerAngle -= 360;
      group.set('angle', this.markerAngle);
      this.canvas.renderAll();
    }
  }
});
