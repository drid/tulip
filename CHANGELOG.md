# Changelog

All notable changes to this project will be documented in this file.

## [1.9.6] - 2025-07-28

### 🐛 Bug Fixes

- Roadbook logo removal
- Glyphs not detected during edit

### 🚜 Refactor

- Update Quill

## [1.9.5] - 2025-06-10

### 🚀 Features

- Add option to set map home location
- Zoom to entire track when opening roadbook

### ⚙️ Miscellaneous Tasks

- Cleanup glyphs

## [1.9.5-4] - 2025-06-07

### 🚀 Features

- Feat(glyphs) Add glyphs for animals, sand, dunes and more


- *(tulip)* Add track type Low/Less visible
- *(tulip)* Rename track types

### 🐛 Bug Fixes

- *(note)* Glyph file in all caps is not detected and causes exception
- Keep roadbook visible when opening file
- Disable save roadbook button when editing instruction
- Handle unknown track type and default to 'track'

### 💼 Other

- Add test for low vis track



## [1.9.5-3] - 2025-06-04

### 🚀 Features

- *(glyphs)* Add MODIF and NEW NOTE

### 🐛 Bug Fixes

- Add track handles only to track items
- Handle PDF output errors and show message
- *(CI)* Glyphs not converted in win builds

### 💼 Other

- Update changelog for 1.9.5-3

## [1.9.5-2] - 2025-06-02

### 🚀 Features

- Delete glyph using del/backspace key or Button
- Add changelog popup
- Feature: Populate app changelog
refactor: Cleanup code


- *(tulip)* Handle track removal via Key/Button
- Extra track defaults to entry track type
- Add custom logo on roadbook header

### 🐛 Bug Fixes

- *(tulip)* Main track color are black sometimes when opening old roadbooks
- PDF export showing overlay of printing
- Missing glyph detection on snap, Snap release file name in CI

### 💼 Other

- Update changelog

### 🚜 Refactor

- Remove global variables and unused code

### 📚 Documentation

- Update README with installation instructions, revise contribute.md, remove build script

## [1.9.5-1] - 2025-05-31

### 🐛 Bug Fixes

- Replace missing glyphs with default image

### 💼 Other

- CI not creating releases

## [1.9.5-0] - 2025-05-30

### 🚀 Features

- *(version)* Add app version display and storage
- *(glyphs)* Add multiple new glyphs
- *(glyphs)* Add distance and dune level glyphs

### 🐛 Bug Fixes

- Fix: map bubble update
closes #37



### 💼 Other

- Remove prepack script


- Release only on master branch tag
Build on MR to master


- WP UI values stored in roadbook

## [1.9.4] - 2025-05-29

### 🚀 Features

- *(glyphs)* Add service zone, above bridge, under bridge, and concrete pass glyphs
- *(packaging)* Stage and convert SVGs in custom build script
- Add abbreviations
- *(glyphs)* Add multiple new glyphs
- *(speed-limit)* Add generator and update glyphs

### 🐛 Bug Fixes

- *(ui)* Resolve issues with map orientation and tulip exit edit buttons
- *(CI)* Convert svg files

### ⚙️ Miscellaneous Tasks

- *(config)* Add cliff.toml and initial CHANGELOG.md for changelog generation

## [1.9.3] - 2025-03-12

### 💼 Other

- Add contribute guidelines


- Move map init to application.js
Add map proxy


- Resolve "Add waypoint number in notes"

## [1.9.2-0] - 2025-03-01

### 💼 Other

- Fix missing assets
Fix snap publish



## [1.9.2] - 2025-02-28

### 💼 Other

- Make print window modal


- Remove Letter from print options
Fix last instruction missing border on A5
Remove print window menu
Show printing indication on print window


- Resolve "Improve roadbook header"
- Add sentry
Update CI



## [1.9.1] - 2025-01-22

### 💼 Other

- Sync PDF coloring


- Add fuel range info
Format route info on print page


- Set common styles (print/app)
Add zeroes under distance when reset



## [1.9.0] - 2025-01-17

### 💼 Other

- Resolve "Placement of waypoint and control icons"
- Format code and css
Remove foundation icons from source


- Fix heading and coordinate positioning
Fix note editor positioning
Make heading/coordinates faded when disabled


- Reindex instruction on file load
Remove roadbook empty space at the bottom


- Fix typo in README.md
- Add open radius and validation radius to instruction
Update instruction controls
Update map bubbles to show both radius


