/*
  ---------------------------------------------------------------------------
  Define the application object as a singleton

  This class is the main IO interface between the user an the application

  Logically the Heirarchy of Application structure is:
    -> Application
     Modules:
     -> Mapping
      -> Roadbook
       -> Waypoint
        -> Tulip
         -> TrackEditor

    The Application handles bootstrapping the user interface and any non Mapping
    function. The UI is mainly composed of the UI Map which is managed by the
    MapController and MapModel objects. The MapController creates Waypoints based off interaction.
    Each Waypoint has a Tulip which is uses the TrackEditor class to handle the complexity
    of editing tracks.
  ---------------------------------------------------------------------------
*/

class App {
  constructor() {
    /*
      declare some state instance variables
    */
    this.glyphPlacementPosition = { top: 30, left: 30 };
    this.canEditMap = true;
    this.pointDeleteMode = false;

    /*
      instantiate the roadbook
      TODO rename variable
    */
    this.roadbook = new RoadbookModel();
    this.roadbook.bindToKnockout();

    this.roadbookController = new RoadbookController(this.roadbook);
    this.roadbook.controller = this.roadbookController;
    /*
      instantiate import/export
    */
    this.io = new Io();

    /*
      file io
    */
    this.fs = globalNode.fs;
    /*
      IPC to Main process
    */
    this.ipc = globalNode.ipcRenderer;
    /*
      initialize UI listeners
    */
    this.initListeners();

    this.glyphControls = new GlyphControls();

    this.noteControls = new NoteControls();

    this.settings = this.loadSettings();
  }

  /*
    ---------------------------------------------------------------------------
    App persistence
    TODO create a persistence module and move this into it.
    ---------------------------------------------------------------------------
  */

  canExport() {
    var can;
    can = this.roadbook.filePath != null;
    return can
  }

  canSave() {
    var can;
    can = this.roadbook.finishInstructionEdit();
    can = can || this.roadbook.finishNameDescEdit();
    return can;
  }

  openLastRoadBook() {
    const fileName = localStorage.getItem('lastRoadBook');
    this.ipc.send('check-file-existence', fileName);

    this.ipc.on('file-exists', (event, fileName) => {
      localStorage.setItem('lastRoadBook', fileName);
      this.loadRoadBook(fileName);
    });
  }

  loadRoadBook(fileName, append = false) {
    var _this = this;

    _this.startLoading();
    //TODO this needs to be passed to create when choice is added
    //we need to figure out how to watch a file while it's being edited so if it's moved it gets saved to the right place ***fs.watch***
    _this.fs.readFile(fileName, 'utf-8', function (err, data) {
      try {
        var json = JSON.parse(data);
        if (!append) {
          _this.newRoadbook()
        }
        _this.roadbook.appendRouteFromJSON(json, fileName); //TODO this needs to only pass json once choice is added   
        _this.roadbook.updateTotalDistance();
        localStorage.setItem('lastRoadBook', fileName);
      } catch (error) {
        console.error(error);
      }
    });
    $('#toggle-roadbook').click();
    $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
    $('#print-roadbook').removeClass('disabled')
    $('#export-gpx').removeClass('disabled')
    $('#export-openrally-gpx').removeClass('disabled')
  }

  openRoadBook(append = false) {
    var _this = this;
    globalNode.dialog().showOpenDialog({
      filters: [
        { name: 'tulip', extensions: ['tlp'] }
      ]
    }).then(openInfo => {
      if (openInfo.canceled) return;

      var fs = globalNode.fs;
      var fileNames = openInfo.filePaths;

      if (fileNames === undefined)
        return;

      _this.loadRoadBook(fileNames[0], append)
    });
  }

  exportGPX() {
    if (this.canExport()) {
      var gpx = this.io.exportGPX();
      var filename = this.roadbook.filePath.replace('tlp', 'gpx');
      globalNode.fs.writeFile(filename, gpx, function (err) { });
      $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
      alert('Your gpx has been exported to the same directory you saved your roadbook');
    } else {
      alert('F@#k1ng Kamaz! You must save your roadbook before you can export GPX tracks');
    }
  }

