import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Link } from 'react-router-dom';
import { TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination } from '@mui/material';

function EndpointList() {
    const [respOpen, setRespOpen] = useState(false);
    const [respText, setRespText] = useState('');
  const [endpoints, setEndpoints] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch(`/mock-api/endpoints?page=${page}&search=${search}`)
      .then(res => res.json())
      .then(data => {
        setEndpoints(data);
        setTotal(20); // 실제 total count API 필요
      });
  }, [page, search]);

  // 엔드포인트 테스트 호출 함수
  const handleTest = async ep => {
    // GET/DELETE: 쿼리, POST/PUT: body
    //const backendOrigin = `${window.location.protocol}//${window.location.hostname}:4000`;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const port = isLocal ? ':4000' : '';
    const backendOrigin = `${window.location.protocol}//${window.location.hostname}${port}`;const url = backendOrigin + `/mock${ep.path}`;
    const method = ep.method || 'GET';
    let headers = {};
    try {
      headers = ep.header ? JSON.parse(ep.header) : {};
    } catch {}
    let body = undefined;
    if (ep.body) {
      try { body = JSON.parse(ep.body); }
      catch { body = ep.body; }
    }
    try {
      let fetchOpts = { method, headers };
      if (method !== 'GET' && method !== 'DELETE') {
        fetchOpts = {
          ...fetchOpts,
          headers: { 'Content-Type': 'application/json', ...headers },
          body: typeof body === 'string' ? body : JSON.stringify(body)
        };
      }
      const res = await fetch(url, fetchOpts);
      let text = '';
      try {
        text = await res.text();
      } catch {}
      setRespText(`Status: ${res.status}\n${text}`);
      setRespOpen(true);
    } catch (e) {
      setRespText('Request failed: ' + e.message);
      setRespOpen(true);
    }
  };
  return (
    <Paper sx={{ p: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <TextField label="Search" value={search} onChange={e => setSearch(e.target.value)} sx={{ width: 300 }} />
          <Button variant="outlined" component={Link} to="/logs">View Logs</Button>
        </div>
        <Button variant="contained" component={Link} to="/endpoint/new">Add</Button>
      </div>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>No</TableCell>
              <TableCell>Endpoint Name</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Path</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Test</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {endpoints.map((ep, idx) => (
              <TableRow key={ep.id}>
                <TableCell>{ep.id}</TableCell>
                <TableCell>
                  <Link to={`/endpoint/${ep.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>{ep.name}</Link>
                </TableCell>
                <TableCell>{ep.method}</TableCell>
                <TableCell>{ep.path}</TableCell>
                <TableCell>{ep.active ? 'O' : 'X'}</TableCell>
                <TableCell>
                  <Button variant="outlined" size="small" onClick={() => handleTest(ep)}>Test</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Pagination count={Math.ceil(total / 20)} page={page} onChange={(e, v) => setPage(v)} sx={{ mt: 2 }} />
      <Dialog open={respOpen} onClose={() => setRespOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Test Response</DialogTitle>
        <DialogContent>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{respText}</pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRespOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
export default EndpointList;
