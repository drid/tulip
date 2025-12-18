/*
  Creates a note canvas object from either UI interaction or the loading of a saved file
*/
fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

var Note = Class({

  create: function (el, json) {
    this.canvas = new fabric.Canvas(el);
    this.canvas.selection = false;
    this.canvas.hoverCursor = 'pointer';

    this.setupEventListeners();

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
      if (json.htmlText != '') {
        // Migrate old html format
        this.buildFromHtml(json.htmlText);
        this.finishEdit();
      } else {
        this.buildFromJson(json);
      }
    }
    this.canvas.on('mouse:down', (options) => {
    });
  },

  setupEventListeners() {
    var _this = this;
    this.canvas.on('object:moving', function (e) {
      // NOTE I do not like this dependency
      if (e.target.editor) {
        e.target.editor.pointMoving(e.target);
      }
    });
    this.canvas.on('path:created', function (options) {
      options.path.set({
        fill: options.path.canvas.freeDrawingBrush.fill,
        strokeLineJoin: 'round',
        strokeLineCap: 'round'
      });
      options.path.canvas.renderAll();

      options.path.id = 'draw_' + globalNode.randomUUID();
      _this.glyphs.push(options.path);
    });
  },

  addGlyph: function (position, uri, vsize=50) {
    this.finishRemove();
    var _this = this;
    var position = position;
    var imgObj = new Image();
    imgObj.src = uri;
    imgObj.onload = function () {
              var image = new fabric.Image(imgObj);
              image.top = position.top;
              image.left = position.left;
              image.scaleToHeight(vsize);
              image.id = globalNode.randomUUID();
              _this.glyphs.push(image);
              _this.canvas.add(image);
              if (app.roadbook && app.roadbook.currentlyEditingInstruction)
                app.roadbook.currentlyEditingInstruction.parseGlyphInfo(); // TODO: this must be handled by instruction
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
    object.selectable = false;
    // if (object.type == "TextElement") {
    //   //if the object is an image add it to the glyphs array
    //   object.id = globalNode.randomUUID();
    //   _this.glyphs.push(object);
    // }
    if (object.type == "image") {
        //if the object is an image add it to the glyphs array
        object.id = globalNode.randomUUID();
        _this.glyphs.push(object);
        fabric.util.loadImage(object.src, function(img, isError) {
        if (isError || !img) {
            console.error(`Failed to load image: ${object.src}`);
            // Fallback: Set a default image source
              remmapedSrc = _this.remapOldGlyphs(object.src);
              if (remmapedSrc === false) {
                remmapedSrc = './assets/svg/glyphs/missing-glyph.svg';
              }
              object.setSrc(remmapedSrc, function() {
            _this.canvas.renderAll();
            }, { crossOrigin: 'anonymous' });
        }
        }, null, 'anonymous');
    } else {
      if (!object.id)
        object.id = globalNode.randomUUID();
      _this.glyphs.push(object);
    }
    });
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
    this.canvas.forEachObject(function(obj) {
      obj.selectable = true;
    });
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
    // remove controls from glyphs and update the canvas' visual state
    this.canvas.forEachObject(function(obj) {
      obj.selectable = false;
    });
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
      if (glyph.type == 'image') {
        // Do not store missing glyph image
        if (json.src.includes("missing-glyph"))
          json.src = glyph.src;
        json.src = this.truncateGlyphSource(json.src);
      }
      json.id = glyph.id;
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
    return (index == -1 ? src.replace(app.settings.user_glyph_path, "{user_glyphs_path}") : "./" + src.slice(index));
  },

  buildFromHtml: function (html) {
    html = html.replace('<br>', '\n');
    var parser = new DOMParser();
    var doc = parser.parseFromString(html, 'text/html');
    var body = doc.body;
    var nodes = body.childNodes;
    var images = doc.getElementsByTagName('img');
    var text = [];
    var top =30;
    var left =30;
    // Get images
    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      var position = { top: top, left: left };
      remappedSrc = this.remapOldGlyphs(img.src);
      if (remappedSrc !== false) {
        img.src = remappedSrc;
      }
      this.addGlyph(position, img.src);
      left += 60;
      if (left > 180) {
        left = 30;
        top += 60;
      }
    }
    // Get text nodes
    for (let node of nodes) {
        // Extract text and styles from the current node and its children
        const textWithStyles = this.extractTextWithStyles(node);
        
        // Process each extracted text with its styles
        for (let { text, styles } of textWithStyles) {
            const position = { top, left };
            // Pass text and styles to addText
            this.addText(position, text, styles);
            left += 60;
            if (left > 180) {
                left = 30;
                top += 60;
            }
        }
    }

  },

  addText(position, text, styles = {bold: false, italic: false, underline: false}) {
    this.finishRemove();
    var _this = this;
    var textObj = new fabric.TextElement(text);
    textObj.setPosition(position.top, position.left);
    if (styles.bold)
      textObj.setTextStyle('bold')
    if (styles.italic)
      textObj.setTextStyle('italic')
    if (styles.underline)
      textObj.setTextStyle('underline')
    textObj.id = globalNode.randomUUID();
    _this.glyphs.push(textObj);
    _this.canvas.add(textObj);
  },

  extractTextWithStyles(node, styles = { italic: false, bold: false, underline: false }, result = []) {
    // If it's a text node with non-empty content
    if ((node.nodeType === Node.TEXT_NODE || node.nodeName === 'DIV') && node.textContent.trim() !== '') {
        result.push({
            text: node.textContent.trim(),
            styles: { ...styles } // Clone styles to avoid mutating
        });
    }
    // If it's an element node (<i>, <b>, <u>)
    else if (node.nodeType === Node.ELEMENT_NODE) {
        // Update styles based on the current node
        const newStyles = { ...styles };
        if (node.nodeName === 'I') newStyles.italic = true;
        if (node.nodeName === 'B') newStyles.bold = true;
        if (node.nodeName === 'U') newStyles.underline = true;

        // Recursively process child nodes
        for (let child of node.childNodes) {
            this.extractTextWithStyles(child, newStyles, result);
        }
    }
    return result;
  },
  setTextStyle(style) {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject && activeObject.id && activeObject.type == 'TextElement') {
      activeObject.setTextStyle(style);
      this.canvas.renderAll();
    }
  }
});
