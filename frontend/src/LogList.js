import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

function LogList() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = () => {
    fetch(`/mock-api/logs?page=${page}`)
      .then(res => res.json())
      .then(data => {
        setLogs(data);
        setTotal(20); // 실제 total count API 필요
      });
  };
  useEffect(() => {
    fetchLogs();
  }, [page]);

    // 10자 이후 말줄임표
    const ellipsis = v => (v && v.length > 10 ? v.slice(0, 10) + '...' : v);
    return (
      <Paper sx={{ p: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <Button variant="outlined" size="small" onClick={fetchLogs}>Refresh</Button>
        </div>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>No</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Endpoint ID</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Path</TableCell>
                <TableCell>Header</TableCell>
                <TableCell>Body</TableCell>
                <TableCell>Response(Header)</TableCell>
                <TableCell>Response(Body)</TableCell>
                <TableCell>HTTP Response</TableCell>
                <TableCell>Callback</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map(log => (
                <TableRow key={log.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedLog(log)}>
                  <TableCell>{log.id}</TableCell>
                  <TableCell>{log.timestamp}</TableCell>
                  <TableCell>{log.endpoint_id}</TableCell>
                  <TableCell>{log.method}</TableCell>
                  <TableCell>{log.path}</TableCell>
                  <TableCell>{ellipsis(log.header)}</TableCell>
                  <TableCell>{ellipsis(log.body)}</TableCell>
                  <TableCell>{ellipsis(log.response_header)}</TableCell>
                  <TableCell>{ellipsis(log.response_body)}</TableCell>
                  <TableCell>{log.http_response}</TableCell>
                  <TableCell>{log.is_callback ? '✅' : ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Pagination count={Math.ceil(total / 20)} page={page} onChange={(e, v) => setPage(v)} sx={{ mt: 2 }} />
        <Dialog open={!!selectedLog} onClose={() => setSelectedLog(null)} maxWidth="md" fullWidth>
          <DialogTitle>Log Detail</DialogTitle>
          <DialogContent>
            {selectedLog && (
              <DialogContentText component="div">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <b>Request</b>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginBottom: 16 }}>
{`Method: ${selectedLog.method}
Path: ${selectedLog.path}
Header: ${selectedLog.header}
Body: ${selectedLog.body}`}
                    </pre>
                  </div>
                  <div>
                    <b>Response</b>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
{`Header: ${selectedLog.response_header}
Body: ${selectedLog.response_body}
HTTP Response: ${selectedLog.http_response}
Callback: ${selectedLog.is_callback ? 'YES' : 'NO'}`}
                    </pre>
                  </div>
                </div>
              </DialogContentText>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedLog(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    );
}
export default LogList;
