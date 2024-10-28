
#  Tulip
<div align="center">
  <img src="assets/tulip-logo3.png" width="100" height="100" align="right"/>
</div>
An editor for rally roadbooks built in the electron atom environment using web technologies

It is a fork of https://github.com/storm-factory/tulip

****

Features:
* Import GPX file
* Plan route on map
* Export route GPX and OpeRally GPX
* Print/Export roadbook PDF
* Works on Linux/Mac/Windows


## Install and run
### To download and use for local development
1. Install [Node.js](https://nodejs.org/)
2. Add your mapping api keys to `api_keys.js.example`, then rename to `api_keys.js`
3. Navigate to local working directory `$ cd tulip`
4. Launch electron `npm start`

### To download, package, and use for fun
1. Install [Node.js](https://nodejs.org/)
2. Download the latest stable release
3. Add your mapping api keys to `api_keys.js.example`, then rename to `api_keys.js`
4. Navigate to local working directory `$ cd tulip`
5. Use `build_tulip.sh` to create a packages
