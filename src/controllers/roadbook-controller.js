'use strict';
// TODO refactor this to use MVC pattern and act as a model for the roadbook all UI interaction should be moved to an application controller, also change to ES6 syntax
class RoadbookController {
  constructor(model) {
    this.model = model
    this.bindToInstructionDescriptionInput();
    this.bindToNameDescEditButtons();
    this.bindToPaletteControls();
    this.bindToTrackGrid();
    this.bindToEntryTrackSelector();
    this.bindToExitTrackSelector();
    this.bindToAddedTrackSelector();
    this.element;
    this.isSaved = ko.observable(true);
  }

  highlightSaveButton() {
    this.isSaved(false);
  }

  appendGlyphToNoteTextEditor(image) {
    $('#note-editor').append(image);
  }

  /*
    initialize rich text editor for the roadbook description
  */
  bindToInstructionDescriptionInput() {
    var _this = this;
    _this.descriptionTextEditor = new Quill('#description-editor', {
      modules: {
        toolbar: {
          container: '#description-toolbar'
        }
      },
      theme: 'snow'
    });

    var existingContent = _this.model.desc();
    if (existingContent) {
      var delta = _this.descriptionTextEditor.clipboard.convert({ html: existingContent });
      _this.descriptionTextEditor.setContents(delta);

    }

    this.descriptionTextEditor.on('text-change', function (delta, source) {
      var newValue = _this.descriptionTextEditor.getSemanticHTML();

      _this.model.desc(newValue);
    });
  }
  enterEditMode = function (htmlContent) {
    if (this.descriptionTextEditor) {
      var delta = this.descriptionTextEditor.clipboard.convert({ html: htmlContent });
      this.descriptionTextEditor.setContents(delta);
    }
  };
  bindToNameDescEditButtons() {
    var _this = this;
    $('#roadbook-desc, #roadbook-name').find('a.show-editor').on('click', function () {
      $(this).hide();
      $(this).siblings('.hide-editor').show();
      $(this).siblings('.roadbook-header-input-container').slideDown('fast');
      if ($(this).hasClass('rb-name')) {
        $(this).parent('div').find(':input').focus();
      }
      if ($(this).hasClass('rb-desc')) {
        $('#roadbook-desc > p').slideUp('fast');
        _this.descriptionTextEditor.focus();
      }
      _this.isSaved(false);
      // TODO should we track this here?
      _this.model.editingNameDesc = true;
    });

    $('#roadbook-desc, #roadbook-name').find('a.hide-editor').on('click', function () {
      $(this).hide();
      $(this).siblings('.show-editor').show();
      $(this).siblings('.roadbook-header-input-container').slideUp('fast');
      if ($(this).hasClass('rb-desc')) {
        $('#roadbook-desc p').slideDown('fast');
      }
    });
  }

  bindToPaletteControls() {
    var _this = this;
    $('#hide-palette').on('click', function () {
      _this.model.finishInstructionEdit(_this.getNoteEditorHTML(), _this.getNotificationOpenRadiusVal(), _this.getNotificationValidationRadiusVal(), _this.getNotificationTimeVal());
      _this.resetInstructionPalette();
      $('#save-roadbook').removeAttr('href', '#') // Removes the href attribute
        .css({
          'pointer-events': 'auto', // Prevents clicking
          'color': '' // Visually indicates disabled state
        });
    });

    $('#toggle-heading').on('change', function () {
      $('#note-editor-container').toggleClass('hideCap', !_this.model.instructionShowHeading())
      _this.model.currentlyEditingInstruction.showHeading(_this.model.instructionShowHeading());
    });
    $('#toggle-coordinates').on('change', function () {
      $('#note-editor-container').toggleClass('hideCoordinates', !_this.model.instructionShowCoordinates())
      _this.model.currentlyEditingInstruction.showCoordinates(_this.model.instructionShowCoordinates());
    });
    $('#delete-tulip-item').on("click", function () {
      _this.model.currentlyEditingInstruction.tulip.removeActiveGlyph()
    })
  }

  bindToTrackGrid() {
    var _this = this;
    $('.track-grid').on('click', function (e) {
      if ($(this).hasClass('undo')) {
        _this.model.currentlyEditingInstruction.tulip.removeLastTrack();
        return
      }
      var angle = $(this).data('angle');
      _this.model.currentlyEditingInstruction.tulip.addTrack(angle);
    });
  }

