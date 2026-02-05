import { useState } from 'react';
import * as XLSX from 'xlsx';
import './index.css';
import FileUpload from './components/FileUpload';
import RedashForm from './components/RedashForm';
import { processExcelFile, type ProcessedRow } from './utils/processor';

type Tab = 'redash' | 'excel';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('redash');
  const [data, setData] = useState<ProcessedRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      setError(null);
      const result = await processExcelFile(file);
      setData(result);
    } catch (err) {
      console.error("Error processing file:", err);
      setError("파일 처리 중 오류가 발생했습니다.");
    }
  };

  const handleRedashData = (fetchedData: ProcessedRow[]) => {
    setData(fetchedData);
  };

  const handleError = (msg: string) => {
    setError(msg);
  };

  const handleDownload = () => {
    if (!data) return;

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data.map(row => ({
      "매체 및 경로": row.criteria,
      "회원수": row.count
    })));

    // Adjust column width
    const wscols = [
      { wch: 30 }, // Column A
      { wch: 10 }  // Column B
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Result");

    XLSX.writeFile(wb, "path.xlsx");
  };

  const totalMembers = data ? data.reduce((acc, curr) => {
    // Exclude ad details from the total count (they are already summed in "광고 합계")
    if (curr.criteria !== "광고 합계" && curr.criteria.startsWith("(광고)")) {
      return acc;
    }
    return acc + curr.count;
  }, 0) : 0;

  return (
    <div className="container">
      <header>
        <h1>사용자 인지 경로 정리</h1>
      </header>

      <main style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'minmax(250px, 300px) 1fr' }}>
        <aside className="criteria-section card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>기준 항목 정보</h2>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <p>목록에 있는 키워드를 포함하거나 정확히 일치하는 항목을 자동으로 분류하고 집계합니다.</p>
            <hr style={{ borderColor: 'var(--border-color)', margin: '1rem 0' }} />
            <p>※ 매핑되지 않은 항목은 원본 명칭 그대로 표시됩니다.</p>
          </div>
        </aside>

        <section className="content-section" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <button
              className={activeTab === 'redash' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => { setActiveTab('redash'); setError(null); setData(null); }}
              style={{ padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', border: 'none', background: activeTab === 'redash' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'redash' ? '#fff' : 'var(--text-secondary)' }}
            >
              Redash 조회
            </button>
            <button
              className={activeTab === 'excel' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => { setActiveTab('excel'); setError(null); setData(null); }}
              style={{ padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', border: 'none', background: activeTab === 'excel' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'excel' ? '#fff' : 'var(--text-secondary)' }}
            >
              엑셀 업로드
            </button>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '150px', borderStyle: activeTab === 'excel' ? 'dashed' : 'solid' }}>
            {activeTab === 'redash' ? (
              <RedashForm onDataFetched={handleRedashData} onError={handleError} />
            ) : (
              <FileUpload onUpload={handleFileUpload} />
            )}
            {error && <p style={{ color: '#ff6b6b', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</p>}
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>
                분석 결과
                {data && <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                  (총 {totalMembers.toLocaleString()}명)
                </span>}
              </h2>
              {data && (
                <button className="btn-primary" onClick={handleDownload} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                  엑셀 다운로드
                </button>
              )}
            </div>

            <div style={{ minHeight: '200px', maxHeight: '500px', overflowY: 'auto' }}>
              {data ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>매체 및 경로</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>회원수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem' }}>{row.criteria}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>{row.count.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  {activeTab === 'redash' ? '기간을 선택하고 조회 버튼을 눌러주세요.' : '파일을 업로드하면 결과가 표시됩니다.'}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
