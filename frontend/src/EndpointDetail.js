import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TextField, Button, Paper, MenuItem, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const httpMethods = ['GET', 'POST', 'PUT', 'DELETE'];
const httpResponses = [200, 201, 400, 401, 403, 404, 500];

function EndpointDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [form, setForm] = useState({
    name: '', method: 'GET', path: '', header: '', body: '', response_header: '', response_body: '', http_response: 200, active: 1,
    assert_value: '', assert_target: 'header', delay: 0,
    is_callback: false, callback_url: ''
  });
  const [error, setError] = useState('');
  const [curlOpen, setCurlOpen] = useState(false);
  const [curlText, setCurlText] = useState('');
  const [respOpen, setRespOpen] = useState(false);
  const [respText, setRespText] = useState('');

  useEffect(() => {
    if (!isNew) {
      fetch(`/mock-api/endpoints/${id}`)
        .then(res => res.json())
        .then(data => setForm(data));
    }
  }, [id, isNew]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSave = () => {
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? '/mock-api/endpoints' : `/mock-api/endpoints/${id}`;
    // name이 비어 있으면 'endpoint'로 지정
    // response_body, response_header가 객체면 string으로 변환
    let payload = isNew ? { ...form, name: form.name?.trim() ? form.name : 'endpoint', active: 1 } : { ...form, name: form.name?.trim() ? form.name : 'endpoint' };
    if (typeof payload.response_body === 'object') {
      payload.response_body = JSON.stringify(payload.response_body, null, 2);
    }
    if (typeof payload.response_header === 'object') {
      payload.response_header = JSON.stringify(payload.response_header, null, 2);
    }
    setError('');
    console.log('Request:', method, url, payload);
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        console.log('Response:', res);
        if (!res.ok) {
          const msg = await res.text();
          setError(`Error: ${res.status} ${msg}`);
        } else {
          navigate('/');
        }
      })
      .catch(err => {
        setError('Network error: ' + err.message);
        console.error('Fetch error:', err);
      });
  };

  const handleDelete = () => {
    fetch(`/mock-api/endpoints/${id}`, { method: 'DELETE' }).then(() => navigate('/'));
  };

  const handleDisable = () => {
    fetch(`/mock-api/endpoints/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, active: 0 })
    }).then(() => navigate('/'));
  };

  return (
    <Paper sx={{ p: 2, maxWidth: 600, margin: '32px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Typography variant="h6" gutterBottom>{isNew ? 'Add Endpoint' : 'Endpoint Detail'}</Typography>
        <div style={{ display: 'flex', gap: 8 }}>
          {isNew && <Button variant="outlined" onClick={() => setCurlOpen(true)}>cURL Analyze</Button>}
          {isNew && <Button variant="outlined" onClick={() => setRespOpen(true)}>RESPONSE ANALYZE</Button>}
        </div>
      </div>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      <TextField label="Endpoint Name" name="name" value={form.name} onChange={handleChange} fullWidth sx={{ mb: 2 }} inputProps={{ maxLength: 50 }} />
      <TextField select label="Method" name="method" value={form.method} onChange={handleChange} fullWidth sx={{ mb: 2 }}>
        {httpMethods.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
      </TextField>
      <TextField label="Path" name="path" value={form.path} onChange={handleChange} fullWidth sx={{ mb: 2 }} inputProps={{ maxLength: 50 }} />
      <TextField label="Header" name="header" value={form.header} onChange={handleChange} fullWidth multiline sx={{ mb: 2 }} />
      <TextField label="Body" name="body" value={form.body} onChange={handleChange} fullWidth multiline sx={{ mb:2 }} />
      <TextField label="Response(Header)" name="response_header" value={form.response_header} onChange={handleChange} fullWidth multiline sx={{ mb:2 }} />
      <TextField label="Response(Body)" name="response_body" value={form.response_body} onChange={handleChange} fullWidth multiline sx={{ mb:2 }} />
      <TextField label="Delay(ms, 0~10000)" name="delay" type="number" value={form.delay ?? 0} onChange={e => {
        let v = Number(e.target.value);
        if (isNaN(v) || v < 0) v = 0;
        if (v > 10000) v = 10000;
        setForm(f => ({ ...f, delay: v }));
      }} fullWidth sx={{ mb:2 }} inputProps={{ min: 0, max: 10000 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input type="checkbox" checked={!!form.is_callback} onChange={e => setForm(f => ({ ...f, is_callback: e.target.checked }))} />
          Callback 응답
        </label>
        {form.is_callback && (
          <TextField label="Callback URL (http(s)://...)" name="callback_url" value={form.callback_url || ''} onChange={handleChange} sx={{ minWidth: 320 }} />
        )}
      </div>
      <TextField select label="HTTP Response" name="http_response" value={form.http_response} onChange={handleChange} fullWidth sx={{ mb:2 }}>
        {httpResponses.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
      </TextField>
      {/* Assert Value/Target */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <TextField label="Assert Value (매칭 문자열)" name="assert_value" value={form.assert_value || ''} onChange={handleChange} fullWidth sx={{ flex: 2 }} />
        <TextField select label="Assert Target" name="assert_target" value={form.assert_target || 'header'} onChange={handleChange} sx={{ flex: 1, minWidth: 120 }}>
          <MenuItem value="header">Header</MenuItem>
          <MenuItem value="body">Body</MenuItem>
        </TextField>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Button variant="contained" onClick={handleSave}>Save</Button>
        {!isNew && <Button variant="outlined" color="error" onClick={handleDelete}>Delete</Button>}
        {!isNew && <Button variant="outlined" onClick={handleDisable}>Disable</Button>}
      </div>
      <Dialog open={curlOpen} onClose={() => setCurlOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>cURL Analyze</DialogTitle>
        <DialogContent>
          <TextField
            label="Paste your cURL command here"
            value={curlText}
            onChange={e => setCurlText(e.target.value)}
            fullWidth
            multiline
            minRows={4}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCurlOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            // cURL 파싱 로직
            try {
              const curl = curlText.trim();
              // method
              let method = 'GET';
              const m = curl.match(/-X (\w+)/i);
              if (m) method = m[1].toUpperCase();
              // url/path
              let path = '';
              const urlMatch = curl.match(/(https?:\/\/[^\s"']+)/i);
              if (urlMatch) {
                const url = new URL(urlMatch[1]);
                path = url.pathname;
              }
              // header
              let headerObj = {};
              const headerRegex = /-H\s+'?"?([^:]+):\s*([^"']+)'?"?/gi;
              let headerMatch;
              while ((headerMatch = headerRegex.exec(curl)) !== null) {
                headerObj[headerMatch[1].trim()] = headerMatch[2].trim();
              }
              // body
              let body = '';
              const bodyMatch = curl.match(/--data-raw\s+'([^']+)'|--data-raw\s+"([^"]+)"|-d\s+'([^']+)'|-d\s+"([^"]+)"/i);
              if (bodyMatch) {
                body = bodyMatch[1] || bodyMatch[2] || bodyMatch[3] || bodyMatch[4] || '';
              }
              setForm(f => ({
                ...f,
                method,
                path,
                header: Object.keys(headerObj).length ? JSON.stringify(headerObj, null, 2) : '',
                body
              }));
              setCurlOpen(false);
            } catch (e) {
              alert('Failed to parse cURL command.');
            }
          }}>Analyze</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={respOpen} onClose={() => setRespOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>RESPONSE ANALYZE</DialogTitle>
        <DialogContent>
          <TextField
            label="Paste your HTTP response here (raw)"
            value={respText}
            onChange={e => setRespText(e.target.value)}
            fullWidth
            multiline
            minRows={6}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRespOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            // 응답 파싱 로직
            try {
              const lines = respText.split(/\r?\n/);
              let headerObj = {};
              let bodyLines = [];
              let isHeader = true;
              for (let line of lines) {
                if (isHeader && line.trim() === '') {
                  isHeader = false;
                  continue;
                }
                if (isHeader) {
                  const idx = line.indexOf(':');
                  if (idx > 0) {
                    const key = line.slice(0, idx).trim();
                    const value = line.slice(idx + 1).trim();
                    headerObj[key] = value;
                  }
                } else {
                  bodyLines.push(line);
                }
              }
              // 헤더가 1개도 없으면 전체를 body로 간주
              if (Object.keys(headerObj).length === 0) {
                setForm(f => ({
                  ...f,
                  response_header: '',
                  response_body: respText.trim()
                }));
              } else {
                setForm(f => ({
                  ...f,
                  response_header: JSON.stringify(headerObj, null, 2),
                  response_body: bodyLines.join('\n').trim()
                }));
              }
              setRespOpen(false);
            } catch (e) {
              alert('Failed to parse response.');
            }
          }}>Analyze</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
export default EndpointDetail;
