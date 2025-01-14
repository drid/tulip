// TODO This is a controller from the waypoint palette view to the roadbook model's currentlyEditingInstruction
class NoteControls {
  constructor() {
    var _this = this;

    $('#note-selection-size-range').change(function (e) {
      document.execCommand('fontSize', null, $(this).val());
      var sizes = { 3: 'small', 4: 'normal', 5: 'large', 6: 'huge' }
      var size = sizes[$(this).val()];
      _this.resizeSelection(size);
    });

    $('#note-selection-bold').click(function () {
      document.execCommand('bold', null, false);
      $(this).toggleClass('active');
      $(this).blur();
    })

    $('#note-selection-italic').click(function () {
      document.execCommand('italic', null, false)
      $(this).toggleClass('active');
      $(this).blur();
    })

    $('#note-selection-underline').click(function () {
      document.execCommand('underline', null, false)
      $(this).toggleClass('active');
      $(this).blur();
    })

    $('#show-notification-options').click(function () {
      var notification = app.roadbook.currentlyEditingInstruction.notification;
      $('#notification-open-radius').val(notification.openRadius);
      $('#notification-validation-radius').val(notification.validationRadius);
      $('#notification-time').val(notification.time);
      $('#notification-validation-radius').attr('min', notification.modMin);
      $('#notification-validation-radius').attr('max', notification.modMax);
      $('#notification-validation-radius').attr('step', notification.modStep);
    });
    //TODO decouple this
    $('#notification-open-radius, #notification-validation-radius').bind('keyup input', function () {
      var notification = app.roadbook.currentlyEditingInstruction.notification;
      notification.openRadius = $('#notification-open-radius').val();
      notification.validationRadius = $('#notification-validation-radius').val();
      notification.time = $('#notification-time').val();
    });

  }

  updateNotificationControls(notification) {
    $('#notification-open-radius').val(notification.openRadius);
    $('#notification-validation-radius').val(notification.validationRadius);
    $('#notification-time').val(notification.time);
    $('#notification-validation-radius').attr('min', notification.modMin);
    $('#notification-validation-radius').attr('max', notification.modMax);
    $('#notification-validation-radius').attr('step', notification.modStep);
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
}
