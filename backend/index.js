//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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

console.log('[DEBUG] Starting backend script...');
console.log('[DEBUG] CWD:', process.cwd());
console.log('[DEBUG] __dirname:', __dirname);
console.log('[DEBUG] PORT env:', process.env.PORT);

process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection:', reason);
});

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// DB 설정 (Knex)
const isPg = !!process.env.DATABASE_URL;
const knexConfig = isPg
  ? {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  }
  : {
    client: 'sqlite3',
    connection: {
      filename: './mock.db'
    },
    useNullAsDefault: true
  };

const db = require('knex')(knexConfig);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Health Check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 1. /mock, /mock-api 등 API 라우트가 먼저!

// 2. 정적 파일 서빙
const buildPath = path.join(__dirname, '../frontend/build');
const fs = require('fs');
if (fs.existsSync(buildPath)) {
  console.log('Serving frontend from:', buildPath);
  app.use(express.static(buildPath));
  app.use('/mockadmin', express.static(buildPath));
} else {
  console.warn('Frontend build directory not found:', buildPath);
}

// 3. SPA 라우팅 (API 경로 제외)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/mock') || req.path.startsWith('/mock-api')) return next();

  const indexPath = path.join(buildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error sending index.html:', err);
        res.status(500).send('Error loading frontend');
      }
    });
  } else {
    res.status(404).send('Frontend not built or index.html missing');
  }
});
app.get('/mockadmin/*', (req, res) => {
  const indexPath = path.join(buildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error sending index.html:', err);
        res.status(500).send('Error loading frontend');
      }
    });
  } else {
    res.status(404).send('Frontend not built or index.html missing');
  }
});

// ... (DB initialization and other routes remain)

