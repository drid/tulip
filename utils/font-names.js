const fs = require('fs');
const xml2js = require('xml2js');
const path = require('path');

async function extractFontsFromSvg(filePath) {
    // Read the SVG file content
    const data = await fs.promises.readFile(filePath, 'utf8');
    const parser = new xml2js.Parser();
    // Parse the XML into a JavaScript object
    const result = await parser.parseStringPromise(data);
    const fonts = new Set();

    // Recursively traverse the parsed object to find font information
    function traverse(node) {
        if (node.$) {
            // Check for font-family attribute
            if (node.$['font-family']) {
                const fontFamily = node.$['font-family'];
                parseFontFamily(fontFamily).forEach(font => fonts.add(font));
            }
            // Check for style attribute and extract font-family
            if (node.$['style']) {
                const style = node.$['style'];
                const fontFamily = extractFontFamilyFromStyle(style);
                if (fontFamily) {
                    parseFontFamily(fontFamily).forEach(font => fonts.add(font));
                }
            }
        }
        // Traverse all child nodes
        for (const key in node) {
            if (Array.isArray(node[key])) {
                node[key].forEach(child => traverse(child));
            } else if (typeof node[key] === 'object') {
                traverse(node[key]);
            }
        }
    }

    traverse(result);
    return fonts;
}

function extractFontFamilyFromStyle(style) {
    // Split style string into individual properties
    const properties = style.split(';').map(prop => prop.trim());
    for (const prop of properties) {
        const [key, value] = prop.split(':').map(s => s.trim());
        if (key === 'font-family') {
            return value;
        }
    }
    return null;
}

function parseFontFamily(fontFamilyStr) {
    // Match quoted font names (e.g., "Times New Roman") or unquoted names (e.g., Arial)
    const regex = /"([^"]+)"|(\w[\w\s-]*)/g;
    const fonts = [];
    let match;
    while ((match = regex.exec(fontFamilyStr)) !== null) {
        if (match[1]) {
            fonts.push(match[1]); // Quoted font name
        } else if (match[2]) {
            fonts.push(match[2].trim()); // Unquoted font name, trimmed
        }
    }
    return fonts;
}

async function main() {
    // Get all SVG files in the current directory
    const svgFiles = fs.readdirSync('./src/svg/glyphs').filter(file => path.extname(file) === '.svg');
    const allFonts = new Set();

    // Process each SVG file
    for (const file of svgFiles) {
        try {
            const fonts = await extractFontsFromSvg('./src/svg/glyphs/' + file);
            fonts.forEach(font => allFonts.add(font));
        } catch (error) {
            console.error(`Error processing ${file}: ${error.message}`);
        }
    }

    // Sort and print the unique font names
    const sortedFonts = Array.from(allFonts).sort();
    console.log("Fonts used in SVG files:");
    sortedFonts.forEach(font => console.log(font));
}

main();