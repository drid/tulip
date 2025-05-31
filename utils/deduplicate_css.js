const fs = require('fs');
const css = require('css');

// Function to normalize CSS rules and at-rules
function normalizeRule(rule) {
    if (!rule) return null;

    if (rule.type === 'rule') {
        // Normalize standard rules
        if (!rule.declarations) return null;

        const validDeclarations = rule.declarations.filter(
            d => d.property && d.value
        );

        const sortedDeclarations = [...validDeclarations].sort((a, b) =>
            a.property.localeCompare(b.property)
        );

        return {
            type: 'rule',
            selectors: rule.selectors.sort().join(','),
            declarations: sortedDeclarations.map(d => `${d.property}:${d.value}`).join(';')
        };
    } else if (rule.type === 'font-face' || rule.type === 'media') {
        // Normalize at-rules like @font-face and @media
        return {
            type: rule.type,
            params: rule.media || '',
            declarations: (rule.declarations || [])
                .filter(d => d.property && d.value)
                .map(d => `${d.property}:${d.value}`)
                .sort()
                .join(';')
        };
    }

    return null; // Ignore unsupported rules
}

function extractCommonStyles(files, output) {
    const allRules = files.map(file => {
        const content = fs.readFileSync(file, 'utf-8');
        const parsed = css.parse(content);

        // Normalize each rule or at-rule
        return parsed.stylesheet.rules
            .map(rule => ({ original: rule, normalized: normalizeRule(rule) }))
            .filter(r => r.normalized); // Remove null rules
    });

    const [first, ...rest] = allRules;

    // Find common rules or at-rules
    const commonRules = first.filter(rule =>
        rest.every(rules =>
            rules.some(r => JSON.stringify(r.normalized) === JSON.stringify(rule.normalized))
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
            !commonRules.some(common => JSON.stringify(common.normalized) === JSON.stringify(rule.normalized))
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
