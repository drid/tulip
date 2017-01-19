var GlyphControls = Class({
  singleton: true,

  create: function(){
    this.fs = require('fs');
    this.process = require('electron').remote.process;
    this.files = [];
    this.getGylphNames();
    this.initListeners();
    this.addToNote = false;
  },


  getGylphNames(){
    try {
      this.files = this.fs.readdirSync(this.process.resourcesPath + '/app/assets/svg/glyphs');
    } catch (e) {
      console.log("using unpackaged filesys");
      this.files = this.fs.readdirSync('assets/svg/glyphs');
    }
  },

  handleGlyphSelectUI: function(e){
    e.preventDefault();
    if(!e.shiftKey){
      $('#glyphs').foundation('reveal', 'close');
    }
    $('#glyph-search').focus();
  },

  populateResults: function(results){
    var _this = this;
    $.each(results, function(i,result){
      var img = $('<img>').addClass('glyph').attr('src', result.path)
      var link = $('<a>').addClass('th').attr('title', result.name).append(img);
      var showResult = $('<li>').append(link);
      $(img).click(function(e){
        _this.handleGlyphSelectUI(e);
        _this.addGlyphToInstruction(this);
      })
      $('#glyph-search-results').append(showResult);
    });
  },

  searchGlyphNames: function(query){
    results=[];
    $.each(this.files, function(i,file){
      if(file.indexOf(query) != -1){
        results.push({name: file.replace('.svg', ''), path: 'assets/svg/glyphs/'+file})
      }
    });
    return results;
  },

  initListeners: function(){
    var _this = this;
    $('#glyph-search').keyup(function(){
      $('#glyph-search-results').html('');
      if($(this).val() != ''){
        var results = _this.searchGlyphNames($(this).val());
        _this.populateResults(results);
      }
    });

    $('#glyph-search-clear').click(function(){
      $('#glyph-search').val('');
      $('#glyph-search-results').html('');
      $('#glyph-search').focus();
    })

    $('.glyph').click(function(e){
      _this.handleGlyphSelectUI(e);
      _this.addGlyphToInstruction(this);
    });

    $('.note-grid').click(function(e){
      e.preventDefault();
      _this.addToNote = true;
      $('#glyphs').foundation('reveal', 'open');
      setTimeout(function() { $('#glyph-search').focus(); }, 600); //we have to wait for the modal to be visible before we can assign focus
    });

    //TODO fill out this todo, you know you wanna.
    $('.glyph-grid').click(function(e){
      e.preventDefault();
      if($(this).hasClass('undo')){
        if(e.shiftKey){
          app.roadbook.currentlyEditingWaypoint.tulip.beginRemoveGlyph();
        }else{
          app.roadbook.currentlyEditingWaypoint.tulip.removeLastGlyph();
        }
        return false
      }
      app.glyphPlacementPosition = {top: $(this).data('top'), left: $(this).data('left')};
      _this.addToNote = false;
      $('#glyphs').foundation('reveal', 'open');
      setTimeout(function() { $('#glyph-search').focus(); }, 600); //we have to wait for the modal to be visible before we can assign focus
      return false
    });

    $('#note-glyph-range').change(function(e){
      var sizes = {0: 'small', 1: 'normal', 2: 'large', 3: 'huge'}
      var size = sizes[$(this).val()];
      var images = $('#note-editor div.ql-editor img.resizable')
      images.removeClass();
      images.addClass(size);
      images.addClass('resizable');
    });
  },

  bindNoteGlyphResizable: function(){
    $('#note-editor div.ql-editor img').unbind();
    $('#note-editor div.ql-editor img').click(function(){
      var size = $(this).attr('class');
      size = ((size !== undefined) ? size.replace('resizable', '').trim() : 'normal');
      size = ((size == '') ? 'normal' : size);
      if($('#note-editor div.ql-editor img.resizable').length != $('#note-editor div.ql-editor img.resizable.'+size).length){
        $('#note-glyph-range').val(1);
      }else {
        var sizes = {'small':0, 'normal':1, 'large':2, 'huge':3}
        $('#note-glyph-range').val(sizes[size]);
      }
      $(this).toggleClass("resizable");
    });
  },

  addGlyphToInstruction: function(element){
    var src = $(element).attr('src');

    if(this.addToNote){
      app.roadbook.noteTextEditor.insertEmbed(app.roadbook.noteTextEditor.getLength(),'image',src);
      this.bindNoteGlyphResizable();
    } else {
      app.roadbook.currentlyEditingWaypoint.tulip.addGlyph(app.glyphPlacementPosition,src);
    }
  }

});
