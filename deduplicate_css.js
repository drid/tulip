const fs = require('fs');
const css = require('css');

// Function to normalize CSS rules
function normalizeRule(rule) {
    if (!rule || !rule.declarations) return null;

    // Filter out invalid declarations (e.g., those missing property or value)
    const validDeclarations = rule.declarations.filter(
        d => d.property && d.value
    );

    // Sort declarations alphabetically by property to ensure consistent comparison
    const sortedDeclarations = [...validDeclarations].sort((a, b) =>
        a.property.localeCompare(b.property)
    );

    return {
        selectors: rule.selectors.sort().join(','), // Sort selectors
        declarations: sortedDeclarations.map(d => `${d.property}:${d.value}`).join(';') // Join declarations
    };
}

function extractCommonStyles(files, output) {
    const allRules = files.map(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const parsed = css.parse(content);

        // Normalize each rule for consistent comparison
        return parsed.stylesheet.rules
            .filter(rule => rule.type === 'rule') // Only process standard rules
            .map(rule => ({ original: rule, normalized: normalizeRule(rule) }))
            .filter(r => r.normalized); // Remove null rules
    });

    const [first, ...rest] = allRules;

    // Find common rules by comparing normalized forms
    const commonRules = first.filter(rule =>
        rest.every(rules =>
            rules.some(r => r.normalized.selectors === rule.normalized.selectors &&
                r.normalized.declarations === rule.normalized.declarations)
        )
    );

    // Convert common rules back to CSS format
    const commonCssRules = commonRules.map(rule => rule.original);
    const commonStyles = css.stringify({ stylesheet: { rules: commonCssRules } });
    fs.writeFileSync(output, commonStyles, 'utf-8');
    console.log(`Common styles saved to: ${output}`);

    // Remove common rules from each file
    files.forEach((file, index) => {
        const uniqueRules = allRules[index].filter(rule =>
            !commonRules.some(common =>
                common.normalized.selectors === rule.normalized.selectors &&
                common.normalized.declarations === rule.normalized.declarations
            )
        );

        // Write unique rules back to the source file
        const uniqueStyles = css.stringify({
            stylesheet: { rules: uniqueRules.map(rule => rule.original) }
        });
        fs.writeFileSync(file, uniqueStyles, 'utf-8');
        console.log(`Updated file: ${file}`);
    });
}

// Example usage
extractCommonStyles(['assets/css/tulip.css', 'assets/css/roadbook-print.css'], 'assets/css/common.css');