  exportOpenRallyGPX() {
    if (this.canExport()) {
      var gpx = this.io.exportOpenRallyGPX();

      var filename = this.roadbook.filePath.replace('.tlp', '-openrally.gpx');

      globalNode.fs.writeFile(filename, gpx, function (err) { });

      console.log("exported openrally gpx to", filename);

      $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
      alert('Your gpx has been exported to the same directory you saved your roadbook');
    } else {
      alert('F@#k1ng Kamaz! You must save your roadbook before you can export GPX tracks');
    }
  }

  importGPX() {
    var _this = this;

    globalNode.dialog().showOpenDialog({
      filters: [
        { name: 'import gpx', extensions: ['gpx'] }
      ]
    }).then(openInfo => {
      var fileNames = openInfo.filePaths;

      if (fileNames === undefined)
        return;

      _this.startLoading();

      $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');

      var fileName = fileNames[0];
      console.log("Reading GPX file:", fileName);

      globalNode.fs.readFile(fileName, 'utf-8', function (err, data) {
        try {
          _this.io.importGPX(data);
        } catch (error) {
          console.error(error);
        }
      });
    });
  }

  printRoadbook() {
    if (this.canExport()) {
      $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
      this.ipc.send('ignite-print', app.roadbook.statelessJSON());
    } else {
      alert('You must save your roadbook before you can export it as a PDF');
    }
  }

  saveRoadBook() {
    try {
      if (this.roadbook.filePath == null) {
        // Request documents directory path from node
        this.ipc.send('get-documents-path');
      } else {
        this.roadbook.finishInstructionEdit();
        this.fs.writeFile(this.roadbook.filePath, JSON.stringify(this.roadbook.statefulJSON(), null, 2), function (err) { });
      }
    } catch (error) {
      console.error(error);
    }
  }

  saveRoadBookAs() {
    if (this.roadbook.filePath == null) {
      // Request documents directory path from node TODO we really only need to do this once...
      this.ipc.send('get-documents-path');
    } else {
      this.showSaveDialog('Save roadbook as', this.roadbook.filePath)
    }
  }

  showSaveDialog(title, path) {
    var _this = this;

    globalNode.dialog().showSaveDialog({
      title: title,
      defaultPath: path,
      filters: [{ name: 'tulip', extensions: ['tlp'] }]
    }).then(dialogInfo => {
      var fileName = dialogInfo.filePath;

      if (dialogInfo.canceled)
        return;

      // assign the file path to the json for first time players
      // TODO figure out what to do if the user changes the name of the file
      var tulipFile = _this.roadbook.statefulJSON();
      tulipFile.filePath = fileName;
      _this.roadbook.filePath = fileName;
      tulipFile = JSON.stringify(tulipFile, null, 2);

      _this.fs.writeFile(fileName, tulipFile, function (err) { });

      console.log("Saved roadbook to ", fileName);

      return true;
    });
  }

  startLoading() {
    $('#loading').show();
    google.maps.event.addListener(this.mapController.map, 'idle', this.stopLoading); //TODO pass to map controller with callback
  }

  stopLoading() {
    $('#loading').hide();
  }

  initMap() {
    this.mapModel = new MapModel();
    this.mapController = new MapController(this.mapModel);
    this.mapController.placeMapAttribution();
    if (this.settings.loadLastRoadbook) {
      this.openLastRoadBook();
    }
  }

  toggleRoadbook() {
    $('.roadbook-container').toggleClass('collapsed');
    $('.roadbook-container').toggleClass('expanded');

    $('#toggle-roadbook i').toggleClass('fi-arrow-down');
    $('#toggle-roadbook i').toggleClass('fi-arrow-up');
  }

  newRoadbook() {
    app.roadbook.name('New Roadbook');
    app.roadbook.desc('Roadbook description');
    app.roadbook.totalDistance(0);
    this.roadbook.filePath = null;

    while (true) {
      try {
        app.mapModel.deletePointFromRoute(0);
        app.mapModel.deleteInstructionFromRoadbook(0);
      }
      catch (error) {
        break;
      }
    }
  }

