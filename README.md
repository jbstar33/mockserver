# Mock Server & Admin UI

## 구성
- **백엔드**: Node.js(Express), SQLite
- **프론트엔드**: React, Material UI

## 주요 기능
- 엔드포인트 관리(추가/수정/삭제/비활성화)
- 요청/응답 로그 확인
- 검색, 페이지네이션, HOME 버튼 등 최신 UI

## 실행 방법

### 백엔드
```
cd backend
npm install
npm start
```

### 프론트엔드
```
cd frontend
npm install
npm start
```

## API
- `/api/endpoints` 엔드포인트 관리
- `/api/logs` 요청/응답 로그
- `/mock/*` 실제 Mock 엔드포인트
