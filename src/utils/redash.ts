import type { RawDataRow } from './processor';

// Query ID and API Key from the requirements
const QUERY_ID = '171';
const API_KEY = 'Bt6BK66uAmXPuxenGlwa6QIe0SPOqyUd49JAGvnA';

// Base URL handling for Proxy (Development) vs Direct (Production if allowed, otherwise Proxy needed there too)
// For local dev, we will use a proxy prefix.
const PROXY_PREFIX = '/api/redash';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchRedashData = async (startDate: string, endDate: string): Promise<RawDataRow[]> => {
    // URL Construction
    const url = `${PROXY_PREFIX}/queries/${QUERY_ID}/results?api_key=${API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                parameters: {
                    start_date: startDate,
                    end_date: endDate
                },
                // Use max_age to prefer cached results (86400 = 1 day)
                // If cache exists within this period, it will return immediately
                // Otherwise, it will trigger a fresh query (job)
                max_age: 86400
            })
        });

        if (!response.ok) {
            let errorMsg = response.statusText;
            try {
                const errData = await response.json();
                if (errData.message) errorMsg = errData.message;
            } catch (e) { console.error(e); }
            throw new Error(`Redash API Error: ${response.status} ${errorMsg}`);
        }

        const data = await response.json();

        // If 'job' is present, we need to poll
        if (data.job) {
            const jobId = data.job.id;
            try {
                const queryResultId = await pollJob(jobId);
                return await fetchQueryResult(queryResultId);
            } catch (pollError) {
                // If job polling fails due to auth, provide a helpful message
                console.error("Job polling failed:", pollError);
                throw new Error("쿼리가 실행 중입니다. 잠시 후 다시 시도해주세요. (캐시된 결과가 없거나 Job API 접근 권한 문제)");
            }
        }

        // If immediate result (cached result found)
        return parseRows(data);

    } catch (error) {
        console.error("Failed to fetch Redash data:", error);
        throw error;
    }
};

const pollJob = async (jobId: string): Promise<number> => {
    const jobUrl = `${PROXY_PREFIX}/jobs/${jobId}?api_key=${API_KEY}`;

    // Poll every 1.5 seconds, timeout after 30 seconds (20 attempts)
    const maxAttempts = 20;

    for (let i = 0; i < maxAttempts; i++) {
        const response = await fetch(jobUrl);

        // Check if response is ok
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Job API returned ${response.status}`);
        }

        const data = await response.json();
        const job = data.job;

        // Null check for job object
        if (!job) {
            throw new Error("Invalid job response structure");
        }

        // Status: 1=Queued, 2=Started, 3=Success, 4=Failure, 5=Cancelled
        if (job.status === 3) {
            return job.query_result_id;
        } else if (job.status === 4) {
            throw new Error(`Redash query failed: ${job.error || 'Unknown error'}`);
        } else if (job.status === 5) {
            throw new Error("Redash query cancelled");
        }

        // Wait 1.5 seconds before next attempt
        await sleep(1500);
    }

    throw new Error("Redash query timeout (30s)");
};

const fetchQueryResult = async (queryResultId: number): Promise<RawDataRow[]> => {
    const resultUrl = `${PROXY_PREFIX}/query_results/${queryResultId}.json?api_key=${API_KEY}`;
    const response = await fetch(resultUrl);

    if (!response.ok) {
        throw new Error("Failed to fetch query result details");
    }

    const data = await response.json();
    return parseRows(data);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseRows = (data: any): RawDataRow[] => {
    if (!data.query_result || !data.query_result.data || !data.query_result.data.rows) {
        console.error("Unexpected Redash Response Structure:", data);
        throw new Error("Invalid Redash response structure");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = data.query_result.data.rows;

    return rows.map(row => ({
        path: row.path,
        count: Number(row.total_members)
    }));
};
