import React from 'react';

function Guide() {
  return (
    <div style={{ maxWidth: 800, margin: '32px auto', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001' }}>
      <h1>Mock Server 사용 가이드</h1>
      <h2>1. UI를 통한 설정, 호출, 로그 확인</h2>
      <ol>
        <li>
          <b>엔드포인트 목록/추가/수정</b><br />
          <span style={{ color: '#555' }}>엔드포인트 목록, 추가/수정 화면에서 다양한 옵션을 설정할 수 있습니다.</span><br />
          <ul style={{ margin: '8px 0 8px 20px', color: '#333' }}>
            <li>메인 화면에서 <b>Add Endpoint</b> 버튼 클릭</li>
            <li>Method, Path, Header, Body, Response(Header/Body), HTTP Response, Delay(ms), Callback 여부/URL, Assert 등 입력</li>
            <li>CURL 명령어를 import할 경우 <b>CURL ANALYZE</b> 버튼 클릭</li>
            <li><b>Save</b> 클릭 시 저장됨</li>
          </ul>
          <img src="/mockadmin/guide-1.png" alt="엔드포인트 목록" style={{ maxWidth: '100%', border: '1px solid #ccc', margin: '12px 0' }} />
        </li>
        <li>
          <b>엔드포인트 테스트</b><br />
          <span style={{ color: '#555' }}>Test 버튼을 눌러 실제 Mock 응답 및 Callback 결과를 확인할 수 있습니다.</span><br />
          <ul style={{ margin: '8px 0 8px 20px', color: '#333' }}>
            <li>엔드포인트 목록에서 <b>Test</b> 버튼 클릭</li>
            <li>실제 Mock 응답(및 Callback) 결과를 확인 가능</li>
          </ul>
          <img src="/mockadmin/guide-2.png" alt="엔드포인트 테스트" style={{ maxWidth: '100%', border: '1px solid #ccc', margin: '12px 0' }} />
        </li>
        <li>
          <b>로그 확인</b><br />
          <span style={{ color: '#555' }}>Logs 메뉴에서 요청/응답/Callback 여부 등 상세 내역을 확인할 수 있습니다.</span><br />
          <ul style={{ margin: '8px 0 8px 20px', color: '#333' }}>
            <li>상단 <b>Logs</b> 메뉴 클릭</li>
            <li>최근 호출 내역, 요청/응답/Callback 여부 등 확인 가능</li>
          </ul>
          <img src="/mockadmin/guide-3.png" alt="로그 화면" style={{ maxWidth: '100%', border: '1px solid #ccc', margin: '12px 0' }} />
        </li>
      </ol>
      <h2>2. Backend API(Headless) 직접 호출 샘플</h2>
      <ul>
        <li><b>엔드포인트 목록 조회</b><br />
          <code>GET /mock-api/endpoints</code><br />
          <pre style={{background:'#f6f8fa',padding:12,borderRadius:4}}>{`curl -X GET http://localhost:4000/mock-api/endpoints`}</pre>
        </li>
        <li><b>엔드포인트 추가</b><br />
          <code>POST /mock-api/endpoints</code><br />
          <pre style={{background:'#f6f8fa',padding:12,borderRadius:4}}>{`curl -X POST http://localhost:4000/mock-api/endpoints \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test",
    "method": "POST",
    "path": "/mock/test",
    "header": "{}",
    "body": "{}",
    "response_header": "{}",
    "response_body": "{\"result\":\"ok\"}",
    "http_response": 200,
    "delay": 0,
    "is_callback": false,
    "callback_url": ""
  }'`}</pre>
        </li>
        <li><b>엔드포인트 수정</b><br />
          <code>PUT /mock-api/endpoints/:id</code><br />
          <pre style={{background:'#f6f8fa',padding:12,borderRadius:4}}>{`curl -X PUT http://localhost:4000/mock-api/endpoints/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test2",
    ...
  }'`}</pre>
        </li>
        <li><b>엔드포인트 삭제</b><br />
          <code>DELETE /mock-api/endpoints/:id</code><br />
          <pre style={{background:'#f6f8fa',padding:12,borderRadius:4}}>{`curl -X DELETE http://localhost:4000/mock-api/endpoints/1`}</pre>
        </li>
        <li><b>로그 목록 조회</b><br />
          <code>GET /mock-api/logs</code><br />
          <pre style={{background:'#f6f8fa',padding:12,borderRadius:4}}>{`curl -X GET http://localhost:4000/mock-api/logs`}</pre>
        </li>
        <li><b>Mock 호출</b><br />
          <code>POST /mock/your/path</code><br />
          <pre style={{background:'#f6f8fa',padding:12,borderRadius:4}}>{`curl -X POST http://localhost:4000/mock/test \
  -H "Content-Type: application/json" \
  -d '{"foo":"bar"}'`}</pre>
        </li>
      </ul>
      <h2>기타</h2>
      <ul>
        <li>Delay(ms), Callback, Assert 등 고급 기능은 UI/Headless 모두 지원</li>
        <li>Callback은 delay 후 지정한 URL로 POST, 로그에서 확인 가능</li>
        <li>문제/문의: 관리자에게 문의</li>
      </ul>
    </div>
  );
}
export default Guide;