- Export modules needed for testing when not in electron
Add CI for unit testing


- Add waypoint delete functionality


- Add speedzone coloring


- Fix new roadbook not deleting bubbles on map
Add coloring for danger levels
Fix speedzone not updating after edit


- Add checkpoint numbering
Change selected instruction border


- Implement distance reset function
Fix CSS of last instruction



## [1.8.7] - 2025-01-08

### 💼 Other

- Fix crash on first run with empty settings
Show alert on empty gmap key


- Fix print imports
Add "about" information


- Resolve "Fix map rotation"
- Set version to 1.8.7
Set snap name



## [1.8.6] - 2025-01-06

### 💼 Other

- Replace foundation, jquery, knockout and quill with node modules


- Bump electron to 29


- Add "new roadbook" menu item


- Make ! red


- Update glyph for compression control point dip ditch speed start/end


- Add icons for control
Add icons for waypoints
Update icons for speed zone
Add color to important icons
Add visibility text icon
Remove redundant CX icon



## [1.8.5] - 2024-12-25

### 💼 Other

- Add contributor
Fix bug on cancel loading roadbook
Do not open dev tools on launch
Open last roadbook on launch


- Add button to control coordinate visibility


- Add CI
Update README


- Merge branch 'CI' into 'master'

Add CI

See merge request drid/tulip!3
- Resolve "Loading a roadbook merges with the existing one"
- Add application settings

## [1.8.4] - 2024-10-20

### 🐛 Bug Fixes

- Fixing bug with notifications and adding tape for unit tests
- Fixed minor bug with filename spaces
- Fixing bugs
- Fixing more dependency issues, cant wait to unravel the roadbook model
- Fixing more dependency issues with io, decided to revert the patter naming to MVC since that is close to what it is. so wishy washy
- Fixing some minor bugs and cleaning up some CSS
- Fixing openrally.org conflicts
- Fixing some more bugs from refactor and some other existing ones
- Fix filename error for openrally export
- Fixed margins for A5

### 💼 Other

- Changed test harness to tap for build because it is more terse
- Added a couple more unit tests to track
- Added waypoint notificaion modifiers, made bubbles clickable
- Added inline documentation for notifications and fixed bug with fss wpt.
- Added tests for track and notification
- Redesign bubble ui and cleaned up palette some
- Adding new glyphs
- Removed test frameworks going to refactor and start testing from scratch
- Readding test directory
- Adding some comments about refactor
- Started mvc refactor with migrating the map-controls module into the map-controller and routing all UI interaction with map through there to the soon to be map-model
- Continuing development on map controller and model interface
- Got the presenter and model for the map view pretty much dialed. lock doesnt work right and still need some refactoring especially in the presenter. also still needs interface to roadbook
- Continuing refactor of mapping
- Continuing work on model refactor
- Trying the whole tape/tap thing again, still need to refactor map model to make it more testable
- More map refactoring
- Further refactoring of mapping module
- More map model refactoring and we added out first set of tests
- Added another test to the map model and did some more refactoring
- Added more unit tests and fixed some bugs caused be the refactor
- Some refactoring
- More tests and bugs and refactoring
- More refactoring, added tests for waypoint bubbles and delete queue processing to map model
- Just some comments
- A couple more unit tests
- More refactoring and test coverage
- More unit tests
- Adding more tests and refactoring
- More tests and a readme update
- More tests and refactoring
- Cleaning up integrations did some refactoring, need to do more testing on the map model
- Added quotes to example
- Added support for exporting OpenRally enhanced GPX
- Merge pull request #1 from dpeckham/master

OpenRally.org integration
- Maybe fixing a bug with gpx exports, unable to repro but think it was type comparison related
- Updating build script to use tests again
- Set theme jekyll-theme-cayman
- Create CNAME
- Delete CNAME
- Merge branch 'master' of github.com:storm-factory/tulip
- Added swinging gate
- Merge pull request #2 from LukeJBennett/change_glyphs

added swinging gate
- Ignore node_modules
- Merge pull request #4 from dpeckham/master

Fix OpenRally 0.1 filename/path bug
- Init rev, auto generated lexicon key
- Removed white background features
- Added a5 roll printing
- Added whitney digit (outlined hundredths)
- Added outline digit and separated page length from format
- Cleaned up printing, used approx FIM format
- Yet another cleanup
- Found cleaner way of setting print margins
- Merge branch 'master' into lexicon_key
- Cleaned up javascript, launches print from main app
- Split out js and css into separate files
- Merge pull request #3 from LukeJBennett/lexicon_key

