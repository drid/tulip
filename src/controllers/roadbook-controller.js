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
  }

  highlightSaveButton() {
    $('#save-roadbook').removeClass('secondary'); //TODO this shouldn't be here
  }

  appendGlyphToNoteTextEditor(image) {
    $('#note-editor').append(image);
  }

  /*
    initialize rich text editor for the roadbook description
  */
  bindToInstructionDescriptionInput() {
    var _this = this;
    this.descriptionTextEditor = new Quill('#description-editor');
    this.descriptionTextEditor.addModule('toolbar', {
      container: '#description-toolbar'     // Selector for toolbar container
    });
    this.descriptionTextEditor.on('text-change', function (delta, source) {
      var newValue = _this.descriptionTextEditor.getHTML()
      _this.model.desc(newValue);
    });
  }

  bindToNameDescEditButtons() {
    var _this = this;
    $('#roadbook-desc, #roadbook-name').find('a.show-editor').click(function () {
      $(this).hide();
      $(this).siblings('.hide-editor').show();
      $(this).siblings('.roadbook-header-input-container').slideDown('fast');
      if ($(this).hasClass('rb-name')) {
        $(this).parent('div').find(':input').focus();
      }
      if ($(this).hasClass('rb-desc')) {
        $('#roadbook-desc p').slideUp('fast');
        _this.descriptionTextEditor.focus();
      }
      $('#save-roadbook').removeClass('secondary');
      // TODO should we track this here?
      _this.model.editingNameDesc = true;
    });

    $('#roadbook-desc, #roadbook-name').find('a.hide-editor').click(function () {
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
    $('#hide-palette').click(function () {
      _this.model.finishInstructionEdit(_this.getNoteEditorHTML(), _this.getNotificationOpenRadiusVal(), _this.getNotificationValidationRadiusVal(), _this.getNotificationTimeVal());
      _this.resetInstructionPalette();
    });

    $('#toggle-heading').change(function () {
      $('#note-editor-container').toggleClass('hideCap', !_this.model.instructionShowHeading())
      _this.model.currentlyEditingInstruction.showHeading(_this.model.instructionShowHeading());
    });
    $('#toggle-coordinates').change(function () {
      $('#note-editor-container').toggleClass('hideCoordinates', !_this.model.instructionShowCoordinates())
      _this.model.currentlyEditingInstruction.showCoordinates(_this.model.instructionShowCoordinates());
    });
  }

  bindToTrackGrid() {
    var _this = this;
    $('.track-grid').click(function (e) {
      if ($(this).hasClass('undo')) {
        if (e.shiftKey) {
          _this.model.currentlyEditingInstruction.tulip.beginRemoveTrack();
        } else {
          _this.model.currentlyEditingInstruction.tulip.removeLastTrack();
        }
        return
      }
      var angle = $(this).data('angle');
      _this.model.currentlyEditingInstruction.tulip.addTrack(angle);
    });
  }

  bindToEntryTrackSelector() {
    var _this = this;
    $('.entry-track-selector').click(function (e) {
      e.preventDefault();
      _this.model.changeEditingInstructionEntry($(this).data('track'));
    });
  }

  bindToExitTrackSelector() {
    var _this = this;
    $('.exit-track-selector').click(function (e) {
      e.preventDefault();
      _this.model.changeEditingInstructionExit($(this).data('track'));
    });
  }

  bindToAddedTrackSelector() {
    var _this = this;
    $('.added-track-selector').click(function (e) {
      e.preventDefault();
      _this.model.changeEditingInstructionAdded($(this).data('track'));

      $('.added-track-selector').removeClass('active');
      $(this).addClass('active');
    });
  }

  populateInstructionPalette(instruction) {
    this.editingElement = instruction.element;
    $('#save-roadbook').removeClass('secondary');
    $('#note-editor').html(instruction.noteHTML());
    $('#notification-open-radius').val((instruction.notification ? instruction.notification.openRadius : null));
    $('#notification-validation-radius').val((instruction.notification ? instruction.notification.validationRadius : null));
    $('#notification-time').val((instruction.notification ? instruction.notification.time : null));
    $('#note-editor-container').toggleClass('hideCap', !instruction.showHeading());
    $('#roadbook-waypoints').children().hide();
    $(instruction.element).show();
    $('#roadbook').scrollTop(this.editingElement.position().top - 80)
    $('#waypoint-palette').slideDown('slow');
    $(instruction.element).find('.waypoint-note').find('p').after($('#note-editor-container'));
    $('#roadbook').css('padding-bottom', '0');
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
  }

  resetInstructionPalette() {
    $('.waypoint.row').show();
    $('#waypoint-palette').find('.note-tools').append($('#note-editor-container'));
    $('#waypoint-palette').slideUp('slow');
    $('#note-selection-bold, #note-selection-italic, #note-selection-underline').removeClass('active');
    $('#note-selection-size-range').val(4);
    $('#note-selection-size-range').change();
    $('.added-track-selector').removeClass('active');
    $($('.added-track-selector')[1]).addClass('active');
    $('#roadbook').css('padding-bottom', '150%');
    $('#roadbook').find('.roadbook-info').show();
    $('#notification-options').addClass('hidden');
    $('#roadbook').scrollTop(this.editingElement.position().top - 80);
    $('#note-editor').html('');
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
