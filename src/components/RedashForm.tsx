import { useState, useRef } from 'react';
import { fetchRedashData } from '../utils/redash';
import { aggregateData, type ProcessedRow } from '../utils/processor';

interface RedashFormProps {
    onDataFetched: (data: ProcessedRow[]) => void;
    onError: (message: string) => void;
}

const RedashForm = ({ onDataFetched, onError }: RedashFormProps) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);

    // Refs for programmatically opening the date picker
    const startDateRef = useRef<HTMLInputElement>(null);
    const endDateRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate) {
            onError("시작일과 종료일을 모두 선택해주세요.");
            return;
        }

        setLoading(true);
        onError(""); // Clear previous errors

        try {
            const rawData = await fetchRedashData(startDate, endDate);

            if (rawData.length === 0) {
                onError("해당 기간의 데이터가 없습니다.");
                onDataFetched([]);
            } else {
                const processedData = aggregateData(rawData);
                onDataFetched(processedData);
            }
        } catch (error) {
            console.error(error);
            const msg = error instanceof Error ? error.message : "데이터 조회 중 오류가 발생했습니다.";
            onError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleIconClick = (ref: React.RefObject<HTMLInputElement | null>) => {
        const input = ref.current;
        if (input) {
            if ('showPicker' in input && typeof input.showPicker === 'function') {
                input.showPicker();
            } else {
                input.focus();
            }
        }
    };

    const CalendarIcon = () => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                pointerEvents: 'none' // Let clicks pass through to container/input if needed, but we handle click on container or wrapper
            }}
        >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
    );

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>조회 시작일</label>
                    <div
                        style={{ position: 'relative', cursor: 'pointer' }}
                        onClick={() => handleIconClick(startDateRef)}
                    >
                        <input
                            ref={startDateRef}
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem 2.5rem 0.5rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
                        />
                        <CalendarIcon />
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>조회 종료일</label>
                    <div
                        style={{ position: 'relative', cursor: 'pointer' }}
                        onClick={() => handleIconClick(endDateRef)}
                    >
                        <input
                            ref={endDateRef}
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem 2.5rem 0.5rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
                        />
                        <CalendarIcon />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ marginTop: '0.5rem', padding: '0.75rem', position: 'relative' }}
            >
                {loading ? (
                    <span>조회 중...</span>
                ) : (
                    <span>조회 및 분석</span>
                )}
            </button>
        </form>
    );
};

export default RedashForm;
