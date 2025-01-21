/*
  ---------------------------------------------------------------------------
  Define the print application object as a singleton

  This class is the main IO interface between the user an the printing application

  References:
  http://blog.teamtreehouse.com/cross-domain-messaging-with-postmessage
  http://electron.atom.io/docs/api/web-contents/
  http://electron.atom.io/docs/api/web-contents/#webcontentsprinttopdfoptions-callback
  https://github.com/electron/electron/blob/master/docs/api/window-open.md
  ---------------------------------------------------------------------------
*/

class PrintApp {
  pageSizes;
  pageSize;

  constructor() {
    var _this = this;
    this.name = ko.observable('');
    this.desc = ko.observable('');
    this.totalDistance = ko.observable('');
    this.waypointCount = ko.observable('');
    this.fuelRange = ko.observable('');
    this.instructions = ko.observableArray([]);

    this.ipc = globalNode.ipcRenderer;
    this.ipc.on('print-data', function (event, arg) {
      _this.parseJson(arg);
    });

    this.pageSizes = ko.observableArray([{ text: "Letter", value: "Letter" }, { text: 'A5', value: 'A5' }, { text: 'Roll', value: 'Roll' }]);
    this.pageSize = ko.observable('Roll');
    this.ipc.send('print-launched', true);
  }

  parseJson(json) {
    this.name(json.name);
    this.desc(json.desc);
    this.totalDistance(json.totalDistance);
    this.fuelRange(json.fuelRange);
    this.instructions(json.instructions);
    this.waypointCount(ko.unwrap(this.instructions).length)
    this.filePath = json.filePath;
  }

  requestPdfPrint() {
    $('nav').hide();
    this.rerenderForPageSize()
    var size = this.pageSize();
    const dpi = 150;
    if (size == "Roll") {
      const roadBookWidthMm = 150;
      const pageWidth = roadBookWidthMm / 25.4;
      const docAspect = $(document).height() / $(document).width()

      size = {
        width: pageWidth,
        height: pageWidth * docAspect
      }
    }
    if ((size == "Letter")) {
      $('body').css('margin-left', '-60px');
    }
    console.log("PDF paper size", size)
    var data = { 'filepath': this.filePath, 'opts': { 'pageSize': size, 'marginsType': '1', 'dpi': dpi } };

    globalNode.printToPdf(data);
  }

  rerenderForPageSize() {
    var pageSize = this.pageSize();
    $('.waypoint, .waypoint-note, .waypoint-distance, .waypoint-tulip').removeClass('A5');
    $('.break').remove();

    if ((pageSize == "Letter" || pageSize == "A5")) {
      this.addPageBreaks();
      //adjust height for A5

      if (pageSize == "A5") {
        $('.waypoint, .waypoint-note, .waypoint-distance, .waypoint-tulip').addClass('A5');
      }
    }
  }

  addPageBreaks() {
    if ($('.break').length > 0) { return };
    $('#roadbook').find('#roadbook-header').after($('<div>').attr('class', 'break'));
    var instructions = $('#roadbook').find('.waypoint')

    // Default to Letter Format
    for (var i = 0; i < instructions.length; i++) {
      if ((((i + 1) % 5) == 0) && (i > 0)) {
        $(instructions[i]).after($('<div>').attr('class', 'break'));
      }
    }
  }
};

/*
  ---------------------------------------------------------------------------
  Instantiate the application
  ---------------------------------------------------------------------------
*/
var printApp;
$(document).ready(function () {
  printApp = new PrintApp();
  ko.applyBindings(printApp);

  $(window).scroll(function () {
    if ($(this).scrollTop() > 0) {
      $(".main-nav").addClass("main-nav-scrolled");
    } else {
      $(".main-nav").removeClass("main-nav-scrolled");
    }
  });

  $('#print-size').change(function () {
    printApp.rerenderForPageSize();
  });
  $('.button').click(function () {
    printApp.requestPdfPrint();
  });
});
