/*
  Creates a tulip canvas object from either UI interaction or the loading of a saved file
*/
fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

var Tulip = Class({

  create: function(el, angle, trackTypes, json){
    this.canvas = new fabric.Canvas(el);
    this.canvas.selection = false;
    this.canvas.hoverCursor = 'pointer';

    // TODO is this a good thing or a hack?
    var _this = this;
    this.canvas.on('object:moving',function(e){
      // NOTE I do not like this dependency
      if(e.target.editor){
        if(e.target.editor.track instanceof ExitTrack && !_this.exitTrackEdited){
          _this.exitTrackEdited = true;
        }
        e.target.editor.pointMoving(e.target);
      }
    });

    this.tracks = [];
    this.glyphs = [];
    this.activeEditors = [];
    this.activeRemovers = [];
    this.addedTrackType = 'track';
    this.exitTrackEdited = false;
    this.initTulip(angle, trackTypes, json);
  },

  clear: function(){
    this.canvas.clear();
    this.entryTrack = null;
    this.entryTrackOrigin = null;
    this.exitTrack = null;
    this.exitTrackEnd = null;
  },

  /*
    Creates a tulip either from passed in json from a file load or from a angle provided by UI wpt creation
  */
  initTulip: function(angle, trackTypes,json){
    if(json !== undefined && angle == undefined){ //the map point has been created from serialized json
      this.buildFromJson(json);
    } else if(angle !== undefined && trackTypes !== undefined){
      this.initEntry(trackTypes.entryTrackType);
      this.initExit(angle,trackTypes.exitTrackType);
    }
  },

  // initEntry: function(point, path){
  initEntry: function(trackType){
    this.entryTrack = new EntryTrack(trackType, this.canvas);
  },

  // initExit: function(point, path){
  initExit: function(angle, trackType){
    this.exitTrack = new ExitTrack(angle, trackType, this.canvas);
  },

  initTracks: function(trackArray){
    // this.tracks = trackArray;
    for(i=0;i<trackArray.length;i++){
      // Track.disableDefaults(null,this.tracks[i])
      console.log(trackArray[i]);
      this.tracks.push(new AddedTrack(null,null,null,{track: [trackArray[i]]}))
    }
  },

  /*
    Adds a track to tulip from UI interaction
  */
  addTrack: function(angle) {
    this.finishRemove();
    var track = new AddedTrack(angle, this.addedTrackType, this.canvas)
    this.tracks.push(track);

    //NOTE this solves the problem of having overlapping handles if a control is clicked twice or things get too close to one another.
    //     an alternate solution that may solve any performance issues this might cause is to loop through the active editors and bring all the
    //     hangles to the front.
    this.finishEdit();
    this.beginEdit();
  },

  addGlyph: function(position,uri){
    this.finishRemove();
    var _this = this;
    var position = position;
    var imgObj = new Image();
    imgObj.src = uri;
    imgObj.onload = function () {
      var image = new fabric.Image(imgObj);
      image.top = position.top;
      image.left = position.left;
      image.scaleToWidth(75);
      _this.canvas.add(image);
      _this.glyphs.push(image);
    }
  },
  /*
    Builds the tulip from passed in JSON
  */
  // NOTE this is going to have to handle legacy data structure and translate it into new style
  buildFromJson: function(json){

    this.exitTrackUneditedPath = json.exitTrackUneditedPath !== undefined ? json.exitTrackUneditedPath : true;
    var _this = this;
    var numTracks = json.tracks.length;
    // build a propperly formatted json string to import

    var json = {
      "objects": [json.entry.point, json.entry.path, json.exit.path, json.exit.point].concat(json.tracks).concat(json.glyphs.reverse()),
    };
    var obs = [];

    this.canvas.loadFromJSON(json, this.canvas.renderAll.bind(this.canvas), function(o, object) {
      obs.push(object);
      if(object.type == "image"){
          //if the object is an image add it to the glyphs array
          _this.glyphs.push(object);
      }
    });

    // TODO because the below are each requiring their own comment section means they could refactor into their own functions
    /*
      Default Tracks
      // NOTE this will handle legacy track structure but they need to be converted
    */
    // TODO check to see if we have an entry track and if it's a group.
    if(obs[1].type == "path" && obs[0].type == "circle" && obs[3].type == "triangle" && obs[2].type == "path"){
      console.log("old style");
      // TODO move this to track object
      var objects = {origin: obs[0], paths: [obs[1]]};
      this.entryTrack = new EntryTrack(null,null,objects);


      var objects = {end: obs[3], paths: [obs[2]]};
      this.exitTrack = new ExitTrack(null,null,null,objects);
      /*
        Aux tracks
      */
      // slice and dice obs
      if(numTracks > 0){
        var tracks = obs.slice(4, 4 + numTracks);
        this.initTracks(tracks);
      }
    }else {
      console.log("new style");
    }
  },

  beginEdit: function() {
    this.activeEditors.push(new EntryTrackEditor(this.canvas, this.entryTrack));
    this.activeEditors.push(new ExitTrackEditor(this.canvas, this.exitTrack));
    for(i=0;i<this.tracks.length;i++){
      this.activeEditors.push(new AddedTrackEditor(this.canvas, this.tracks[i]));
    }
  },

  beginRemoveGlyph: function(){
    this.finishEdit();
    for(i=0;i<this.glyphs.length;i++){
      this.activeRemovers.push(new GlyphRemover(this, this.glyphs[i],i));
    }
  },

  beginRemoveTrack: function(){
    this.finishEdit();
    for(i=0;i<this.tracks.length;i++){
      this.activeRemovers.push(new TrackRemover(this, this.tracks[i],i));
    }
  },

  changeAddedTrackType(type){
    this.addedTrackType = type
  },

  changeEntryTrackType(type){
    this.finishEdit();
    this.entryTrack.changeType(type,this.canvas);
    this.beginEdit()
  },

  changeExitTrackType(type){
    this.finishEdit();
    this.exitTrack.changeType(type,this.canvas);
    this.beginEdit()
  },

  changeExitAngle(angle,exitTrackType){
    if(!this.exitTrackEdited){
      this.exitTrack.changeAngle(angle,exitTrackType,this.canvas);
      if(this.activeEditors.length){
        this.finishEdit();
        this.beginEdit();
      }
    }
  },

  finishEdit: function() {
    for(var i = 0; i < this.activeEditors.length; i++) {
      this.activeEditors[i].destroy();
    }
    this.activeEditors = [];
    // remove controls from glyphs and update the canvas' visual state
    this.canvas.deactivateAll().renderAll();
  },

  finishRemove: function(){
    for(var i = 0;i <this.activeRemovers.length;i++){
      this.activeRemovers[i].destroy();
    }
    // remove controls from glyphs and update the canvas' visual state
    this.canvas.deactivateAll().renderAll();
  },

  redrawExitAndEditor(angle,exitTrackType){
    this.activeEditors[1].destroy();
    this.redrawExit(angle,exitTrackType)
    this.activeEditors.splice(1,0,(new TrackEditor(this.canvas, this.exitTrack ,false, true, true)));
  },

  removeLastGlyph: function(){
    var glyph = this.glyphs.pop()
    this.canvas.remove(glyph);
  },

  removeLastTrack: function(){
    var track = this.tracks.pop()
    for(i = 0; i < track.paths.length; i++) {
      this.canvas.remove(track.paths[i]);
    }
    for(i = 0; i < this.activeEditors.length; i++) {
      if(this.activeEditors[i].track == track){
        this.activeEditors[i].destroy();
      }
    }
  },

  /*
    return the canvas object as JSON so it can be persisted
  */
  serialize: function(){
    var json = {
      entry: {
        object: this.entryTrack
      },
      exitTrackUnedited: this.exitTrackUnedited,
      exit: {
        object: this.exitTrack
      },
      tracks: this.tracks,
      glyphs: this.serializeGlyphs(),
    };
    return json;
  },

  serializeGlyphs: function(){
    var glyphsJson = [];
    // NOTE not sure, but again here the for loop doesn't error out like the for each
    for(glyph of this.glyphs) {
      var json = glyph.toJSON()
      json.src = this.truncateGlyphSource(json.src);
      glyphsJson.push(json);
    }
    return glyphsJson;
  },

  toPNG: function(){
    return this.canvas.toDataURL('image/png',1);
  },

  truncateGlyphSource: function(src){
    var index = src.lastIndexOf("assets/svg/glyphs");
    return "./" + src.slice(index);
  }

});
