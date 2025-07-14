// save as extractStates.js and run with: node extractStates.js
const fs = require('fs');
const path = require('path');
const svgPath = path.join(__dirname, 'public', 'US_Map.svg');

const svg = fs.readFileSync(svgPath, 'utf8');

// Match all <path class="xx" d="..." ...><title>State Name</title></path>
const regex = /<path\s+class="([^"]+)"\s+d="([^"]+)"[^>]*>\s*<title>([^<]+)<\/title><\/path>/g;

const stateAbbrMap = {
    al: 'AL', ak: 'AK', az: 'AZ', ar: 'AR', ca: 'CA', co: 'CO', ct: 'CT', de: 'DE', fl: 'FL', ga: 'GA',
    hi: 'HI', id: 'ID', il: 'IL', in: 'IN', ia: 'IA', ks: 'KS', ky: 'KY', la: 'LA', me: 'ME', md: 'MD',
    ma: 'MA', mi: 'MI', mn: 'MN', ms: 'MS', mo: 'MO', mt: 'MT', ne: 'NE', nv: 'NV', nh: 'NH', nj: 'NJ',
    nm: 'NM', ny: 'NY', nc: 'NC', nd: 'ND', oh: 'OH', ok: 'OK', or: 'OR', pa: 'PA', ri: 'RI', sc: 'SC',
    sd: 'SD', tn: 'TN', tx: 'TX', ut: 'UT', vt: 'VT', va: 'VA', wa: 'WA', wv: 'WV', wi: 'WI', wy: 'WY',
    dc: 'DC'
};

let match;
const states = [];
while ((match = regex.exec(svg)) !== null) {
    const className = match[1].toLowerCase();
    const id = stateAbbrMap[className] || className.toUpperCase();
    const d = match[2];
    const name = match[3];
    states.push({ id, name, d });
}

console.log('const STATES = [');
states.forEach(s => {
    // Escape backslashes and quotes for safe JS output
    const safeD = s.d.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    console.log(`  { id: '${s.id}', name: '${s.name}', d: "${safeD}" },`);
});
console.log('];');