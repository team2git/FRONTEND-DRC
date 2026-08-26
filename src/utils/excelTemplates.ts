/**
 * Excel / CSV Template Generator, Validator & Analysis Utility for DRM System
 * Aligned with WoredaAssessment.js (CGD / KII) and HouseholdProfile.js Models
 */

// ─── Expected Column Lists ──────────────────────────────────────────────────
export const EXPECTED_WOREDA_COLUMNS = [
    'Subcity', 'Woreda', 'Block', 'House No', 'Assessment Date (YYYY-MM-DD)', 'Remarks',
    'Primary Hazard Name', 'Hazard Frequency', 'Hazard Severity', 'Hazard Duration',
    'Spatial Extent', 'Seasonality', 'Historical Events', 'Coping Strategies',
    'Collective Action Structure', 'Suggested Interventions', 'EWS Rating (1-5)',
    'DRM Committee Rating (1-5)', 'Focal Persons Rating (1-5)', 'Training Freq Rating (1-5)',
    'Shelters Rating (1-5)', 'Community Structures Rating (1-5)', 'Emergency Services Rating (1-5)',
    'Inter-sector Coordination Rating (1-5)', 'Institutional Strength Rating (1-5)', 'Recovery Plan Rating (1-5)',
    'Budget Rating (1-5)', 'DRM Mainstreaming Rating (1-5)',
    'Health Exposure Rating (1-5)', 'Water Exposure Rating (1-5)', 'Energy Exposure Rating (1-5)', 'Emergency Facilities Rating (1-5)', 'Communications Exposure Rating (1-5)',
    'Drainage Rating (1-5)', 'Green Cover Rating (1-5)', 'Waste Mgmt Rating (1-5)', 'Pollution Rating (1-5)',
    'Status (Draft/Submitted/Reviewed)'
];

export const EXPECTED_HOUSEHOLD_COLUMNS = [
    'Subcity', 'Woreda', 'Block', 'House No', 'Enumerator Name',
    'Survey Date (YYYY-MM-DD)', 'Consent (Yes/No)', 'Total Household Members',
    'Male Members', 'Female Members', 'Children (0-17)', 'Youth (18-29)',
    'Elderly (60+)', 'Female Headed (Yes/No)', 'IDP Status (Yes/No)', 'IDP Reason',
    'Education Level', 'Employment Status', 'Primary Livelihood', 'Secondary Livelihood',
    'Household Income Level', 'Small Business Ownership (Yes/No)', 'Daily Labour Dependency (Yes/No)',
    'Insurance Coverage (Yes/No)', 'Wall Material', 'Roof Material', 'Building Age Years',
    'Informal Settlement (Yes/No)', 'Sleeping Rooms', 'Proximity to Hazard Zone',
    'Shelter Known (Yes/No)', 'Evacuation Route Known (Yes/No)', 'DRM Training Received',
    'Emergency Plan Exists (Yes/No)', 'Supplies Stockpiled (Yes/Partial/No)',
    'Early Warning Channel', 'Community Awareness Rating (1-5)', 'Past Disaster Experience',
    'Recovery Duration Months', 'Savings Group Member (Yes/No)', 'Safety Net Access (Yes/No)',
    'Resilience Rating (1-5)', 'Status (Draft/Submitted/Reviewed)'
];

// CSV Standard Headers strings for downloads
export const WOREDA_ASSESSMENT_CSV_HEADER = EXPECTED_WOREDA_COLUMNS.join(',');
export const HOUSEHOLD_ASSESSMENT_CSV_HEADER = EXPECTED_HOUSEHOLD_COLUMNS.join(',');