  saveSettings() {
    const settings = {};
    settings.loadLastRoadbook = $('#open_last').prop('checked');
    settings.gmapKey = $('#gmap_key').val();
    settings.googleDirectionsKey = $('#google_directions_key').val();
    settings.openDevConsole = $('#open_dev_console').prop('checked');
    try {
      settings.tulipNearDistance = parseInt($('#tulip_near_distance').val());
    } catch (ex) {
      console.log(ex);
      settings.tulipNearDistance = 300;
    }
    settings.showCapHeading = $('#show_cap_heading').prop('checked');
    settings.showCoordinates = $('#show_coordinates').prop('checked');
    settings.coordinatesFormat = $('#coordinates_format').find(":selected").val();
    localStorage.setItem('settings', JSON.stringify(settings));
    app.settings = settings;
    $('.off-canvas-wrap').foundation('offcanvas', 'hide', 'move-left');
    this.refreshInstructionElements();
  }

  loadSettings() {
    const settings = JSON.parse(localStorage.getItem('settings') ?? "{}");
    $('#open_last').prop('checked', settings.loadLastRoadbook ?? false);
    $('#gmap_key').val(settings.gmapKey ?? '');
    $('#google_directions_key').val(settings.googleDirectionsKey ?? '');
    $('#open_dev_console').prop('checked', settings.openDevConsole ?? false);
    $('#tulip_near_distance').val(settings.tulipNearDistance ?? 300);
    $('#show_cap_heading').prop('checked', settings.showCapHeading ?? false);
    $('#show_coordinates').prop('checked', settings.showCoordinates ?? false);
    $('#coordinates_format').val(settings.coordinatesFormat ?? 'ddmmss');

    if (settings.openDevConsole) {
      this.ipc.send('toggle-dev-tools');
    }

    if (settings.gmapKey == '' || settings.hasOwnProperty("gmapKey") == false) {
      window.alert("You must set your google maps key in settings and restart the app.");
      $('.off-canvas-wrap').foundation('offcanvas', 'show', 'move-left');
    }
    return settings;
  }

