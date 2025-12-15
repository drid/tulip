# Tulip: Rally Roadbook Editor

## Overview
Tulip is a powerful and user-friendly editor designed specifically for creating and managing rally roadbooks. Built using the Electron framework and leveraging modern web technologies, Tulip provides a seamless cross-platform experience for rally enthusiasts, navigators, and event organizers. Whether you're planning a rally route or generating professional roadbook documentation, Tulip streamlines the process with an intuitive interface and robust functionality.

## Key Features
- **GPX File Import**: Easily import GPX files to start building or refining your rally routes.
- **Interactive Route Planning**: Plan and visualize routes directly on an integrated map interface, ensuring precision and clarity.
- **Streetview helper**: Provides google streetview for instructions.
- **Flexible Export Options**: Export routes in both standard GPX and OpenRally GPX formats for compatibility with various navigation systems.
- **Professional Roadbook Output**: Generate high-quality roadbook PDFs ready for printing or digital distribution, tailored to rally standards.
- **Cross-Platform Compatibility**: Runs smoothly on Linux, macOS, and Windows, providing a consistent experience across all major operating systems.
- **User glpyhs**: Allows for user images and icons to be used as glyphs

Tulip is designed to empower rally teams with the tools needed to create accurate and professional roadbooks efficiently, making it an essential companion for rally planning and execution.

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