init rev, auto generated lexicon key
- Upgrade to electon 23 in progress.

Most functionality works. Can import GPX, export GPX, print to PDF, load and save .tlp file, and work with the map.
Save as and Export OpenRally GPX not fixed yet.
Needs a lot of cleanup.
- Update readme
- Fix autotrace
- Fix remaining functionality & clean up
- Add DevContainer
- Update code for electron 23
Add build script for linux


- Add builders
Update README


- Add builders
Update README


- Merge branch 'feature/build'
- Change click to dblclick for edit
Click focuses and orients map
Add wp highlight
- Fix scroll to instruction
Doubleclick to edit instruction


- Highlight CAP


- Colorize short distances


- Fix coloring
Fix frames
Show instruction number
Add coordinates to notes


- Rearrange roadbook name buttons
Remove bellybeans font


- Make track blue


- Fix A5 printing with colors
Rearrange page header
Add waypoint count to header


- Fix Roll output scale


- Fix Roll print bleeding to an empty page
Add Total distance and waypoint count block ate the bottom
Move tulip logo to the footer
Add git links


- Add color to speed limit icons


- Update README
Update version



### 🚜 Refactor

- Refactored viewport optimizer and added unit tests

### 🧪 Testing

- Test coverage is now good enough for government work

## [1.7] - 2017-02-27

### 🐛 Bug Fixes

- Fixing issues with track layering
- Fixes for map lock and roll printing

### 💼 Other

- Added some glyphs, fixed some names, fixed a huge bug with track exits, added a prompt to route tracing
- Updating package and fixing bug where relative distance wasnt always updating
- Adding viewport optimizer back in
- Working on toggle cap
- Just need to add show heading to the print application
- Adding hide cap to printing
- Adding save prompt when closing
- Tweaking save on quit, and also adding escape from delete modes
- Adding wash bends and also making some fixes to the viewport optimizer
- Changed search function
- Cliff glyph
- Getting rid of quill for note editor and updating quill for roadbook description
- Making more changes to the editor
- Buying into new note editor UI buy bye quill
- This turned into a palette redesign but I think the UI/UX is much improved
- Wired up listeners, did some minor cleanup, added style buttons to text editor
- Added menus and shortcuts, some styling changes, track selection indicator class
- Adding new glyphs and some new menu items
- Adding zoom in and zoom out
- Package version
- Merge branch 'note-text-editor'

## [1.6.0] - 2017-01-11

### 🐛 Bug Fixes

- Fixing road type size mismatch, bad edit mode when changing track type, and gpx export error
- Fixing end cap adjustment
- Fixing track selection problemo when holding shift key

### 💼 Other

- Styling fix for my windows friends
- Added function to check linearity of track
- Starting to figure out track transformation
- Still working on transformations, pretty confusing and hard
- Finally made some meaningful headway on track translations
- Rotations are dialed, still need to multiply by a scaling matrix
- Cleaning up rotation function
- Dialed in scaling and rotation
- Added build script and resizer fix

### 🚜 Refactor

- Refactor for the track editor to make it more solid, added some commenting to the track class as well
- Refactoring track editor

## [1.5] - 2016-12-22

### 🐛 Bug Fixes

- Fixing issues with removing glyphs
- Fixing various things with the track editors
- Fixing a regex bug and just general notification cleanup

### 💼 Other

- Print tweaks and glyph layering
- Dialing in resizable glyphs
- Churching up UI a little and syncing JS and CSS for note display and editor
- Working on UI for glyphs in the note section
- Note glyph UI/UX
- More note glyph UI/UX
- Working on printing, and adding main road type to tulips
- Trying to add track object and reconfigure tulip rendering
- Huge rework trying to come up with something dynamic and SOLID for track types
- Dialing in track editing a little more, also added files i forgot in last commit
- Adding tracks with dynamic types roughed out pretty good. still need to impliment angle change for exit track and also changing type
- Working on track change process and working bugs out of track editing
- Figured out weirdness with origins and ends. their left and top was relative to their group, not the canvas so that had to be corrected for
- Working on exit angle update
- Getting rid of fabric groups for tracks and managing data with bespoke structure
- Trying new method of path management
- Track instantiation, loading, and editing is working. still need to do removing and saving
- Converting remover to es6 and making work again for new track structure
- Deserializing tracks
- Adding glyph deserialization, ordering is still off.
- Deserialized rendering is looking good
- Added dcw road type, wired it to the UI, dialed in code for track persistence
- Merge branch 'road-and-dcw'
- Starting bubble UI and notification cleanup
- Dialing in wpm UI, not sure why it gets set to null after every edit
- Working on notifications, fixed bug with waypoint lat lon updates
- Roadbook changes
- Added chriss new glyphs, well some, and roughed out notification persistance
- Changing css for chris icons
- Updating glyphicons
- Continuing work on notifications
- Cleaned up glyph notifications to be more dry, seeing one weird error with the DOM when all glyphs are deleted but cannot reliably repro
- Adding speed zone support and cleaning up notifications, found out the weird bug was related to tulip.css line height conflicting with quill.js dynamic line height or css line height. removed tulip.css line height for now
- Minor glyph in note fixes and minor print fixes
- Adding new speed glyphs, cleaning up notification and input output module

