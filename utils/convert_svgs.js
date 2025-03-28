const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const xml2js = require('xml2js');

async function hasTextElements(svgPath) {
  const svgContent = await fs.readFile(svgPath, 'utf8');
  const parser = new xml2js.Parser({ explicitArray: false });
  const svgObj = await parser.parseStringPromise(svgContent);

  function checkForText(obj) {
    if (!obj || typeof obj !== 'object') return false;
    if (obj.text || obj.tspan) return true;
    return Object.values(obj).some(value => checkForText(value));
  }

  return checkForText(svgObj.svg);
}

async function convertSvgs(projectRoot) {
  const srcSvgDir = path.join(projectRoot, 'src', 'svg', 'glyphs');
  const buildSvgDir = path.join(projectRoot, 'assets', 'svg', 'glyphs');

  // Create assets/svgs directory if it doesn’t exist
  await fs.mkdir(buildSvgDir, { recursive: true });

  // Check if Inkscape is available
  try {
    execSync('inkscape --version', { stdio: 'ignore' });
  } catch (e) {
    console.error('Error: Inkscape is required. Install it and ensure it’s in your PATH.');
    process.exit(1);
  }

  // Process SVGs from src/svgs
  if (!(await fs.stat(srcSvgDir)).isDirectory()) {
    console.warn(`Source SVG directory not found: ${srcSvgDir}`);
    return;
  }

  const svgFiles = (await fs.readdir(srcSvgDir)).filter(file => file.endsWith('.svg'));

  for (const svgFile of svgFiles) {
    const srcPath = path.join(srcSvgDir, svgFile);
    const destPath = path.join(buildSvgDir, svgFile);

    if (await hasTextElements(srcPath)) {
      console.log(`Converting ${svgFile} (contains text)...`);
      try {
        execSync(`inkscape "${srcPath}" --export-text-to-path --export-plain-svg --export-filename="${destPath}"`, { stdio: 'inherit' });
      } catch (e) {
        console.error(`Failed to convert ${svgFile}: ${e.message}`);
        process.exit(1);
      }
    } else {
      console.log(`Copying ${svgFile} (no text)...`);
      await fs.copyFile(srcPath, destPath);
    }
  }
  console.log('SVG processing complete!');
};

module.exports = async function beforePack(context) {
  const projectRoot = context.packager?.info?.projectDir || process.cwd();
  await convertSvgs(projectRoot);
};

// Run directly if called as a script
if (require.main === module) {
  const projectRoot = process.cwd();
  convertSvgs(projectRoot).catch(err => {
    console.error('Conversion failed:', err);
    process.exit(1);
  });
}