// ...

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, '0.0.0.0', () => {
  const addr = server.address();
  console.log(`Mock server listening on port ${PORT}`);
  console.log(`Address info:`, addr);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// DB 초기화 및 마이그레이션
(async () => {
  try {
    const hasEndpoints = await db.schema.hasTable('endpoints');
    if (!hasEndpoints) {
      await db.schema.createTable('endpoints', table => {
        table.increments('id');
        table.string('name');
        table.string('method');
        table.string('path');
        table.text('header');
        table.text('body');
        table.text('response_header');
        table.text('response_body');
        table.integer('http_response');
        table.integer('active').defaultTo(1);
        table.text('assert_value');
        table.text('assert_target');
        table.integer('delay').defaultTo(0);
        table.integer('is_callback').defaultTo(0);
        table.text('callback_url');
      });
      console.log('Created table endpoints');
    } else {
      // 마이그레이션: 컬럼 추가
      const columns = ['assert_value', 'assert_target', 'delay', 'is_callback', 'callback_url'];
      for (const col of columns) {
        if (!(await db.schema.hasColumn('endpoints', col))) {
          await db.schema.alterTable('endpoints', table => {
            if (col === 'delay' || col === 'is_callback') {
              table.integer(col).defaultTo(0);
            } else {
              table.text(col);
            }
          });
          console.log(`Added column ${col} to endpoints`);
        }
      }
    }

    const hasLogs = await db.schema.hasTable('logs');
    if (!hasLogs) {
      await db.schema.createTable('logs', table => {
        table.increments('id');
        table.text('timestamp');
        table.integer('endpoint_id');
        table.string('method');
        table.string('path');
        table.text('header');
        table.text('body');
        table.text('response_header');
        table.text('response_body');
        table.integer('http_response');
        table.integer('is_callback').defaultTo(0);
      });
      console.log('Created table logs');
    } else {
      if (!(await db.schema.hasColumn('logs', 'is_callback'))) {
        await db.schema.alterTable('logs', table => {
          table.integer('is_callback').defaultTo(0);
        });
        console.log('Added column is_callback to logs');
      }
    }
    console.log(`DB Initialized (${isPg ? 'PostgreSQL' : 'SQLite'})`);
  } catch (e) {
    console.error('DB Initialization Error:', e);
  }
})();

// 엔드포인트 목록 조회
app.get('/mock-api/endpoints', async (req, res) => {
  try {
    const { page = 1, search = '' } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;

    const query = db('endpoints');
    if (search) {
      query.where(builder => {
        builder.where('name', 'like', `%${search}%`)
          .orWhere('path', 'like', `%${search}%`);
      });
    }

    const endpoints = await query.limit(limit).offset(offset);
    res.json(endpoints);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 엔드포인트 추가
app.post('/mock-api/endpoints', async (req, res) => {
  try {
    const { name, method, path, header, body, response_header, response_body, http_response, active, assert_value, assert_target, delay, is_callback, callback_url } = req.body;
    const safeDelay = Math.max(0, Math.min(Number(delay) || 0, 10000));
    const safeIsCallback = is_callback ? 1 : 0;

    // Knex insert: returns array of ids in SQLite, 'returning' needed for PG
    const [result] = await db('endpoints').insert({
      name, method, path, header, body, response_header, response_body, http_response,
      active: active ?? 1,
      assert_value, assert_target,
      delay: safeDelay,
      is_callback: safeIsCallback,
      callback_url
    }, ['id']); // Second arg is for Postgres RETURNING id

    // Sqlite returns [id], Postgres Returns [{id: ...}] or similar depending on config
    // normalize result
    let newId = result;
    if (typeof result === 'object' && result?.id) newId = result.id;

    res.json({ id: newId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 엔드포인트 상세/수정/삭제
app.get('/mock-api/endpoints/:id', async (req, res) => {
  try {
    const endpoint = await db('endpoints').where({ id: req.params.id }).first();
    res.json(endpoint);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.put('/mock-api/endpoints/:id', async (req, res) => {
  try {
    const { name, method, path, header, body, response_header, response_body, http_response, active, assert_value, assert_target, delay, is_callback, callback_url } = req.body;
    const safeDelay = Math.max(0, Math.min(Number(delay) || 0, 10000));
    const safeIsCallback = is_callback ? 1 : 0;

    await db('endpoints').where({ id: req.params.id }).update({
      name, method, path, header, body, response_header, response_body, http_response, active, assert_value, assert_target,
      delay: safeDelay,
      is_callback: safeIsCallback,
      callback_url
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.delete('/mock-api/endpoints/:id', async (req, res) => {
  try {
    await db('endpoints').where({ id: req.params.id }).del();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 로그 목록 조회
app.get('/mock-api/logs', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;

    const logs = await db('logs')
      .where('timestamp', 'like', `${today}%`)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .offset(offset);

    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Mock 엔드포인트 처리
app.all('/mock/*', async (req, res) => {
  const method = req.method;
  const path = req.path.replace('/mock', '');
  const headerObj = req.headers;
  const bodyObj = req.body;

  try {
    // 후보 엔드포인트 조회
    const candidates = await db('endpoints').where({ method, path, active: 1 });

    // 디버깅용 로그
    console.log('--- MOCK REQUEST ---');
    console.log('method:', method);
    console.log('path:', path);
    // ... (logging omitted for brevity)

    let endpoint = null;
    for (const ep of candidates) {
      const assertValue = ep.assert_value;
      let assertTarget = (ep.assert_target || '').toLowerCase();
      if (!assertTarget) assertTarget = 'header';
      let matched = false;

      if (!assertValue || assertValue === '') {
        endpoint = ep;
        break;
      } else if (assertTarget === 'header') {
        const headerStr = JSON.stringify(req.headers).toLowerCase();
        const cmp = String(assertValue).toLowerCase();
        matched = headerStr.includes(cmp);
      } else if (assertTarget === 'body') {
        const bodyStr = JSON.stringify(req.body).toLowerCase();
        const cmp = String(assertValue).toLowerCase();
        matched = bodyStr.includes(cmp);
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

    const now = new Date();
    // Simple timestamp format: YYYY-MM-DD HH:MM:SS
    const kstString = now.toISOString().replace('T', ' ').substring(0, 19);

    if (endpoint) {
      if (endpoint.response_header) {
        try { response_header = JSON.parse(endpoint.response_header); } catch { response_header = endpoint.response_header; }
      }
      if (endpoint.response_body) {
        try { response_body = JSON.parse(endpoint.response_body); } catch { response_body = endpoint.response_body; }
      }
      http_response = endpoint.http_response || 200;
      const isCallback = endpoint.is_callback ? 1 : 0;
      const callbackUrl = endpoint.callback_url;

      // 오늘 이전 로그 삭제 (Cleanup)
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const today = `${yyyy}-${mm}-${dd}`;

      // Fire and forget cleanup
      db('logs').where('timestamp', '<', today).del().catch(console.error);

      // 로그 저장
      await db('logs').insert({
        timestamp: kstString,
        endpoint_id: endpoint.id,
        method, path, header, body,
        response_header: endpoint.response_header,
        response_body: endpoint.response_body,
        http_response,
        is_callback: isCallback
      });

      // 응답 헤더 정제
      let safeHeader = {};
      if (response_header && typeof response_header === 'object' && !Array.isArray(response_header)) {
        for (const k in response_header) {
          if (Object.hasOwn(response_header, k)) {
            const safeKey = k.replace(/^"|"$/g, '').replace(/\s/g, '');
            let v = response_header[k];
            if (v === undefined || v === null) v = '';
            v = String(v).replace(/[\r\n\t\0\f\v]/g, '');
            safeHeader[safeKey] = v;
          }
        }
      } else {
        safeHeader = response_header;
      }

      const delayMs = Math.max(0, Math.min(Number(endpoint.delay) || 0, 10000));

      if (isCallback && callbackUrl) {
        setTimeout(async () => {
          try {
            const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
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
        const sendResponse = () => {
          if (typeof response_body === 'object') {
            res.status(http_response).set(safeHeader).json(response_body);
          } else {
            res.status(http_response).set(safeHeader).send(response_body);
          }
        };

        if (delayMs > 0) {
          setTimeout(sendResponse, delayMs);
        } else {
          sendResponse();
        }
      }

    } else {
      // Not found
      console.log('[MOCK][FAIL] Not found:', { method, path });

      await db('logs').insert({
        timestamp: kstString,
        endpoint_id: null,
        method, path,
        header: JSON.stringify(headerObj),
        body: JSON.stringify(bodyObj),
        response_header: '',
        response_body: 'Mock endpoint not found or assert not matched.',
        http_response: 404
      });
      res.status(404).json({ error: 'Mock endpoint not found or assert not matched.' });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});


// (PORT listening moved up)





