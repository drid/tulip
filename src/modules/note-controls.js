// TODO This is a controller from the waypoint palette view to the roadbook model's currentlyEditingInstruction
class NoteControls {
  constructor() {
    var _this = this;

    $('#note-editor').on('input', function () {
      _this.checkForNotification()
    });

    $('#note-selection-size-range').on('change', function (e) {
      document.execCommand('fontSize', null, $(this).val());
      var sizes = { 3: 'small', 4: 'normal', 5: 'large', 6: 'huge' }
      var size = sizes[$(this).val()];
      _this.resizeSelection(size);
    });

    $('#note-selection-bold').on('click', function () {
      document.execCommand('bold', null, false);
      $(this).toggleClass('active');
      $(this).blur();
    })

    $('#note-selection-italic').on('click', function () {
      document.execCommand('italic', null, false)
      $(this).toggleClass('active');
      $(this).blur();
    })

    $('#note-selection-underline').on('click', function () {
      document.execCommand('underline', null, false)
      $(this).toggleClass('active');
      $(this).blur();
    })

    //TODO decouple this
    $('#notification-open-radius, #notification-validation-radius').on('keyup input', function () {
      var notification = app.roadbook.currentlyEditingInstruction.notification;
      notification.openRadius = parseInt($('#notification-open-radius').val());
      notification.validationRadius = parseInt($('#notification-validation-radius').val());
      if (notification.validationRadius > notification.openRadius) {
        notification.openRadius = notification.validationRadius;
        $('#notification-open-radius').val(notification.openRadius);
      }
      $('#notification-open-radius').attr('min', notification.validationRadius);
      notification.time = $('#notification-time').val();
      app.roadbook.currentlyEditingInstruction.updateWaypointBubble();
      _this.checkForNotification(); //TODO This needs refactored
    });

  }

  updateNotificationControls(notification) {
    $('#notification-open-radius').val(notification.openRadius);
    $('#notification-validation-radius').val(notification.validationRadius);
    $('#notification-time').val(notification.time);
    $('#notification-validation-radius').attr('min', Notification.getUiElements(notification.type).modMin);
    $('#notification-validation-radius').attr('max', Notification.getUiElements(notification.type).modMax);
    $('#notification-validation-radius').attr('step', Notification.getUiElements(notification.type).modStep);
    if (notification.openRadius) {
      $('#notification-open-radius-wrapper').removeClass('waypoint-parameter-none')
    } else {
      $('#notification-open-radius-wrapper').addClass('waypoint-parameter-none')
    }
    if (notification.time) {
      $('#notification-time-wrapper').removeClass('waypoint-parameter-none')
    } else {
      $('#notification-time-wrapper').addClass('waypoint-parameter-none')
    }
  }

  resizeSelection(size) {
    var sel = window.getSelection();
    var images = $('#note-editor img')
    for (var i = 0; i < images.length; i++) {
      if (sel.containsNode(images[i])) {
        $(images[i]).removeClass();
        $(images[i]).addClass(size);
      }
    }
  }

  checkForNotification() {
    if (app.roadbook.currentlyEditingInstruction) {
      // reduce DOM image objects in the text editor to a collection of glyph names
      var glyphs = $('#note-editor').find("img").toArray().map(function (g) {
        var wp = g.src.match(/\/([A-Za-z0-9.\-_]*)\.svg/)
        return wp ? wp[1] : '';
      })
      app.roadbook.currentlyEditingInstruction.parseGlyphInfo(glyphs);
    }
  }
}
