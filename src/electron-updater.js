const { app, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const https = require('https');

/**
 * Comprehensive update handler for all Electron package formats
 * Supports: AppImage, Snap, Deb, RPM, Flatpak, Windows (NSIS/Squirrel)
 */

class UpdateManager {
  constructor() {
    this.packageFormat = this.detectPackageFormat();
    this.packageJson = require('../package.json');
    this.currentVersion = app.getVersion();
    
    console.log(`Running as ${this.packageFormat}, version ${this.currentVersion}`);
  }

  /**
   * Detect which package format is running
   */
  detectPackageFormat() {
    if (process.platform === 'win32') {
      return 'windows';
    }
    
    if (process.env.APPIMAGE) {
      return 'appimage';
    }
    
    if (process.env.SNAP) {
      return 'snap';
    }
    
    if (process.env.FLATPAK_ID) {
      return 'flatpak';
    }
    
    // Check if installed via package manager
    if (process.platform === 'linux') {
      const fs = require('fs');
      const execPath = process.execPath;
      
      // Check common installation paths
      if (execPath.includes('/usr/bin') || execPath.includes('/usr/local/bin')) {
        // Try to determine if deb or rpm
        if (fs.existsSync('/etc/debian_version')) {
          return 'deb';
        }
        if (fs.existsSync('/etc/redhat-release') || fs.existsSync('/etc/fedora-release')) {
          return 'rpm';
        }
        return 'linux-other';
      }
    }
    
    return 'portable';
  }

  /**
   * Initialize update checking based on package format
   */
  initialize() {
    switch (this.packageFormat) {
      case 'appimage':
        this.setupAppImageUpdates();
        break;
      
      case 'windows':
        this.setupWindowsUpdates();
        break;
      
      case 'snap':
        this.handleSnapUpdates();
        break;
      
      case 'flatpak':
        this.handleFlatpakUpdates();
        break;
      
      case 'deb':
      case 'rpm':
        this.handlePackageManagerUpdates();
        break;
      
      default:
        this.handleManualUpdates();
    }
  }

  /**
   * AppImage - Full auto-update support via electron-updater
   */
  setupAppImageUpdates() {
    console.log('Setting up AppImage auto-updates');
    
    // Configure from package.json repository field
    // this.configureAutoUpdater();
    
    // Check for updates
    autoUpdater.checkForUpdatesAndNotify();
    
    // Check every 6 hours
    setInterval(() => {
      autoUpdater.checkForUpdates();
    }, 6 * 60 * 60 * 1000);
    
    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info.version);
      dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: `Version ${info.version} is available.`,
        detail: 'The update will be downloaded in the background.',
        buttons: ['OK']
      });
    });
    
    autoUpdater.on('update-downloaded', (info) => {
      dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: `Version ${info.version} has been downloaded.`,
        detail: 'The application will restart to apply the update.',
        buttons: ['Restart Now', 'Later']
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    });
    
    autoUpdater.on('error', (err) => {
      console.error('Update error:', err);
      dialog.showErrorBox('Update Error', 
        'Failed to check for updates. Please try again later.');
    });
  }

  /**
   * Windows - Full auto-update support via electron-updater
   */
  setupWindowsUpdates() {
    console.log('Setting up Windows auto-updates');
    
    // this.configureAutoUpdater();
    
    // Check for updates
    autoUpdater.checkForUpdatesAndNotify();
    
    // Check every 4 hours
    setInterval(() => {
      autoUpdater.checkForUpdates();
    }, 4 * 60 * 60 * 1000);
    
    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info.version);
    });
    
    autoUpdater.on('update-downloaded', (info) => {
      const dialogOpts = {
        type: 'info',
        buttons: ['Restart', 'Later'],
        title: 'Application Update',
        message: process.platform === 'win32' ? info.releaseNotes : info.releaseName,
        detail: `A new version (${info.version}) has been downloaded. Restart the application to apply the updates.`
      };
      
      dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    });
    
    autoUpdater.on('error', (err) => {
      console.error('Update error:', err);
    });
  }

  /**
   * Snap - Updates managed by Snap Store
   */
  handleSnapUpdates() {
    console.log('Running as Snap - updates managed by Snap Store');
    
    // Check if update is available (informational only)
    this.checkManualUpdate().then(updateInfo => {
      if (updateInfo.updateAvailable) {
        dialog.showMessageBox({
          type: 'info',
          title: 'Update Available',
          message: `Version ${updateInfo.latestVersion} is available.`,
          detail: 'Snap will automatically update the application in the background.\n\nTo update manually, run:\nsudo snap refresh ' + this.packageJson.name,
          buttons: ['OK']
        });
      }
    });
  }

  /**
   * Flatpak - Updates managed by Flatpak
   */
  handleFlatpakUpdates() {
    console.log('Running as Flatpak - updates managed by Flatpak');
    
    this.checkManualUpdate().then(updateInfo => {
      if (updateInfo.updateAvailable) {
        dialog.showMessageBox({
          type: 'info',
          title: 'Update Available',
          message: `Version ${updateInfo.latestVersion} is available.`,
          detail: `To update, run:\nflatpak update ${process.env.FLATPAK_ID}`,
          buttons: ['OK']
        });
      }
    });
  }

  /**
   * Deb/RPM - Updates via package manager
   */
  handlePackageManagerUpdates() {
    console.log(`Running as ${this.packageFormat} package - updates via package manager`);
    
    this.checkManualUpdate().then(updateInfo => {
      if (updateInfo.updateAvailable) {
        let updateCommand = '';
        
        if (this.packageFormat === 'deb') {
          updateCommand = `sudo apt update && sudo apt upgrade ${this.packageJson.name}`;
        } else if (this.packageFormat === 'rpm') {
          updateCommand = `sudo dnf upgrade ${this.packageJson.name}`;
        }
        
        dialog.showMessageBox({
          type: 'info',
          title: 'Update Available',
          message: `Version ${updateInfo.latestVersion} is available.`,
          detail: `Current version: ${this.currentVersion}\n\nTo update, run:\n${updateCommand}`,
          buttons: ['Open Releases Page', 'OK']
        }).then((result) => {
          if (result.response === 0 && updateInfo.downloadUrl) {
            shell.openExternal(updateInfo.downloadUrl);
          }
        });
      }
    });
  }

  /**
   * Manual/Portable - Check and notify only
   */
  handleManualUpdates() {
    console.log('Manual update checking');
    
    this.checkManualUpdate().then(updateInfo => {
      if (updateInfo.updateAvailable) {
        dialog.showMessageBox({
          type: 'info',
          title: 'Update Available',
          message: `Version ${updateInfo.latestVersion} is available.`,
          detail: `Current version: ${this.currentVersion}\n\nPlease download the latest version from our releases page.`,
          buttons: ['Download', 'Later']
        }).then((result) => {
          if (result.response === 0 && updateInfo.downloadUrl) {
            shell.openExternal(updateInfo.downloadUrl);
          }
        });
      }
    });
  }

  /**
   * Configure electron-updater from package.json
   */
  configureAutoUpdater() {      
    // Logging
    autoUpdater.logger = require('electron-log');
    autoUpdater.logger.transports.file.level = 'info';
  }

  /**
   * Parse repository info from package.json
   */
  getRepoInfo() {
    const repoUrl = this.packageJson.repository?.url || this.packageJson.repository;
    
    if (!repoUrl) {
      console.warn('No repository URL in package.json');
      return null;
    }
    
    // Parse GitLab URL
    let match = repoUrl.match(/gitlab\.com[/:](.*?)\/(.*?)(\.git)?$/);
    if (match) {
      return {
        provider: 'gitlab',
        owner: match[1],
        repo: match[2],
        url: repoUrl
      };
    }
    
    // Parse GitHub URL
    match = repoUrl.match(/github\.com[/:](.*?)\/(.*?)(\.git)?$/);
    if (match) {
      return {
        provider: 'github',
        owner: match[1],
        repo: match[2],
        url: repoUrl
      };
    }
    
    return null;
  }

  /**
   * Manual version check via GitLab/GitHub API
   */
  async checkManualUpdate() {
    const repoInfo = this.getRepoInfo();
    console.log("REPO INFO:", repoInfo)
    if (!repoInfo) {
      return { updateAvailable: false };
    }
    
    try {
      let apiUrl;
      let headers = { 'User-Agent': this.packageJson.name };
      
      if (repoInfo.provider === 'gitlab') {
        // GitLab API
        apiUrl = `https://gitlab.com/api/v4/projects/${encodeURIComponent(repoInfo.owner + '/' + repoInfo.repo)}/releases`;
        
        if (process.env.GITLAB_TOKEN) {
          headers['PRIVATE-TOKEN'] = process.env.GITLAB_TOKEN;
        }
      } else if (repoInfo.provider === 'github') {
        // GitHub API
        apiUrl = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/releases/latest`;
        
        if (process.env.GITHUB_TOKEN) {
          headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
        }
      }
      
      const data = await this.httpsGet(apiUrl, headers);
      
      let latestVersion, downloadUrl;
      
      if (repoInfo.provider === 'gitlab') {
        const releases = JSON.parse(data);
        latestVersion = releases[0]?.tag_name?.replace('v', '') || this.currentVersion;
        downloadUrl = `https://gitlab.com/${repoInfo.owner}/${repoInfo.repo}/-/releases`;
      } else {
        const release = JSON.parse(data);
        latestVersion = release.tag_name?.replace('v', '') || this.currentVersion;
        downloadUrl = release.html_url;
      }
      
      return {
        updateAvailable: this.compareVersions(latestVersion, this.currentVersion) > 0,
        currentVersion: this.currentVersion,
        latestVersion,
        downloadUrl
      };
      
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return { updateAvailable: false };
    }
  }

  /**
   * Helper: HTTPS GET request
   */
  httpsGet(url, headers = {}) {
    return new Promise((resolve, reject) => {
      https.get(url, { headers }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          // Follow redirect
          return this.httpsGet(res.headers.location, headers)
            .then(resolve)
            .catch(reject);
        }
        
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }

  /**
   * Compare semantic versions
   */
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    
    return 0;
  }

  /**
   * Check for updates on demand (e.g., from menu)
   */
  checkNow() {
    if (this.packageFormat === 'appimage' || this.packageFormat === 'windows') {
      autoUpdater.checkForUpdates();
    } else {
      this.checkManualUpdate().then(updateInfo => {
        if (updateInfo.updateAvailable) {
          // Show update available dialog based on package format
          switch (this.packageFormat) {
            case 'snap':
              this.handleSnapUpdates();
              break;
            case 'flatpak':
              this.handleFlatpakUpdates();
              break;
            case 'deb':
            case 'rpm':
              this.handlePackageManagerUpdates();
              break;
            default:
              this.handleManualUpdates();
          }
        } else {
          dialog.showMessageBox({
            type: 'info',
            title: 'No Updates',
            message: 'You are running the latest version.',
            detail: `Version: ${this.currentVersion}`,
            buttons: ['OK']
          });
        }
      });
    }
  }
}

// Export singleton
module.exports = new UpdateManager();
