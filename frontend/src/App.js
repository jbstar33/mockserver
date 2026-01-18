import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import EndpointList from './EndpointList';
import EndpointDetail from './EndpointDetail';
import LogList from './LogList';
import Guide from './Guide';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';

import './style.css';

function App() {
  return (
    <Router basename={process.env.PUBLIC_URL || '/mockadmin/'}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Mock Server Admin</Typography>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link to="/" style={{ color: '#222', textDecoration: 'none', fontWeight: 500, fontSize: '1rem' }}>HOME</Link>
            <Link to="/guide" style={{ color: '#222', textDecoration: 'none', fontWeight: 500, fontSize: '1rem' }}>GUIDE</Link>
          </nav>
        </Toolbar>
      </AppBar>
      <Routes>
        <Route path="/" element={<EndpointList />} />
        <Route path="/endpoint/:id" element={<EndpointDetail />} />
        <Route path="/logs" element={<LogList />} />
        <Route path="/guide" element={<Guide />} />
      </Routes>
    </Router>
  );
}
export default App;