  bindToEntryTrackSelector() {
    var _this = this;
    $('.entry-track-selector').on('click', function (e) {
      e.preventDefault();
      _this.model.changeEditingInstructionEntry($(this).data('track'));
    });
  }

  bindToExitTrackSelector() {
    var _this = this;
    $('.exit-track-selector').on('click', function (e) {
      e.preventDefault();
      _this.model.changeEditingInstructionExit($(this).data('track'));
    });
  }

  bindToAddedTrackSelector() {
    var _this = this;
    $('.added-track-selector').on('click', function (e) {
      e.preventDefault();
      _this.model.changeEditingInstructionAdded($(this).data('track'));

      $('.added-track-selector').removeClass('active');
      $(this).addClass('active');
    });
  }

  populateInstructionPalette(instruction) {
    this.editingElement = instruction.element;
    this.isSaved(false);
    $('#notification-open-radius').val((instruction.notification ? instruction.notification.openRadius : null));
    $('#notification-validation-radius').val((instruction.notification ? instruction.notification.validationRadius : null));
    $('#notification-validation-radius').attr('min', instruction.notification ? Notification.getUiElements(instruction.notification.type).modMin : 5);
    $('#notification-validation-radius').attr('max', instruction.notification ? Notification.getUiElements(instruction.notification.type).modMax : 2000);
    $('#notification-validation-radius').attr('step', instruction.notification ? Notification.getUiElements(instruction.notification.type).modStep : 5);
    $('#notification-time').val((instruction.notification ? instruction.notification.time : null));
    $('#note-editor-container').toggleClass('hideCap', !instruction.showHeading());
    $('#roadbook-waypoints').children().hide();
    $(instruction.element).show();
    $('#roadbook').scrollTop(this.editingElement.position().top - 80)
    $('#waypoint-palette').slideDown('slow');
    $(instruction.element).find('.waypoint-note').find('p').after($('#note-editor-container'));
    // Manage wp delete
    $(instruction.element).find('.waypoint-icon').on('dblclick', function (event) {
      event.preventDefault();
      instruction.removeWaypoint();
    });
    $(instruction.element).find('.waypoint-icon').addClass('delete-suggestion');
    $(instruction.element).find('.waypoint-icon').on('mouseenter', function () {
      $(this).attr('title', 'Double-click to delete the waypoint');
    }).on('mouseleave', function () {
      $(this).removeAttr('title');
    });

    // $('#roadbook').css('padding-bottom', '0');
    $('#roadbook').find('.roadbook-info').hide();
    if (instruction.notification) {
      $('#notification-options').removeClass('hidden');
      if (instruction.notification.openRadius) {
        $('#notification-open-radius-wrapper').removeClass('waypoint-parameter-none')
      } else {
        $('#notification-open-radius-wrapper').addClass('waypoint-parameter-none')
      }
      if (instruction.notification.time) {
        $('#notification-time-wrapper').removeClass('waypoint-parameter-none')
      } else {
        $('#notification-time-wrapper').addClass('waypoint-parameter-none')
      }
    }
    $('#added-' + instruction.entryTrackType).trigger('click');
  }

  resetInstructionPalette() {
    $('.waypoint.row').show();
    $('#waypoint-palette').find('.note-tools').append($('#note-editor-container'));
    $('#waypoint-palette').slideUp('slow');
    $('#note-selection-bold, #note-selection-italic, #note-selection-underline').removeClass('active');
    $('.added-track-selector').removeClass('active');
    $($('.added-track-selector')[1]).addClass('active');
    // $('#roadbook').css('padding-bottom', '150%');
    $('#roadbook').find('.roadbook-info').show();
    $('#notification-options').addClass('hidden');
    $('#roadbook').scrollTop(this.editingElement.position().top - 80);
    $('#note-editor').html('');
    $('.waypoint.row').find('.waypoint-icon').off();
    $('.waypoint.row').find('.waypoint-icon').removeClass('delete-suggestion');
  }

  getNoteEditorHTML() {
    return $('#note-editor').html()
  }

  getNotificationOpenRadiusVal() {
    return $('#notification-open-radius').val();
  }

  getNotificationValidationRadiusVal() {
    return $('#notification-validation-radius').val();
  }

  getNotificationTimeVal() {
    return $('#notification-time').val();
  }
}