export const WOREDA_ASSESSMENT_SAMPLE_ROWS = [
    '"Bole","Woreda 01","Block 01","H-W01","2026-07-01","Annual woreda assessment","Urban Flash Flood","Annual","High","2-4 hours","Woreda-wide","Kiremt (June-Sep)","2024 Flood Event","Temporary sandbags and community clearing","Iddir and Youth Volunteer Teams","Construct primary drainage channel and retaining walls",4,4,3,3,4,4,4,3,4,4,3,4,3,4,4,4,3,3,4,3,2,"Reviewed"',
    '"Kirkos","Woreda 03","Block 02","H-W02","2026-07-02","KII & CGD assessment","Riverine Flood & Fire","Bi-annual","Critical","1-2 days","Lowland blocks","Kiremt","2023 Akaki river overflow","Early relocation to school shelters","Woreda Emergency Response Committee","Riverbank buffer zone reinforcement and fire hydrants",3,3,2,2,3,3,3,3,3,3,2,3,4,4,3,3,3,2,3,2,3,"Submitted"',
    '"Yeka","Woreda 02","Block 01","H-W03","2026-07-03","Initial baseline survey","Landslide & Erosion","Occasional","Medium","Varies","Sloped terrain","Belg & Kiremt","2022 Slope collapse","Terracing and hillside vegetation","Local Community Development Association","Hillside stabilization and terracing",3,4,3,3,3,3,4,3,3,3,3,3,2,3,3,3,3,3,3,3,3,"Submitted"'
].join('\n');

export const HOUSEHOLD_ASSESSMENT_SAMPLE_ROWS = [
    '"Bole","Woreda 01","Block 04","H-102","Solomon Tadesse","2026-07-01","Yes",5,2,3,2,1,0,"No","No","","Secondary Education","Employed","Trade / Shopkeeping","Petty Trading","5000-10000 ETB","Yes","No","No","Concrete / Block","Corrugated Iron Sheet",12,"No",3,"50m from river channel","Yes","Yes","Basic Fire & Flood Safety","Yes","Partial","SMS & Community Megaphone",4,"2024 Flood Damage",3,"Yes","Yes",4,"Reviewed"',
    '"Kirkos","Woreda 03","Block 02","H-405","Tigist Bekele","2026-07-02","Yes",7,3,4,3,2,1,"Yes","Yes","Flood Displacement","Primary Education","Informal / Daily Labour","Daily Construction Labour","Vending","< 5000 ETB","No","Yes","No","Wood & Mud (Chika)","Corrugated Iron Sheet",25,"Yes",2,"Directly in flood zone","Yes","No","None","No","No","Radio / TV",2,"2023 Overflow Damage",8,"Yes","Yes",2,"Submitted"',
    '"Yeka","Woreda 02","Block 01","H-201","Dawit Yohannes","2026-07-03","Yes",4,2,2,1,1,0,"No","No","","Degree / Higher","Civil Service","Government Officer","None","10000+ ETB","No","No","Yes","Brick / Concrete","Concrete Slab",5,"No",4,"Yes","Yes","First Aid & Evacuation","Yes","Yes","Mobile App & SMS",5,"None",0,"No","No",5,"Submitted"'
].join('\n');

/**
 * Triggers a browser download for a formatted CSV/Excel template file
 */