  refreshInstructionElements() {

  }
  /*
    ---------------------------------------------------------------------------
    Roadbook Listeners
    ---------------------------------------------------------------------------
  */
  initListeners() {

    var _this = this

    $('#toggle-roadbook').click(function () {
      _this.toggleRoadbook();
      $(this).blur();
    });

    $('#save-roadbook').click(function (e) {
      e.preventDefault();
      if (_this.canSave()) {
        $(this).addClass('secondary');
        if (e.shiftKey) {
          _this.saveRoadBookAs();
        } else {
          _this.saveRoadBook();
        }
      }
      $(this).blur();
    });

    $('#save-settings').click(function () {
      _this.saveSettings();
    });

    $('[name="toggle-insert-type"]').change(function () {
      $('.track-selection').toggleClass('hidden');
      $('.glyph-selection').toggleClass('hidden');
    });

    /*
      escape key exits delete modes
    */
    $(document).keyup(function (e) {
      if (e.keyCode == 27) {
        if (_this.roadbook.currentlyEditingInstruction) {
          _this.roadbook.currentlyEditingInstruction.tulip.finishRemove();
          _this.roadbook.currentlyEditingInstruction.tulip.beginEdit();
        }
        if (_this.mapController.markerDeleteMode == true) {
          // TODO move this to the map controller
          var marker = _this.mapModel.markers[_this.mapModel.deleteQueue.pop()];
          _this.mapController.returnPointToNaturalColor(marker);
          _this.mapController.markerDeleteMode = false;
        }
      }
    })

    /*
      We're adding IPC listeners in here I guess eh?

      This super duper needs to be cleaned up
    */
    // Listener to get path to documents directory from node for saving roadbooks
    // NOTE only use this for roadbooks which haven't been named
    this.ipc.on('documents-path', function (event, arg) {
      var path = arg + '/';
      path += _this.roadbook.name() == 'Name your roadbook' ? 'Untitled' : _this.roadbook.name().replace(/\s/g, '-')
      _this.showSaveDialog('Save roadbook', path)
    });

    this.ipc.on('save-roadbook', function (event, arg) {
      _this.saveRoadBook();
    });

    this.ipc.on('save-roadbook-as', function (event, arg) {
      _this.saveRoadBookAs();
    });

    this.ipc.on('open-roadbook', function (event, arg) {
      _this.openRoadBook();
    });

    this.ipc.on('append-roadbook', function (event, arg) {
      _this.openRoadBook(true);
    });

    this.ipc.on('reload-roadbook', function (event, arg) {
      location.reload();
    });

    this.ipc.on('toggle-roadbook', function (event, arg) {
      _this.toggleRoadbook();
    });

    this.ipc.on('import-gpx', function (event, arg) {
      _this.importGPX();
    });

    this.ipc.on('export-gpx', function (event, arg) {
      _this.exportGPX();
    });

    this.ipc.on('export-openrally-gpx', function (event, arg) {
      _this.exportOpenRallyGPX();
    });

    this.ipc.on('export-pdf', function (event, arg) {
      _this.printRoadbook();
    });

    this.ipc.on('zoom-in', function (event, arg) {
      _this.mapController.zin();
    });

    this.ipc.on('zoom-out', function (event, arg) {
      _this.mapController.zout();
    });

    this.ipc.on('add-glyph', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.glyphControls.showGlyphModal(30, 30);
      }
    });

    this.ipc.on('add-track-0', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(0);
      }
    });

    this.ipc.on('add-track-45', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(45);
      }
    });

    this.ipc.on('add-track-90', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(90);
      }
    });

    this.ipc.on('add-track-135', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(135);
      }
    });

    this.ipc.on('add-track-180', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(180);
      }
    });

    this.ipc.on('add-track-225', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(225);
      }
    });

    this.ipc.on('add-track-270', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(270);
      }
    });

    this.ipc.on('add-track-315', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.currentlyEditingInstruction.tulip.addTrack(315);
      }
    });

    this.ipc.on('set-track-hp', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.changeEditingInstructionAdded('offPiste');
        $('.added-track-selector').removeClass('active');
        $($('.added-track-selector')[0]).addClass('active');
      }
    });

    this.ipc.on('set-track-p', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.changeEditingInstructionAdded('track');
        $('.added-track-selector').removeClass('active');
        $($('.added-track-selector')[1]).addClass('active');
      }
    });

    this.ipc.on('set-track-pp', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.changeEditingInstructionAdded('road');
        $('.added-track-selector').removeClass('active');
        $($('.added-track-selector')[2]).addClass('active');
      }
    });

    this.ipc.on('set-track-ro', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.changeEditingInstructionAdded('mainRoad');
        $('.added-track-selector').removeClass('active');
        console.log($('.added-track-selector')[3]);
        $($('.added-track-selector')[3]).addClass('active');
      }
    });

    this.ipc.on('set-track-dcw', function (event, arg) {
      if (_this.roadbook.currentlyEditingInstruction) {
        _this.roadbook.changeEditingInstructionAdded('dcw');
        $('.added-track-selector').removeClass('active');
        $($('.added-track-selector')[4]).addClass('active');
      }
    });

    this.ipc.on('new-roadbook', function (event, arg) {
      var nr = window.confirm("Start a new roadbook? Unsaved changes will be lost");
      if (nr) {
        _this.newRoadbook();
      } ``
    });

    this.ipc.on('open-settings', function (event, arg) {
      $('.off-canvas-wrap').foundation('offcanvas', 'show', 'move-left');
    })

    this.ipc.on('show-about-info', function (event, arg) {
      $('#about').foundation('reveal', 'open');
    });

    window.addEventListener("beforeunload", function (event) {
      if (_this.roadbook.filePath) {
        var rb = JSON.stringify(this.roadbook.statefulJSON(), null, 2);
        var save = _this.dialog.showMessageBox({ message: "Would you like to save before closing? All unsaved changes will be lost.", buttons: ['ok', 'nope'], type: 'question' });
        if (save == 0) {
          _this.fs.writeFile(_this.roadbook.filePath, rb, function (err) { });
        }
      }
    });
  }
};
