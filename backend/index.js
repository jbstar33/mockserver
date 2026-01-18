process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function normalizeKey(k) {
  return String(k).toLowerCase().replace(/[-_\s]/g, '');
}

function normalizeObj(obj) {
  const norm = {};
  for (const k in obj) {
    if (!Object.hasOwn(obj, k)) continue;
    let nk = k.toLowerCase().replace(/^"|"$/g, '').replace(/\s/g, '').trim();
    let v = obj[k];
    norm[nk] = normalizeValue(v);
  }
  return norm;
}

// 부분 매칭: a의 key만 모두 b에 있고 값이 같으면 true
function normalizeValue(v) {
  if (v === undefined || v === null) return '';
  if (typeof v !== 'string') v = String(v);
  return v
    .replace(/\\/g, '') // 이스케이프 제거
    .replace(/[\n\r\t]/g, '') // 줄바꿈, 탭 제거
    .replace(/^['"\s,]+|['"\s,]+$/g, '') // 앞뒤 따옴표, 공백, 콤마 제거
    .replace(/['\"]/g, '') // 내부 따옴표 제거
    .replace(/\s+/g, ''); // 모든 공백 제거
}
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const path = require('path');
const app = express();
app.use(cors());
app.use(bodyParser.json());

// 1. /mock, /mock-api 등 API 라우트가 먼저!
// (아래 기존 app.all('/mock/*', ...) 등 API 라우트가 이미 선언되어 있음)

// 2. 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.use('/mockadmin', express.static(path.join(__dirname, '../frontend/build')));

// 3. SPA 라우팅 (API 경로 제외)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/mock') || req.path.startsWith('/mock-api')) return next();
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});
app.get('/mockadmin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// SQLite DB 초기화
let db;
(async () => {
  db = await open({
    filename: './mock.db',
    driver: sqlite3.Database
  });
  await db.exec(`CREATE TABLE IF NOT EXISTS endpoints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    method TEXT,
    path TEXT,
    header TEXT,
    body TEXT,
    response_header TEXT,
    response_body TEXT,
    http_response INTEGER,
    active INTEGER DEFAULT 1,
    assert_value TEXT,
    assert_target TEXT,
    delay INTEGER DEFAULT 0,
    is_callback INTEGER DEFAULT 0,
    callback_url TEXT
  );`);
  // 컬럼이 없으면 추가 (마이그레이션)
  const pragma = await db.all(`PRAGMA table_info(endpoints);`);
  const columns = pragma.map(row => row.name);
  if (!columns.includes('assert_value')) {
    await db.exec(`ALTER TABLE endpoints ADD COLUMN assert_value TEXT;`);
  }
  if (!columns.includes('assert_target')) {
    await db.exec(`ALTER TABLE endpoints ADD COLUMN assert_target TEXT;`);
  }
  if (!columns.includes('delay')) {
    await db.exec(`ALTER TABLE endpoints ADD COLUMN delay INTEGER DEFAULT 0;`);
  }
  if (!columns.includes('is_callback')) {
    await db.exec(`ALTER TABLE endpoints ADD COLUMN is_callback INTEGER DEFAULT 0;`);
  }
  if (!columns.includes('callback_url')) {
    await db.exec(`ALTER TABLE endpoints ADD COLUMN callback_url TEXT;`);
  }
  // logs 테이블에도 is_callback 컬럼 추가
  await db.exec(`CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    endpoint_id INTEGER,
    method TEXT,
    path TEXT,
    header TEXT,
    body TEXT,
    response_header TEXT,
    response_body TEXT,
    http_response INTEGER,
    is_callback INTEGER DEFAULT 0
  );`);
  const logPragma = await db.all(`PRAGMA table_info(logs);`);
  const logColumns = logPragma.map(row => row.name);
  if (!logColumns.includes('is_callback')) {
    await db.exec(`ALTER TABLE logs ADD COLUMN is_callback INTEGER DEFAULT 0;`);
  }
})();

// 엔드포인트 목록 조회
app.get('/mock-api/endpoints', async (req, res) => {
  const { page = 1, search = '' } = req.query;
  const limit = 20;
  const offset = (page - 1) * limit;
  const endpoints = await db.all(
    `SELECT * FROM endpoints WHERE name LIKE ? OR path LIKE ? LIMIT ? OFFSET ?`,
    [`%${search}%`, `%${search}%`, limit, offset]
  );
  res.json(endpoints);
});

// 엔드포인트 추가
app.post('/mock-api/endpoints', async (req, res) => {
  const { name, method, path, header, body, response_header, response_body, http_response, active, assert_value, assert_target, delay, is_callback, callback_url } = req.body;
  const safeDelay = Math.max(0, Math.min(Number(delay) || 0, 10000));
  const safeIsCallback = is_callback ? 1 : 0;
  const result = await db.run(
    `INSERT INTO endpoints (name, method, path, header, body, response_header, response_body, http_response, active, assert_value, assert_target, delay, is_callback, callback_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, method, path, header, body, response_header, response_body, http_response, active ?? 1, assert_value, assert_target, safeDelay, safeIsCallback, callback_url]
  );
  res.json({ id: result.lastID });
});

// 엔드포인트 상세/수정/삭제/비활성화
app.get('/mock-api/endpoints/:id', async (req, res) => {
  const endpoint = await db.get(`SELECT * FROM endpoints WHERE id = ?`, [req.params.id]);
  res.json(endpoint);
});
app.put('/mock-api/endpoints/:id', async (req, res) => {
  const { name, method, path, header, body, response_header, response_body, http_response, active, assert_value, assert_target, delay, is_callback, callback_url } = req.body;
  const safeDelay = Math.max(0, Math.min(Number(delay) || 0, 10000));
  const safeIsCallback = is_callback ? 1 : 0;
  await db.run(
    `UPDATE endpoints SET name=?, method=?, path=?, header=?, body=?, response_header=?, response_body=?, http_response=?, active=?, assert_value=?, assert_target=?, delay=?, is_callback=?, callback_url=? WHERE id=?`,
    [name, method, path, header, body, response_header, response_body, http_response, active, assert_value, assert_target, safeDelay, safeIsCallback, callback_url, req.params.id]
  );
  res.json({ success: true });
});
app.delete('/mock-api/endpoints/:id', async (req, res) => {
  await db.run(`DELETE FROM endpoints WHERE id=?`, [req.params.id]);
  res.json({ success: true });
});

// 로그 목록 조회
app.get('/mock-api/logs', async (req, res) => {
  const { page = 1 } = req.query;
  const limit = 20;
  const offset = (page - 1) * limit;
    // 오늘 날짜 (KST)
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;
    const logs = await db.all(`SELECT * FROM logs WHERE timestamp LIKE ? ORDER BY timestamp DESC LIMIT ? OFFSET ?`, [`${today}%`, limit, offset]);
  res.json(logs);
});

// Mock 엔드포인트 처리
app.all('/mock/*', async (req, res) => {
  const method = req.method;
  const path = req.path.replace('/mock', '');
  const headerObj = req.headers;
  const bodyObj = req.body;
  // 후보 엔드포인트 모두 조회
  const candidates = await db.all(
    `SELECT * FROM endpoints WHERE method=? AND path=? AND active=1`,
    [method, path]
  );
  // 디버깅용 로그
  console.log('--- MOCK REQUEST ---');
  console.log('method:', method);
  console.log('path:', path);
  console.log('req.headers:', headerObj);
  console.log('req.body:', bodyObj);
  console.log('candidates:', candidates);
  // assert_value/target 기반 매칭
  let endpoint = null;
  for (const ep of candidates) {
    const assertValue = ep.assert_value;
    let assertTarget = (ep.assert_target || '').toLowerCase();
    if (!assertTarget) assertTarget = 'header';
    let matched = false;
    if (!assertValue || assertValue === '') {
      // assert_value가 null/빈값이면 assert 플로우를 건너뛰고 무조건 매칭
      endpoint = ep;
      break;
    } else if (assertTarget === 'header') {
      const headerStr = JSON.stringify(req.headers).toLowerCase();
      const cmp = String(assertValue).toLowerCase();
      matched = headerStr.includes(cmp);
      console.log('[ASSERT][header] 비교 문자열:', headerStr);
      console.log('[ASSERT][header] assert_value:', cmp);
      console.log('[ASSERT][header] 포함여부:', matched);
    } else if (assertTarget === 'body') {
      const bodyStr = JSON.stringify(req.body).toLowerCase();
      const cmp = String(assertValue).toLowerCase();
      matched = bodyStr.includes(cmp);
      console.log('[ASSERT][body] 비교 문자열:', bodyStr);
      console.log('[ASSERT][body] assert_value:', cmp);
      console.log('[ASSERT][body] 포함여부:', matched);
    }
    if (matched) {
      endpoint = ep;
      break;
    }
  }
  const header = JSON.stringify(headerObj);
  const body = JSON.stringify(bodyObj);
  let response_header = {};
  let response_body = {};
  let http_response = 404;
  if (endpoint) {
    // response_header 처리
    if (endpoint.response_header) {
      try {
        response_header = JSON.parse(endpoint.response_header);
      } catch {
        response_header = endpoint.response_header;
      }
    }
    // response_body 처리
    if (endpoint.response_body) {
      try {
        response_body = JSON.parse(endpoint.response_body);
      } catch {
        response_body = endpoint.response_body;
      }
    }
    http_response = endpoint.http_response || 200;
    const isCallback = endpoint.is_callback ? 1 : 0;
    const callbackUrl = endpoint.callback_url;
    // 로그 저장
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const kstString = `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
    // 오늘 이전 로그 삭제
    await db.run(`DELETE FROM logs WHERE timestamp < ?`, [kstString.slice(0, 10)]);
    await db.run(
      `INSERT INTO logs (timestamp, endpoint_id, method, path, header, body, response_header, response_body, http_response, is_callback) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [kstString, endpoint.id, method, path, header, body, endpoint.response_header, endpoint.response_body, http_response, isCallback]
    );
    // 응답 헤더 키 정제
    let safeHeader = response_header;
    if (response_header && typeof response_header === 'object' && !Array.isArray(response_header)) {
      safeHeader = {};
      for (const k in response_header) {
        if (Object.hasOwn(response_header, k)) {
          const safeKey = k.replace(/^"|"$/g, '').replace(/\s/g, '');
          let v = response_header[k];
          if (v === undefined || v === null) v = '';
          v = String(v).replace(/[\r\n\t\0\f\v]/g, '');
          safeHeader[safeKey] = v;
        }
      }
    }
    const delayMs = Math.max(0, Math.min(Number(endpoint.delay) || 0, 10000));
    if (isCallback && callbackUrl) {
      // CALLBACK: delay 후 callback_url로 POST, 즉시 200 OK 반환
      setTimeout(async () => {
        try {
          const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
          await fetch(callbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: typeof response_body === 'object' ? JSON.stringify(response_body) : String(response_body)
          });
        } catch (e) {
          console.error('[CALLBACK ERROR]', e);
        }
      }, delayMs);
      res.status(200).json({ callback: true, callback_url: callbackUrl, delay: delayMs });
    } else {
      // 일반 응답
      if (typeof response_body === 'object') {
        if (delayMs > 0) {
          setTimeout(() => {
            res.status(http_response).set(safeHeader).json(response_body);
          }, delayMs);
        } else {
          res.status(http_response).set(safeHeader).json(response_body);
        }
      } else {
        if (delayMs > 0) {
          setTimeout(() => {
            res.status(http_response).set(safeHeader).send(response_body);
          }, delayMs);
        } else {
          res.status(http_response).set(safeHeader).send(response_body);
        }
      }
    }
  } else {
    // 매칭 실패 로그 및 간단한 실패 사유 응답
    console.log('[MOCK][FAIL] Endpoint not found or assert not matched:', { method, path, headerObj, bodyObj });
    // 실패 로그 DB 저장
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const kstString = `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
    await db.run(
      `INSERT INTO logs (timestamp, endpoint_id, method, path, header, body, response_header, response_body, http_response) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        kstString,
        null,
        method,
        path,
        JSON.stringify(headerObj),
        JSON.stringify(bodyObj),
        '',
        'Mock endpoint not found or assert not matched.',
        404
      ]
    );
    res.status(404).json({ error: 'Mock endpoint not found or assert not matched.' });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Mock server listening on port ${PORT}`);
});




