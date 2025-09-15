// TODO refactor this to use MVC pattern and act as a controller for the currentlyEditingInstruction for the roadbook
class GlyphControls {

  constructor(app_path, glyphStructure) {
    this.glyph_path = app_path + '/assets/svg/glyphs/';
    this.glyphStructure = glyphStructure
    this.populateGlyphs();
    this.initListeners();
    this.bindToGlyphImages();
    this.addToNote = false;
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
      var img = $('<img>').addClass('glyph').attr('src', result.src)
      var link = $('<a>').addClass('th').attr('title', result.name).append(img).append($('<p>').text(result.text));
      var showResult = $('<li>').append(link);
      $(img).on('click', function (e) {
        _this.handleGlyphSelectUI(e);
        _this.addGlyphToInstruction(this);
      })
      $('#glyph-search-results').append(showResult);
    });
  }

  searchGlyphNames(query) {
    const results = [];
    this.glyphStructure.forEach(section => {
      if (section.items) {
        section.items.forEach(item => {
          if (item.text.toLowerCase().includes(query.toLowerCase())) {
            results.push({ src: item.src, text: item.text });
          }
        });
      } else if (section.tabs) {
        section.tabs.forEach(tab => {
          tab.items.forEach(item => {
            if (item.text.toLowerCase().includes(query.toLowerCase())) {
              results.push({ src: item.src, text: item.text });
            }
          });
        });
      }
    });
    return results;
  }

bindToGlyphImages() {
  var _this = this;
  $('.glyph').on('click', function (e) {
    _this.handleGlyphSelectUI(e);
    _this.addGlyphToInstruction(this);
  });
}

initListeners() {
  var _this = this;
  $('#glyph-search').on('keyup', function () {
    $('#glyph-search-results').html('');
    if ($(this).val() != '') {
      var results = _this.searchGlyphNames($(this).val());
      _this.populateResults(results);
      $('.glyph').off('click')
      _this.bindToGlyphImages();
    }
  });

  $('#glyph-search-clear').on('click', function () {
    $('#glyph-search').val('');
    $('#glyph-search-results').html('');
    $('#glyph-search').focus();
  })

  $('.note-grid').on('click', function (e) {
    e.preventDefault();
    _this.addToNote = true;
    $('#glyphs').foundation('reveal', 'open');
    setTimeout(function () { $('#glyph-search').focus(); }, 600); //we have to wait for the modal to be visible before we can assign focus
  });

  //TODO fill out this todo, you know you wanna.
  $('.glyph-grid').on('click', function (e) {
    e.preventDefault();
    if ($(this).hasClass('undo')) {
      app.roadbook.currentlyEditingInstruction.tulip.removeLastGlyph();
      app.roadbook.currentlyEditingInstruction.parseGlyphInfo(); // TODO: this must be handled by instruction 
      return false
    }
    _this.showGlyphModal($(this).data('top'), $(this).data('left'));
    return false
  });

  $('.text-grid').on('click', function (e) {
    e.preventDefault();
    if ($(this).hasClass('undo')) {
      // app.roadbook.currentlyEditingInstruction.tulip.removeLastGlyph();
      return false
    }
    _this.addTextToTulip($(this).data('top'), $(this).data('left'));
    return false
  });

  $(document).on('keydown', function (e) {
    if ((e.key === 'Delete' || e.key === 'Backspace') && !$(e.target).is('input, textarea') && app.roadbook.currentlyEditingInstruction) {
      app.roadbook.currentlyEditingInstruction.tulip.removeActiveGlyph()
      app.roadbook.currentlyEditingInstruction.note.removeActiveGlyph()
      app.roadbook.currentlyEditingInstruction.parseGlyphInfo(); // TODO: this must be handled by instruction 
    }
  });
}

showGlyphModal(top, left) {
  app.glyphPlacementPosition = { top: top, left: left };
  this.addToNote = false;
  $('#glyphs').foundation('reveal', 'open');
  setTimeout(function () { $('#glyph-search').focus(); }, 600); //we have to wait for the modal to be visible before we can assign focus
  return false
}

addTextToTulip(top, left) {
  var textObj = new fabric.IText('New Text', {
      left: left,
      top: top,
      fontSize: 20,
      fill: '#000000',
      editable: true,
    });
  app.roadbook.currentlyEditingInstruction.tulip.glyphs.push(textObj);
  app.roadbook.currentlyEditingInstruction.tulip.canvas.add(textObj);
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
    app.roadbook.currentlyEditingInstruction.note.addGlyph({ top: 30, left: 30 }, src);
  } else {
    // NOTE this module should only know about the roadbook
    app.roadbook.currentlyEditingInstruction.tulip.addGlyph(app.glyphPlacementPosition, src);
  }
}

populateGlyphs() {
  const accordion = this._generateAccordion(this.glyphStructure);
  $('#glyph-content').html(accordion);
}

// Function to generate HTML for items
_generateItems(items) {
  return items.map(item => `
    <li><a class="th" href="#"><img class="glyph" src="${item.src}"></a><p>${item.text}</p></li>
  `).join('');
}

// Function to generate HTML for tabs
_generateTabs(tabs) {
  const tabTitles = tabs.map(tab => `
    <li class="tab-title${tab.active ? ' active' : ''}"><a href="#${tab.id}">${tab.title}</a></li>
  `).join('');

  const tabContents = tabs.map(tab => `
    <div class="content${tab.active ? ' active' : ''}" id="${tab.id}">
      <ul class="small-block-grid-5">
        ${this._generateItems(tab.items)}
      </ul>
    </div>
  `).join('');

  return `
    <ul class="tabs" data-tab>
      ${tabTitles}
    </ul>
    <div class="tabs-content">
      ${tabContents}
    </div>
    `;
}

// Function to generate HTML for accordion sections
_generateAccordion(data) {
  return `
    <ul class="accordion" data-accordion>
      ${data.map(section => `
        <li class="accordion-navigation">
          <a href="#${section.id}">${section.title}</a>
          <div id="${section.id}" class="content">
            ${section.tabs ? this._generateTabs(section.tabs) : `
              <ul class="small-block-grid-5">
                ${this._generateItems(section.items)}
              </ul>
            `}
          </div>
        </li>
      `).join('')}
    </ul>
  `;
}
};
