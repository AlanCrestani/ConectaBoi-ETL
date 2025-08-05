# ConectaBoi ETL Copilot Instructions

This document provides instructions for AI coding agents to effectively assist in the ConectaBoi ETL project.

## 1. Project Architecture

The project is a web-based ETL (Extract, Transform, Load) tool with a monorepo-style structure:

- **Frontend**: A React + TypeScript + Vite application located in `src/`. It provides the user interface for uploading CSV files and managing the multi-step ETL process.
- **Backend**: A Python + FastAPI server located in `backend/`. It handles file uploads, data processing, and communication with the database.
- **Database**: Supabase (PostgreSQL) is used for data storage, including staging tables for the ETL process.
- **Data Flow**:
  1.  The user interacts with the React frontend (`src/pages/QuickETL.tsx` and `src/components/ETLConfigStep*.tsx`).
  2.  A CSV file is uploaded to the FastAPI backend (`/upload-csv` in `backend/api/main.py`).
  3.  The backend saves the file to `data/temp/` and performs a series of processing steps orchestrated by the frontend.
  4.  The core data transformation logic resides in `backend/etl/conectaboi_etl_smart.py`, which heavily uses the pandas library.
  5.  Finally, the transformed data is uploaded to a target table in Supabase via the `/supabase/upload` endpoint.

## 2. Key Files & Directories

- `src/pages/QuickETL.tsx`: The main React component that orchestrates the entire ETL workflow on the frontend.
- `src/components/ETLConfigStep*.tsx`: Components for each step of the ETL configuration UI.
- `backend/api/main.py`: The main FastAPI application file. It defines all API endpoints that the frontend interacts with.
- `backend/etl/conectaboi_etl_smart.py`: The core Python class containing all ETL logic (data validation, transformation, mapping, database interaction).
- `backend/config/settings.py`: Handles loading configuration and secrets (like Supabase credentials) from environment variables.
- `data/logs/api.log`: **Crucial for debugging.** The FastAPI backend logs all operations, including detailed error tracebacks, to this file.
- `COMO_INICIAR_SERVIDORES.md`: Contains the commands to start the frontend and backend servers.

## 3. Developer Workflows

### Running the Application

1.  **Start the Frontend Server**:

    ```bash
    npm run dev
    ```

    The frontend will be available at `http://localhost:8083`.

2.  **Start the Backend Server**:
    ```bash
    cd backend/api
    # Ensure the virtual environment is active or use the full path
    python main.py
    ```
    The backend API will be available at `http://localhost:8000`.

### Debugging

- **Frontend**: Use the browser's developer tools. Errors related to API calls will be visible in the console.
- **Backend**: The primary source for debugging is `data/logs/api.log`. When the frontend reports a 500 Internal Server Error, the detailed traceback can be found in this log file. The `/supabase/upload` endpoint has enhanced error logging to provide more context.

## 4. Code Conventions & Patterns

- **API Communication**: The frontend uses `fetch` to communicate with the backend. API endpoints are defined in `backend/api/main.py` and generally follow a pattern of receiving a request, calling a method in the `ConectaBoiETL` instance, and returning a JSON response.
- **State Management**: The frontend uses a combination of React's `useState` and custom hooks (`src/hooks/`) for state management. State related to the ETL process is persisted in `localStorage` via the `usePersistedState` hook.
- **Styling**: The project uses `tailwindcss` for styling, with UI components from `shadcn/ui`. Component definitions are in `src/components/ui`.
- **Python ETL Logic**: The `conectaboi_etl_smart.py` file encapsulates all ETL logic. It uses pandas DataFrames for data manipulation. Methods are organized by processing steps (e.g., `process_step1_complete`, `_apply_column_mapping_transformations`).
- **Error Handling**: Backend error handling in `main.py` is designed to catch exceptions, log them in detail to `api.log`, and return a JSON response with an error message to the frontend. When fixing backend bugs, always check the log file first.
