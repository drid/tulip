// TODO refactor this to use MVC pattern and act as a controller for the currentlyEditingInstruction for the roadbook
class GlyphControls {

  constructor() {
    // this.fs = fs;
    // this.process = globalNode.remote.process;
    this.files = [];
    this.getGylphNames();
    this.initListeners();
    this.bindToGlyphImages();
    this.addToNote = false;
  }

  getGylphNames() {
    try {
      this.files = globalNode.fs.readdirSync(this.process.resourcesPath + '/app/assets/svg/glyphs/').filter(function (val) { return val.endsWith('.svg') });
    } catch (e) {
      console.log("using unpackaged filesys");
      this.files = globalNode.fs.readdirSync('assets/svg/glyphs').filter(function (val) { return val.endsWith('.svg') });
    }
  }

  handleGlyphSelectUI(e) {
    e.preventDefault();
    if (!e.shiftKey) {
      $('#glyphs').foundation('reveal', 'close');
    }
    $('#glyph-search').focus();
  }

  populateResults(results) {
    var _this = this;
    $.each(results, function (i, result) {
      // Check for waypoint or control icons
      var img = $('<img>').addClass('glyph').attr('src', result.path)
      var link = $('<a>').addClass('th').attr('title', result.name).append(img);
      var showResult = $('<li>').append(link);
      $(img).click(function (e) {
        _this.handleGlyphSelectUI(e);
        _this.addGlyphToInstruction(this);
      })
      $('#glyph-search-results').append(showResult);
    });
  }

  searchGlyphNames(query) {
    var results = [];
    $.each(this.files, function (i, file) {
      if (file.indexOf(query) != -1) {
        results.push({ name: file.replace('.svg', ''), path: 'assets/svg/glyphs/' + file })
      }
    });
    return results;
  }

  bindToGlyphImages() {
    var _this = this;
    $('.glyph').click(function (e) {
      _this.handleGlyphSelectUI(e);
      _this.addGlyphToInstruction(this);
    });
  }

  initListeners() {
    var _this = this;
    $('#glyph-search').keyup(function () {
      $('#glyph-search-results').html('');
      if ($(this).val() != '') {
        var results = _this.searchGlyphNames($(this).val());
        _this.populateResults(results);
        $('.glyph').off('click')
        _this.bindToGlyphImages();
      }
    });

    $('#glyph-search-clear').click(function () {
      $('#glyph-search').val('');
      $('#glyph-search-results').html('');
      $('#glyph-search').focus();
    })

    $('.note-grid').click(function (e) {
      e.preventDefault();
      _this.addToNote = true;
      $('#glyphs').foundation('reveal', 'open');
      setTimeout(function () { $('#glyph-search').focus(); }, 600); //we have to wait for the modal to be visible before we can assign focus
    });

    //TODO fill out this todo, you know you wanna.
    $('.glyph-grid').click(function (e) {
      e.preventDefault();
      if ($(this).hasClass('undo')) {
        if (e.shiftKey) {
          // NOTE this module should only know about the roadbook
          app.roadbook.currentlyEditingInstruction.tulip.beginRemoveGlyph();
        } else {
          // NOTE this module should only know about the roadbook
          app.roadbook.currentlyEditingInstruction.tulip.removeLastGlyph();
        }
        return false
      }
      _this.showGlyphModal($(this).data('top'), $(this).data('left'));
      return false
    });
  }

  showGlyphModal(top, left) {
    app.glyphPlacementPosition = { top: top, left: left };
    this.addToNote = false;
    $('#glyphs').foundation('reveal', 'open');
    setTimeout(function () { $('#glyph-search').focus(); }, 600); //we have to wait for the modal to be visible before we can assign focus
    return false
  }

  addGlyphToInstruction(element) {
    var src = $(element).attr('src');
    var filename = src.substring(src.lastIndexOf('/') + 1);
    var glyph = filename.replace('.svg', '')
    if (Notification.mapFileNameToType(glyph) != undefined) {
      app.roadbook.currentlyEditingInstruction.manageWaypoint(glyph);
      return;
    }
    if (this.addToNote) {
      // NOTE this module should only know about the roadbook
      app.roadbook.appendGlyphToNoteTextEditor($('<img>').attr('src', src).addClass('normal'));
    } else {
      // NOTE this module should only know about the roadbook
      app.roadbook.currentlyEditingInstruction.tulip.addGlyph(app.glyphPlacementPosition, src);
    }
  }

};