export function downloadCSVTemplate(type: 'woreda' | 'household') {
    const isWoreda = type === 'woreda';
    const filename = isWoreda
        ? 'addis_ababa_woreda_assessment_template.csv'
        : 'addis_ababa_household_assessment_template.csv';

    const content = isWoreda
        ? `${WOREDA_ASSESSMENT_CSV_HEADER}\n${WOREDA_ASSESSMENT_SAMPLE_ROWS}`
        : `${HOUSEHOLD_ASSESSMENT_CSV_HEADER}\n${HOUSEHOLD_ASSESSMENT_SAMPLE_ROWS}`;

    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Validates template filename matching
 */
export function validateTemplateFilename(filename: string, expectedType: 'woreda' | 'household'): { valid: boolean; error?: string } {
    const nameLower = filename.toLowerCase();
    if (expectedType === 'woreda') {
        if (nameLower.includes('household')) {
            return {
                valid: false,
                error: `Filename Mismatch: File "${filename}" appears to be a Household assessment template, but "Woreda Assessment" mode is selected.`
            };
        }
    } else {
        if (nameLower.includes('woreda') && !nameLower.includes('household')) {
            return {
                valid: false,
                error: `Filename Mismatch: File "${filename}" appears to be a Woreda assessment template, but "Household Assessment" mode is selected.`
            };
        }
    }
    return { valid: true };
}

/**
 * Compares parsed headers against database model columns
 */
export function validateColumnMatching(fileHeaders: string[], type: 'woreda' | 'household'): {
    matchedCount: number;
    totalExpected: number;
    matchPercentage: number;
    missingRequiredColumns: string[];
    extraColumns: string[];
} {
    const expected = type === 'woreda' ? EXPECTED_WOREDA_COLUMNS : EXPECTED_HOUSEHOLD_COLUMNS;
    const fileHeadersNormalized = fileHeaders.map(h => h.trim().toLowerCase());

    const missingRequired: string[] = [];
    let matchedCount = 0;

    expected.forEach(expCol => {
        const expLower = expCol.toLowerCase();
        // Check if header matches exact or base title
        const keyName = expCol.split('(')[0].trim().toLowerCase();
        const found = fileHeadersNormalized.some(fh => fh === expLower || fh.startsWith(keyName));
        if (found) {
            matchedCount++;
        } else {
            // Require core fields strictly
            if (['subcity', 'woreda'].includes(keyName)) {
                missingRequired.push(expCol);
            }
        }
    });

    const matchPercentage = Math.round((matchedCount / expected.length) * 100);

    return {
        matchedCount,
        totalExpected: expected.length,
        matchPercentage,
        missingRequiredColumns: missingRequired,
        extraColumns: []
    };
}

/**
 * Parses raw CSV text content into an array of key-value row objects
 */
export function parseCSVText(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) return { headers: [], rows: [] };

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i];
        const values: string[] = [];
        let insideQuote = false;
        let currentValue = '';

        for (let charIdx = 0; charIdx < currentLine.length; charIdx++) {
            const char = currentLine[charIdx];
            if (char === '"') {
                insideQuote = !insideQuote;
            } else if (char === ',' && !insideQuote) {
                values.push(currentValue.trim().replace(/^"|"$/g, ''));
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim().replace(/^"|"$/g, ''));

        if (values.length >= 2 && values.some(v => v.length > 0)) {
            const rowObject: Record<string, string> = {};
            headers.forEach((header, index) => {
                rowObject[header] = values[index] !== undefined ? values[index] : '';
            });
            rows.push(rowObject);
        }
    }

    return { headers, rows };
}

/**
 * Aggregates & Analyzes parsed spreadsheet rows for visual reporting preview
 */
export function analyzeSpreadsheetData(rows: Record<string, string>[], type: 'woreda' | 'household') {
    const totalRows = rows.length;
    const subcitiesCount: Record<string, number> = {};
    const woredasSet = new Set<string>();
    let validRowsCount = 0;
    let totalPopulation = 0;
    let totalHouseholds = 0;
    let femaleHeadedCount = 0;
    let idpCount = 0;
    let avgScoreSum = 0;
    let scoreCount = 0;

    rows.forEach(r => {
        const subcity = r.Subcity || r.subcity || 'Addis Ababa';
        const woreda = r.Woreda || r.woreda || 'Woreda';

        if (subcity && woreda) {
            validRowsCount++;
        }

        subcitiesCount[subcity] = (subcitiesCount[subcity] || 0) + 1;
        woredasSet.add(`${subcity} - ${woreda}`);

        if (type === 'woreda') {
            const pop = Number(r['Total Population'] || r.total_population || 0);
            const hh = Number(r['Total Households'] || r.total_households || 0);
            const score = Number(r['Overall Risk Score (0-10)'] || r.overall_risk || 0);
            totalPopulation += pop;
            totalHouseholds += hh;
            if (score > 0) {
                avgScoreSum += score;
                scoreCount++;
            }
        } else {
            const members = Number(r['Total Household Members'] || r.family_size || 1);
            const isFemaleHeaded = String(r['Female Headed (Yes/No)'] || r.female_headed).toLowerCase() === 'yes';
            const isIDP = String(r['IDP Status (Yes/No)'] || r.idp_status).toLowerCase() === 'yes';
            totalPopulation += members;
            totalHouseholds += 1;
            if (isFemaleHeaded) femaleHeadedCount++;
            if (isIDP) idpCount++;
        }
    });

    const avgRiskScore = scoreCount > 0 ? (avgScoreSum / scoreCount).toFixed(1) : '4.5';

    return {
        totalRows,
        validRowsCount,
        invalidRowsCount: totalRows - validRowsCount,
        uniqueSubcities: Object.keys(subcitiesCount).length,
        uniqueWoredas: woredasSet.size,
        subcitiesBreakdown: subcitiesCount,
        totalPopulation,
        totalHouseholds,
        femaleHeadedCount,
        idpCount,
        avgRiskScore
    };
}
