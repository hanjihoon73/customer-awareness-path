# 구현 계획서: Redash 연동 추가 (v1.1)

## 1. 개요
기존 엑셀 파일 업로드 방식에 더해, **Redash Query API**를 통해 데이터를 직접 조회하고 분석하는 기능을 추가합니다. 사용자는 조회 기간(시작일, 종료일)을 선택하여 분석할 수 있습니다.

## 2. 주요 변경 사항

### 2.1 기존 로직 리팩토링 (`src/utils/processor.ts`)
- **현재**: `processExcelFile` 함수 내에 **파싱(Parsing)** 과 **집계(Aggregation)** 로직이 결합되어 있음.
- **변경**:
  - `aggregateData(items: { criteria: string, count: number }[]): ProcessedRow[]` 함수 분리.
  - 엑셀 파서와 Redash 파서가 공통적으로 이 `aggregateData` 함수를 사용하도록 구조 변경.

### 2.2 Redash 연동 (`src/utils/redash.ts`)
- **API 호출**: `fetch` API 사용.
- **Base URL**: `https://dashboard.quebon.tv/api/queries/171/results.json`
- **Query Parameters**:
  - `api_key`: (제공된 키 사용)
  - `p_start_date`: 시작일 (YYYY-MM-DD)
  - `p_end_date`: 종료일 (YYYY-MM-DD)
- **Data Mapping**:
  - JSON Response의 `path` 컬럼 -> 매핑 로직의 입력값으로 사용.
  - JSON Response의 `total_members` 컬럼 -> 회원수(Count)로 사용.

### 2.3 UI 변경 (`src/App.tsx`)
- **탭/모드 전환**: "엑셀 업로드" vs "Redash 조회" 선택 UI 추가. (default: Redash 조회)
- **Redash 조회 모드**:
  - **시작일(Start Date)**, **종료일(End Date)** 입력 필드 (`<input type="date" />`).
  - **[조회 및 분석]** 버튼.
  - 데이터 로딩 중 표시 (Loading state).
  - 에러 처리 (API 실패, CORS 등).

### 2.4 CORS 대응
- 개발 환경(Local): Vite `server.proxy` 설정을 통해 CORS 우회.
- 배포 환경: Redash 서버의 CORS 설정이 필요할 수 있음. 우선 로컬 개발은 Proxy로 해결.

## 3. 검증 계획
1. **리팩토링 검증**: 기존 엑셀 업로드가 여전히 정상 작동하는지 확인.
2. **API 연동 확인**: 지정된 기간으로 Redash API 호출 시 데이터가 정상적으로 수신되는지 확인.
3. **데이터 정합성**:
   - Redash 쿼리 결과(JSON)의 `total_members` 합계와,
   - 앱 내에서 매핑/집계된 결과의 총 회원수가 일치하는지 확인 (매핑 로직 거친 후).

## 4. 폴더 구조 변경 (제안)
```
src/
├── components/
│   ├── FileUpload.tsx
│   └── RedashForm.tsx  [NEW] (기간 입력 및 조회 버튼)
├── utils/
│   ├── processor.ts    (공통 집계 로직 + 엑셀 파싱)
│   └── redash.ts       [NEW] (API 호출 및 데이터 변환)
```
