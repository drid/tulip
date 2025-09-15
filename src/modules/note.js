/*
  Creates a note canvas object from either UI interaction or the loading of a saved file
*/
fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

var Note = Class({

  create: function (el, json) {
    this.canvas = new fabric.Canvas(el);
    this.canvas.selection = false;
    this.canvas.hoverCursor = 'moveCursor';

    var _this = this;
    this.canvas.on('object:moving', function (e) {
      // NOTE I do not like this dependency
      if (e.target.editor) {
        e.target.editor.pointMoving(e.target);
      }
    });

    this.glyphs = [];
    this.activeEditors = [];
    this.initNote(json);
  },

  clear: function () {
    this.canvas.clear();
  },

  /*
    Creates a note either from passed in json from a file load or from a angle provided by UI wpt creation
  */
  initNote: function (json) {
    if (json !== undefined) { //the map point has been created from serialized json
      this.buildFromJson(json);
    }
    this.canvas.on('mouse:down', (options) => {
    });
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
    Builds the note from passed in JSON
  */
  // NOTE this is going to have to handle legacy data structure and translate it into new style
  buildFromJson: function (json) {
    var _this = this;
    // we load the glyphs from JSON to avoid race conditions with asyncronius image loading
    this.canvas.loadFromJSON({ "objects": json.glyphs.reverse() }, function () {
    _this.canvas.renderAll();
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
  },


  buildPaths(array) {
    var paths = [];
    for (var i = 0; i < array.length; i++) {
      var path = new fabric.Path(array[i].path, array[i]);
      this.canvas.add(path);
      paths.push(path)
    }
    return paths;
  },

  beginEdit: function () {
  },

  removeActiveGlyph: function () {
    const activeObject = this.canvas.getActiveObject();
    var glyphs = this.glyphs;
    if (activeObject && activeObject.id) {
      this.canvas.remove(activeObject);
      this.canvas.discardActiveObject();
      this.canvas.renderAll();
      this.glyphs = glyphs.filter(g => g.id !== activeObject.id);
    }
  },

  finishEdit: function () {
    for (var i = 0; i < this.activeEditors.length; i++) {
      this.activeEditors[i].destroy();
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

  /*
    return the canvas object as JSON so it can be persisted
  */
  serialize: function () {
    var json = {
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

});
