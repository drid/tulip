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
      this.buildFromJson(json);
    } else if (angle !== undefined && trackTypes !== undefined) {
      this.initEntry(trackTypes.entryTrackType);
      this.initExit(angle, trackTypes.exitTrackType);
    }
    this.canvas.on('mouse:down', (options) => {
      if (options.target && options.target.type && options.target.type == "path")
        this.addTrackHandles(options)
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
      image.scaleToHeight(75);
      image.id = globalNode.randomUUID();
      _this.canvas.add(image);
      _this.glyphs.push(image);
    }
  },
  /*
    Builds the tulip from passed in JSON
  */
  // NOTE this is going to have to handle legacy data structure and translate it into new style
  buildFromJson: function (json) {
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
        _this.buildEntryTrackFromJson(json.entry);
        _this.buildExitTrackFromJson(json.exit);
        _this.buildAddedTracksFromJson(json.tracks);
      }, function (o, object) {
        if (object.type == "image") {
          //if the object is an image add it to the glyphs array
          object.id = globalNode.randomUUID();
          _this.glyphs.push(object);

          fabric.util.loadImage(object.src, function(img, isError) {
            if (isError || !img) {
              console.error(`Failed to load image: ${object.src}`);
              // Fallback: Set a default image source
              object.setSrc('./assets/svg/glyphs/missing-glyph.svg', function() {
                _this.canvas.renderAll();
              }, { crossOrigin: 'anonymous' });
            }
          }, null, 'anonymous');
        }
      });
    }
  },

  buildEntryTrackFromJson(entry) {
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
    this.entryTrack = new EntryTrack(null, null, { origin: point, paths: paths });
  },

  buildExitTrackFromJson(exit) {
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
    this.exitTrack = new ExitTrack(null, null, null, { end: point, paths: paths });
  },

  buildAddedTracksFromJson(tracks) {
    for (var i = 0; i < tracks.length; i++) {
      var paths = this.buildPaths(tracks[i].paths);
      var track = new AddedTrack(null, null, this.canvas, { track: paths });
      this.tracks.push(track);
    }
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

  changeAddedTrackType(type) {
    this.addedTrackType = type
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
    };
    return json;
  },

  serializeGlyphs: function () {
    var glyphsJson = [];
    // NOTE not sure, but again here the for loop doesn't error out like the for each
    for (glyph of this.glyphs) {
      var json = glyph.toJSON()
      json.src = this.truncateGlyphSource(json.src);
      glyphsJson.push(json);
    }
    return glyphsJson;
  },

  serializeTracks: function () {
    var tracksJson = [];
    // NOTE not sure, but again here the for loop doesn't error out like the for each
    for (track of this.tracks) {
      var json = { paths: track.paths };
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
  }
});
