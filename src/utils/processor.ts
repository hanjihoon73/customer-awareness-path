import * as XLSX from 'xlsx';
import { EXACT_MATCH_CRITERIA, KEYWORD_MAPPING, SORT_ORDER } from '../data/criteria';

export interface ProcessedRow {
    criteria: string;
    count: number;
}

export interface RawDataRow {
    path: string;
    count: number;
}

export const aggregateData = (data: RawDataRow[]): ProcessedRow[] => {
    const aggregationMap = new Map<string, number>();

    // Initialize all criteria with 0
    SORT_ORDER.forEach(item => {
        aggregationMap.set(item, 0);
    });

    for (const row of data) {
        const originalPath = row.path ? String(row.path).trim() : "";
        const count = row.count ? Number(row.count) : 0;

        if (originalPath === "" && count === 0) continue;

        let mappedCriteria = originalPath;

        // 1. Check for Empty
        if (originalPath === "") {
            mappedCriteria = "미입력";
        } else if (originalPath.includes("광고") || originalPath.includes("(광고)")) {
            // Special Ad handling: Count towards "광고 합계" AND keep specific item
            // Increment "광고 합계"
            const totalAdCount = aggregationMap.get("광고 합계") || 0;
            aggregationMap.set("광고 합계", totalAdCount + count);

            // Treat the specific item as the mapped criteria for the detail row
            // Normalize "광고(X)" to "(광고)X" if possible, to match the predefined list
            let detailName = originalPath;
            const match = originalPath.match(/^광고\((.+)\)$/);
            if (match) {
                detailName = `(광고)${match[1]}`;
            }

            mappedCriteria = detailName;
        } else {
            // 2. Check Exact Match
            if (EXACT_MATCH_CRITERIA.includes(originalPath)) {
                mappedCriteria = originalPath;
            } else {
                // 3. Check Keyword Mapping
                let found = false;
                for (const map of KEYWORD_MAPPING) {
                    // Skip "광고" mappings here as we handled it above
                    if (map.target === "광고 합계") continue;

                    if (originalPath.includes(map.keyword)) {
                        mappedCriteria = map.target;
                        found = true;
                        break;
                    }
                }
                // 4. If not found, keep original
                if (!found) {
                    mappedCriteria = originalPath;
                }
            }
        }

        const currentCount = aggregationMap.get(mappedCriteria) || 0;
        aggregationMap.set(mappedCriteria, currentCount + count);
    }

    // Convert Map to Array
    const result: ProcessedRow[] = Array.from(aggregationMap.entries()).map(([criteria, count]) => ({
        criteria,
        count
    }));

    // Sort based on SORT_ORDER
    result.sort((a, b) => {
        const indexA = SORT_ORDER.indexOf(a.criteria);
        const indexB = SORT_ORDER.indexOf(b.criteria);

        // Special handling for "광고" items to group them
        const isAdA = a.criteria !== "광고 합계" && (a.criteria.includes("광고") || a.criteria.includes("(광고)"));
        const isAdB = b.criteria !== "광고 합계" && (b.criteria.includes("광고") || b.criteria.includes("(광고)"));
        const adTotalIndex = SORT_ORDER.indexOf("광고 합계");

        // If both are defined in SORT_ORDER
        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        }

        // If one is "Ad Detail" and the other is "Ad Total"
        if (a.criteria === "광고 합계" && isAdB) return -1;
        if (b.criteria === "광고 합계" && isAdA) return 1;

        // If both are Ad Details (not in list), sort alphabetically
        if (isAdA && isAdB) {
            return a.criteria.localeCompare(b.criteria);
        }

        // If one is Ad Detail (not in list), put it after Ad Total (or near it)
        // We want Ad Details to appear immediately after "광고 합계"
        // If we rely on the main list order, "광고 합계" is somewhere in the middle.
        // Any unknown Ad item should be treated as having an index slightly > Ad Total.

        if (isAdA && indexB !== -1) {
            // Compare AdA (virtual index = adTotalIndex + 0.1) vs B (indexB)
            return (adTotalIndex + 0.1) - indexB;
        }
        if (isAdB && indexA !== -1) {
            return indexA - (adTotalIndex + 0.1);
        }

        // Standard handling for list vs non-list
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        return a.criteria.localeCompare(b.criteria);
    });

    return result;
};

export const processExcelFile = async (file: File): Promise<ProcessedRow[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to JSON (Array of Arrays) to easier handling
                // Assuming Row 1 is Header. Data input starts from Row 2?
                // Let's assume A and B columns.
                const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                // Skip header (row 0) if it looks like a header
                // We'll process from index 1 if index 0 is header.
                // Simple heuristic: if B is not a number, it's a header.
                let startIndex = 0;
                if (jsonData.length > 0) {
                    const cellB = jsonData[0][1];
                    if (typeof cellB !== 'number') {
                        startIndex = 1;
                    }
                }

                const rawData: RawDataRow[] = [];
                for (let i = startIndex; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length < 2) continue;

                    rawData.push({
                        path: row[0],
                        count: row[1]
                    });
                }

                const result = aggregateData(rawData);
                resolve(result);

            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};
