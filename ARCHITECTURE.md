# Mock Server Architecture

## Overview
This project is a full-featured mock server platform for API simulation, testing, and integration. It consists of a Node.js (Express) backend, a React (Material UI) frontend, and a file-based SQLite database. The system allows users to define, test, and manage mock API endpoints and view detailed logs, supporting advanced features such as response delay, callback, and assert logic.

---

## 1. System Components

### 1.1 Backend (Node.js + Express)
- **API Server**: Handles all RESTful API requests for endpoint CRUD, log retrieval, and mock endpoint simulation.
- **Dynamic Mock Routing**: Matches incoming requests to user-defined endpoints using method, path, headers, and body (with robust/partial/optional matching).
- **Callback Engine**: If enabled, POSTs the request body to a configured callback URL after the response delay.
- **Log Manager**: Records all requests, responses, and callback attempts/results in the SQLite database.
- **Database Layer**: Uses SQLite for persistent storage of endpoints and logs. Handles migrations and schema updates.
- **Error Handling**: Defensive parsing and normalization for headers/body, with safe error responses.

### 1.2 Frontend (React + Material UI)
- **Admin UI**: Modern web interface for managing endpoints, testing, and viewing logs.
- **Endpoint Editor**: Create/edit endpoints with all options (method, path, headers, body, response, delay, callback, assert, etc.).
- **Test Button**: Allows direct testing of endpoints and displays both mock and callback results.
- **Log Viewer**: Paginated/searchable log table with request/response/callback details and KST timestamps.
- **Guide Page**: Step-by-step usage instructions, screenshots, and API sample code.

### 1.3 Database (SQLite)
- **endpoints**: Stores all mock endpoint definitions and options.
- **logs**: Stores all request/response/callback logs with metadata.

---

## 2. Data Flow

1. **Endpoint Definition**: User creates/edits endpoints via the frontend UI or backend API. Data is stored in the SQLite `endpoints` table.
2. **Mock Request Handling**:
   - Incoming HTTP request is matched to an endpoint.
   - If matched, the server waits for the configured delay, then responds with the defined response.
   - If callback is enabled, after the delay, the server POSTs the request body to the callback URL.
   - All actions are logged in the `logs` table.
3. **Log Retrieval**: Logs can be viewed in the UI or fetched via API, with filtering/searching and callback status.

---

## 3. Key Features & Flows

- **Dynamic Endpoint Matching**: Supports robust/partial/optional matching for headers and body.
- **Response Delay**: Configurable per endpoint (0~10,000ms).
- **Callback**: Optional per endpoint; POSTs to callback_url after delay.
- **Assert Logic**: Optional; endpoint can require a specific value in the request.
- **Log Management**: All requests, responses, and callbacks are logged with KST timestamps.
- **API & UI Parity**: All features are available via both the web UI and RESTful API.
- **Guide & Documentation**: Built-in GUIDE page with images and cURL samples.

---

## 4. Deployment & Operation

- **No external DB**: All data is stored in a local SQLite file.
- **Simple start**: `npm install` and `npm start` in both backend and frontend folders.
- **No cloud dependencies**: Fully self-contained.

---

## 5. Folder Structure

```
mock-server-project/
├── backend/
│   ├── index.js (Express app, DB, API, mock logic)
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── EndpointDetail.js
│   │   ├── LogList.js
│   │   ├── Guide.js
│   │   └── ...
│   └── public/
│       ├── guide-1.png
│       ├── guide-2.png
│       ├── guide-3.png
│       └── ...
└── README.md
```

---

## 6. Extensibility
- Easily add new matching logic, log fields, or UI features.
- Can be containerized for deployment.
- Designed for local/offline use, but can be adapted for team/shared environments.

---

## 7. Security & Limitations
- Not intended for production or internet-facing use (no authentication, rate limiting, or HTTPS by default).
- For internal development, QA, and integration testing only.

---

## 8. References
- All API endpoints and usage examples are documented in the GUIDE page and README.

