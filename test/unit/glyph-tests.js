const test = require('tape');
const jsdom = require('jsdom');
const fs = require('fs').promises;
const path = require('path');

async function checkImagesAndOrphans(htmlFilePath, rootDir, rootId, searchDirs, ignore) {
    // Load HTML content from file
    const htmlContent = await fs.readFile(htmlFilePath, 'utf-8');
    const dom = new jsdom.JSDOM(htmlContent);
    const document = dom.window.document;

    // Select all img elements that are descendants of the specified ID
    const images = document.querySelectorAll(`${rootId} img`);
    const imgSrcs = new Set();
    const results = [];

    // Check existence of referenced images
    for (const img of images) {
        const src = img.getAttribute('src');
        if (!src) {
            //   results.push({ src: null, exists: false, error: 'No src attribute found' });
            continue;
        }
        // Normalize src path to use forward slashes for consistency
        const normalizedSrc = src.replace(/\\/g, '/');
        imgSrcs.add(normalizedSrc);

        // Resolve path relative to rootDir
        const filePath = path.join(rootDir, src);

        try {
            await fs.access(filePath);
            results.push({ src: normalizedSrc, exists: true });
        } catch (error) {
            try {
                await fs.access(filePath.replace("assets", "src"));
                results.push({ src: normalizedSrc, exists: true });
            } catch (error) {
                results.push({ src: normalizedSrc, exists: false, error: error.message });
            }
        }
    }

    // Recursively find all image files in searchDirs
    const orphanResults = [];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];

    async function findImageFiles(dir) {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await findImageFiles(fullPath); // Recurse into subdirectories
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (imageExtensions.includes(ext)) {
                        // Convert to relative path from rootDir, normalize to forward slashes
                        const relativePath = './' + fullPath.replace(path.join(process.cwd(), rootDir), '').replace(/^[\\\/]+/, '').replace(/\\/g, '/');
                        if (!imgSrcs.has(relativePath) && !ignore.includes(relativePath)) {
                            orphanResults.push({ file: relativePath, isOrphan: true });
                        }
                    }
                }
            }
        } catch (error) {
            console.log(`Error accessing directory ${dir}: ${error.message}`);
        }
    }

    // Search for orphaned files in each specified directory
    for (const dir of searchDirs) {
        await findImageFiles(path.join(rootDir, dir));
    }

    return { imageResults: results, orphanResults };
}

test('Image src and orphaned files validation for glyphs ID', async (t) => {
    const htmlFilePath = 'index.html';
    const rootDir = '.'; // Root directory is current directory
    const targetId = 'body'; // Target ID is glyphs
    const searchDirs = ['./assets/svg/']; // Directories to search for orphaned files
    const ignore = ['./assets/svg/glyphs/missing-glyph.svg']
    try {
        const { imageResults, orphanResults } = await checkImagesAndOrphans(htmlFilePath, rootDir, targetId, searchDirs, ignore);

        // Test assertions for referenced images
        t.ok(imageResults.length > 0, 'Should find at least one image under the glyphs ID');

        let allImagesExist = true;
        imageResults.forEach(result => {
            if (!result.src) {
                t.fail(`Found an image with no src attribute`);
                allImagesExist = false;
            } else {
                t.ok(result.exists, `Image ${result.src} should exist in ${rootDir}`);
                if (!result.exists) {
                    allImagesExist = false;
                    console.log(`Error for ${result.src}: ${result.error}`);
                }
            }
        });
        t.ok(allImagesExist, 'All images under the glyphs ID should exist in the root directory');

        // Test assertions for orphaned files
        if (orphanResults.length > 0) {
            orphanResults.forEach(orphan => {
                t.fail(`Orphaned file found: ${orphan.file} is not referenced in index.html under glyphs ID`);
            });
        } else {
            t.pass('No orphaned image files found in the specified directories');
        }

    } catch (error) {
        t.fail(`Test failed with error: ${error.message}`);
    }

    t.end();
});