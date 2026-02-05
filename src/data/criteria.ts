export const EXACT_MATCH_CRITERIA = [
    "깨봉 유튜브 채널",
    "AIQ",
    "제휴",
    "TV방송",
    "도서",
    "강연",
    "깨봉 네이버 블로그",
    "페이스북",
    "간식퀴즈",
    "수학페스티벌",
    "단원평가 PDF",
    "직접입력"
];

// Keywords are checked in order.
export const KEYWORD_MAPPING: { keyword: string; target: string }[] = [
    { keyword: "지인", target: "지인소개" },
    { keyword: "커뮤니티", target: "커뮤니티(맘카페 등)" },
    { keyword: "깨봉 인스타그램", target: "깨봉 인스타그램" },
    { keyword: "IG", target: "깨봉 인스타그램" },
    { keyword: "기사", target: "언론기사" },
    { keyword: "카카오 라이브 쇼핑", target: "카쇼라" },
    { keyword: "네이버 라이브 쇼핑", target: "네쇼라" },
    { keyword: "커넥터즈 추천", target: "커넥터즈 추천" },
    { keyword: "커넥터즈 신청", target: "커넥터즈 신청" },
    { keyword: "단원평가 pdf", target: "단원평가 PDF" },
    { keyword: "(광고)", target: "광고 합계" },
    { keyword: "광고", target: "광고 합계" },
    // Note: Items containing (광고) will be mapped to "광고 합계" AND also kept as original if we want to show details?
    // Requirement says: "광고 합계: (광고)가 들어간 대상 항목의 합계".
    // But also lists specific (광고) items. 
    // If we map to "광고 합계", we lose the detail in the "Current Criteria" column?
    // But the requirement says "A열에 기준 항목...". If A column becomes "광고 합계", we lose detail.
    // However, the "Result" usually implies aggregation.
    // Let's stick to the list logic. If it matches, it becomes that category.
    // If user wants details, maybe we should output detailed rows?
    // But "광고 합계" suggests aggregation.
    // Let's follow the implementation plan: map to "광고 합계".
    // Wait, the user said "Unmapped items should be kept as is".
];

// Target List for ordering (Optional, can be used for sorting result)
export const SORT_ORDER = [
    "깨봉 유튜브 채널",
    "지인소개",
    "AIQ",
    "제휴",
    "TV방송",
    "커뮤니티(맘카페 등)",
    "깨봉 인스타그램",
    "언론기사",
    "도서",
    "강연",
    "깨봉 네이버 블로그",
    "페이스북",
    "간식퀴즈",
    "수학페스티벌",
    "광고 합계",
    // Detailed ad items (if we were producing them)
    // ... (omitting ad details for brevity if not strictly needed in sort order, but keeping context)
    "(광고)라디오",
    "(광고)인스타그램",
    "(광고)유튜브",
    "(광고)TV",
    "(광고)네이버",
    "(광고)페이스북",
    "(광고)카카오톡",
    "(광고)엘리베이터",
    "(광고)당근",
    "(광고)하이클래스",
    "(광고)토스",
    "(광고)문자",
    "(광고)클래스팅",
    "카쇼라",
    "네쇼라",
    "커넥터즈 추천",
    "커넥터즈 신청",
    "단원평가 PDF",
    "직접입력",
    "미입력"
];
