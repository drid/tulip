
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
* Export route GPX and OpenRally GPX
* Print/Export roadbook PDF
* Works on Linux/Mac/Windows

**[Instruction manual](http://drid.gitlab.io/tulip)**

## Install
### Using Release artifacts
You may download Tulip from the available [releases on GitLAB](https://gitlab.com/drid/tulip/-/releases)

There are binaries in the form of:
* RPM
* DEB
* AppImage
* Snap
* Windows executables

### Using snap store

[![Get it from the Snap Store](https://snapcraft.io/en/light/install.svg)](https://snapcraft.io/tulip-roadbook)

or from console:
```bash
sudo snap install --edge tulip-roadbook
```

### Build and install
You will need [inkscape](https://inkscape.org/) installed on your system

Clone or download the repository and go to source code folder
```bash
# Install node modules
npm install
# Generate SVGs
npm run convert-svg
```
Available build commands are:
```bash
# All linux binaries
npm run build-linux
# Windows binaries
npm run build-win
# Mac
npm run build-mac
```
also for specific Linux package type you can use electron builder directly
```bash
# AppImage
npx electron-builder --linux appimage
# Snap
npx electron-builder --linux snap
# DEB
npx electron-builder --linux deb
# RPM
npx electron-builder --linux rpm
```
## 🐛 Reporting Issues

If you find a bug, please report it in the GitLab Issues section:  
[https://gitlab.com/drid/tulip/-/issues](https://gitlab.com/drid/tulip/-/issues)
## 🤝 Contributing

We welcome contributions! Please submit all merge requests to our **GitLab repository** at:  
[https://gitlab.com/drid/tulip](https://gitlab.com/drid/tulip)  

The GitHub repository is a **read-only mirror** and does not accept contributions.

For guidelines on contributing, see [CONTRIBUTE.md](CONTRIBUTE.md).

## LICENSE

Tulip is licensed under GPLv2 (see [LICENSE](LICENSE) for full text)

The Liberation Sans font is included in this project.
Copyright (c) 2007, Red Hat, Inc. All rights reserved.
Licensed under the Liberation Font License (see [LIBERATION_LICENSE](LIBERATION_LICENSE) for full text).

## Attributions

### Icons
- [Recycle icons created by Freepik - Flaticon](https://www.flaticon.com/free-icons/recycle)
- [Restriction icons created by Nuricon - Flaticon](https://www.flaticon.com/free-icons/restriction)
- [Roadworks icons created by Muhammad Ali - Flaticon](https://www.flaticon.com/free-icons/roadworks)
- [Fort icons created by DinosoftLabs - Flaticon](https://www.flaticon.com/free-icons/fort)
- [Statue icons created by Freepik - Flaticon](https://www.flaticon.com/free-icons/statue)
- [Cow icons created by Freepik - Flaticon](https://www.flaticon.com/free-icons/cow)
- [Camel icons created by PLANBSTUDIO - Flaticon](https://www.flaticon.com/free-icons/camel)
- [Deer icons created by Freepik - Flaticon](https://www.flaticon.com/free-icons/deer)
- [Horse icons created by Freepik - Flaticon](https://www.flaticon.com/free-icons/horse)
- [Wolf icons created by Park Jisun - Flaticon](https://www.flaticon.com/free-icons/wolf)
- [Bear icons created by Freepik - Flaticon](https://www.flaticon.com/free-icons/bear)
- [Bush icons created by Iconjam - Flaticon](https://www.flaticon.com/free-icons/bush)
- [Bush icons created by Freepik - Flaticon](https://www.flaticon.com/free-icons/bush)
- [Traffic lights icons created by xnimrodx - Flaticon](https://www.flaticon.com/free-icons/traffic-lights)