## [1.4b] - 2016-08-24

### 🐛 Bug Fixes

- Fixed param bug in control point call
- Fixing bugs with measuring and made points triangles instead of circles
- Fixed a couple bugs with the distance computations, started to impliment waypoint management, left some notes about design patterns worth considering
- Fixed tulip editing and finish editing workflow
- Fixed some bugs with importing a saved roadbook
- Fixed minor issues with note palette control
- Fixing markdown image
- Fixing bugs with prev distance and import
- Fixed up track type selection to be more visual
- Fixing a couple of glyphs
- Fixes for windows distribution
- Fixing issue for printing on windows 10
- Fixing filepath error for roadbooks on initial save
- Fixing fonts on glyphs, fixing export issue, adding rich text editor to instruction
- Fixing issues with route handles, glyph adding to note, and added some comments
- Fixing small error in print binding
- Fixing bugs with map editor
- Fixed UI bugs in print, roadbook pallette for windows, and attribution assignment
- Fixed error in glyph undo and added map layers
- Fixing exit track type overwrite
- Fixing minor bug with delete mode
- Fixing minor bug in find prev waypoint function

### 💼 Other

- Initial commit
- Initial commit
- Added fabric library and js class library, messed with segment dragging and dropping. finally getting somewhere.
- Integrated function for curve interpolation, test drove paperjs
- Messing with parametric interpolation driven by the onchange event, very likely that we need to loop through the path and smooth for all points instead of having each handle modify knots along the entire path.
- Moved interpolation into one overcomplet function which can be reduced but it effing works!
- Simplified commented and organized interpolation function
- Preliminary endpoint roatation math
- Endpoint dialed!
- Added listener to tracks, refactored tulip structure, added listener for track editing
- Integrated electron to make tulip a desktop app and add io capability
- Integrating backbone js library, stubbing out roadbooks and waypoints
- Waypoint templates
- Ditched backbone in favor of riot since backbone is rest oriented and i didnt feel like rewriting part of it
- Updated waypoint template waypoint model and roadbook model. started learning open layers drawing
- Exchanged ol for google maps as I came up with a way to synthisize rotation without compromising UX and ol interactivity was above my head.
- Added new foundation color palette, and some mapping functionality related to drawing routes
- Taking a different approach to polyline editing and instead of using vertecies do everything with markers and my own listeners. no idea what this is going to do to performance....
- Adding some measuring functionality and code cleanup and commenting to the mapping section
- Implimented splicing of new verticies along the route
- Got vertex dragging event sequence somewhat functional
- Minor mapping cleanup and refactoring
- Route manipulation dialed functionality wise, now on to waypoints
- Started wiring up interfaces and trying to observe common design patterns to keep the app decoupled and cohesive
- Added provision to delete waypoints, and fine tuned handle UI
- Removed riot, added knockout because of better documentation and handling of data types we are concerned with. implimented distance updating
- Cleaned up some mapping listeners
- Removed template dir since that structure doesnt work with knockout, updated distances to use ko computed function
- More cleanup and styling changes
- Added relative distance form waypoint to waypoint and styled distance text
- Implimented headings and relative angle computing still needs UI
- Heading styling
- Minor refactoring on mapping module, implimented another todo regarding deleting start waypoint
- Changed waypoint id to be computed from its distance which will always be unique
- Huge restyle, trying to get something to render on a canvas dynamically
- Added a groovy font, worked on menu and roadbook display, added some modernized UX because I needed some coding junkfood
- Figured out custom bindings to get tulips to render at the correct time, figured out that what I thought was a scoped class varable actually pollutes the global scope, so that needs to get figured out. maybe move away from jsclass in favor of custom modules or something?
- Worked out polution of global scope, got the track editing module up and running. on to phase 2
- Working on tracks
- Cleaned up base track rendering and editing in tulip, start into functionality to incorporate angle into base track from route
- Implimented track angling upon creation of a waypoint, still needs to update when waypoint angle changes
- Made correction to angle reporting
- Made changes to tulip track editing to make it more dynamic and to also support multiple objects on a single tulip
- Editing controls added, functionality is buggy and UX could use improvement
- Large refactor to clean up the application namespace in preperation for persistance workflow
- Back in the saddle, did some refactoring and updated depricated electron stuff. on to persistance
- Updating the readme
- Added check to enable save when waypoints are added, also began on fleshing out the persistence js object.
- Minor cleaup, worked on roadbook persistence, actually can write files now. still need to work on parsing them
- Added name and description as editable fields for roadbook. values are being saved.
- Included foundation js. created a main menu and started on the open roadbook workflow."
- Holy #$&% we just saved and then opened a roadbook with a map!
- Rendering saved route with waypoints. still semi buggy, needs refactored, and tulips need to be initialized properly
- Trying to work out some bugs with name desc editing
- More refactoring and fixed weird javascript timing bug related to canvas rendering
- Mapping visually checks out but some things are getting built a bit off.
- Changed default zoom, figured out bindings between map and rb
- Working on refactoring needed to properly load tulips from serialized json
- Cleaning up tulip class methods to be more single purpose and to allow for objects to be built from json
- Modifications to tulip module to allow the loading of saved tulips! still some issues with parsing saved js and loading the rb as well as tulip loading but all in all great progress. very close to version 1 alpha. well closer than ever haha
- Big refactor again on the tulip module making tulip creation much more dry, added notes for todo to application and fix a couple tiny bugs
- Removed some logging and fixed waypoint saving. tulips and roadbooks are saving now!
- Added some functions and UI for the tulip editing pallette
- UI work for waypoint editing.
- Wiring up UI for track addition to canvas. still need to bake in track-edit functions and undo/delete
- Added ability to add and edit tracks to tulip and also remove the last added track from the tulip. still need to persist these added in tracks
- Switched to KM only, styled the roadbook info area and added total km. wrote functions to update roadbook km
- Cleaned up track addition, made provisions to load them from json. some minor UI
- Modified tulip module, we are now able to persist added tracks in addition to the main tracks
- Streamlining the save functionality so that file names are a little more intelligent.
- Adding first batch of glyphs
- Added UI for glyph tulip addition, reorganized some css and also html. reorganized svg image collection
- Styling and layout to waypoints
- More layout changes, made a note on a bug related to previous distance
- Worked on front end of adding glyphs to tulip. persistence and loading incomplete
- Added a ton of glyphs and restructured some of the UI
- Added the rest of the glyph sets, need some UI cleanup and glyph cleanup
- Styling and trying to persist glyphs
- Changed glyph image creation to use an object in memory instead of just source, as such we get an object back instead of a weird string and can save it to the glyphs array. Glyph persistence is now saving. still need to write glyph open.
- We are now saving glyphs, fixed bug with file open, found bug with tulip editing if you add another waypoint with the UI, need to work on UI enable/disable
- Started working on the waypoint note. decided to go with a canvas object. need to make some changes to the palette behaviour.
- Css and UI cleanup. added some labels and attempted to make things a little more user friendly
- Minor UI change and god knows what else
- Changed glyph placement controls to be quicker and more intuitive
- Worked on simplifying the UI and dialing in tulip editing workflow
- UI updates to make palette process more waypoint centric. working on figuring out optimal UI/UX for note editing
- Note edit ui is about 80% there, just need to clean things up and improve UX a bit
- Added logo and changes to note section of palette.
- Added logo 2 and updated waypoint note glyphs to use a template and observable array to render images
- Updated readme
- More markdown fun
- More markdown fun
- Refined note add/remove glyph UI
- Minor fix
- More markdown edits
- More markdown edits
- More markdown edits
- More logos
- More markdown edits
- Bugfix
- Minor ui buxfixes
- Added waypoint note to persistence, slight UI tweaks
- Beginning to parse out how to convert the roadbook to pdf
- Refining printing process
- Cleaning up and working towards a good solution for printing.
- Zoom to start of route on file open, dialing in print structure and css
- Added io module, semi refactored printing and tulip file importing started on gpx importing
- Did some refactoring and tried to figure out gpx import a little better
- Working on import, right now its at least as good as good earth, can probably do a little better on waypoints
- Finailized functionality of import, did some wireframing on better waypoint UI
- Added ui behavior to zoom map to waypoint when waypoint is clicked. need to add complimnetary functionality
- Cleaned up some code, added some UI functionality and cleanup, fixed an error with map centering
- Cleaning up some comments and improving UI
- Started working on google maps API bottleneck problem for routes with a TON of points on them
- Made app map a more global variable, included and simplified the simplify library for simplifying path data
- Cleaning up gpx import in io
- Made updates to io to simplify it, made loading spinner
- Moving printing to its own window and transferring data via postMessage, hopefully we can leverage the browser window pdf functions
- Cleaning up print.html ui
- Cleaning up print js
- Removing some logging and fixing bug with imported tulip paths having controls and borders
- Working on pdf printing which is weird, solved some issues with tulip edit UI
- Added sticky nav to print, fixed up css for letter size
- Upgraded electron to v1.2.4, churched up save pdf UI (i guess we dont actually print...), learned more about printingToPdf, started adding functionality to print app to choose paper size for PDF saving
- Working on print app functionality, prints in all sizes but does need to have css adjust for A5
- Working on A5 pdf sizing
- Some UI for pdf export, looking into creating three base track types
- Refining some UI, roughing out UI for track selection
- Cleaned up some UI and some of the roadbook module, worked on tulip module for changing track types. need to add methods in waypoint and listeners at app level to round out that feature
- Ui cleanup and bugfix for roadbook
- Real rough gpx export, now for some code and ui cleanup
- Cleaning up code
- Dialing in map rotation
- UI updates and file system interaction updates
- Added app icons for publishing and also corrected some errors in main.js;
- Adding save as, fixing map orientation
- Changing save as a little
- Added control module for glyph ui
- Stubbing out file system
- Stubbing out file system
- Rudimentatry search ui for glyphs
- Adding notificaitons for file save and fixing breaking changes caused by glyphs refactor
- Cleaned up rotation for map
- Filesystem interaction fix
- Added rte to roadbook name and description. hopefully cleaned some stuff up there
- Added api keys file example, added basic snap to roads functionality
- Adding waypoints to road snap and fixed some issues with io module
- Added qunit framework and wrote tests for IO module, fixed bug in snap to roads, added comments to refactor some of IO module, added path shortening to tulip.js
- Added waypoint unit tests
- Added test for roadbook track type changes after finding and fixing bug with changing typ on first waypoint
- Added tulip angle changes after route points are added, wrote some new tests.
- Huge refactoring to make unit testing work better, still have a ton of refactoring to go to make app more SOLID
- Cleaning up tests, still some weirdness with global scope polution and listeners in the test suite. finished move tulip exit UI
- Adding more unit tests and some cleanup
- Finished basic unit tests for tulip module
- Cleaning up tulip module a little
- Added tests and class for deleting tracks, changed up some UI behavour to support this
- Adding some files i missed and also cleaning up UI for track delete.
- Renamed test files to fit convention, added glyph remover test, added glyph remover functionality
- Roughing out map point multi delete
- Dialing in point multi delete
- Redoing print to be more trad friendly
- Bugfix for exit track on json load, trying new method to fix point add crossover. still not perfect.
- Take one kajillion on trying to reliabily insert a point between two others
- Moved glyph event thing out into its own function
- Starting on map editor tests and refactor
- Minor refactoring of map module
- More map editor refactors
- More refactoring map editor module
- Minor bug fixes for waypoint editing
- Minor annoyance bug fixes
- Dialing in map rotation
- Adding some glyphs and save button behaviour

### 🚜 Refactor

- Refactored map controls into their own module, started on the persistence layer
- Refactoring
- Refactored some file names and added UI for giving road books names and descriptions
- Refactoring mapeditor, roadbook, waypoint and tulip classes so that route generation workflow is consistent between using the UI and opening a saved file
- Refactored the edit workflow and also starting working on binding between palette note input and a waypoints notes
- Refactoring the map editor and adding some more tests for it
- Refactoring map editor module, cleaned up waypoints and io module.
- Refactoring map editor
- Refactored angle calculations, map editor is about done with almost 200 lines removed and is now much simpler and prettier

<!-- generated by git-cliff -->
