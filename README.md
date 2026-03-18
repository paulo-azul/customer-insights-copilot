# 🤖 Customer Insights Copilot

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

The **Customer Insights Copilot** is a Proof of Concept (POC) of an Artificial Intelligence Agent integrated directly into a database via a Model Context Protocol (MCP) server. It acts as a virtual assistant capable of managing customer data, reading documents, and interpreting images, all through a natural chat interface.

## ✨ Features (What the AI can do)

* **🧠 Context Memory:** The AI remembers previous messages in the conversation, allowing for a continuous and natural dialogue.
* **🛠️ Tool Execution (MCP):** The AI autonomously decides when to query or modify the database using standardized tools (`List Customers`, `Fetch Customer`, `Create Customer`, `Update Customer`, `Delete Customer`).
* **📄 Server-Side PDF Reading:** Native processing of `.pdf` files using `pdf2json`, extracting text and sending it as context to the AI.
* **👁️ Multimodal Computer Vision:** Support for uploading and analyzing images (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`).
* **🛡️ File Validation:** The system automatically blocks unsupported visual formats (like SVGs) and politely notifies the user.

## 💻 Technologies Used

* **Frontend / Backend:** [Next.js 16 (Turbopack)](https://nextjs.org/) using Server Actions.
* **Database & Storage:** [Supabase](https://supabase.com/) (PostgreSQL).
* **Artificial Intelligence:** [OpenAI SDK](https://platform.openai.com/docs/) with the `gpt-4o-mini` model (via GitHub Models/Azure Endpoint).
* **Tool Calling Protocol:** `@modelcontextprotocol/sdk` to isolate database operations in a Single Source of Truth via HTTP (SSE).
* **File Processing:** `pdf2json` for text extraction from PDFs.

## 🚀 How to run the project locally

### Prerequisites
* Node.js (v20 or higher)
* A Supabase account with the `client`, `message`, and `user` tables created.
* GitHub Models (or OpenAI) API Key.
* The backend **Customer Insights MCP Server** running locally.

### Step by Step

1. **Clone the repository (front):**
   ```bash
    git clone https://github.com/paulo-azul/customer-insights-copilot.git
    cd customer-insights-copilot
    ```

2. **Clone the repository (MCP):**
    ```bash
    git clone https://github.com/paulo-azul/customer-insights-mcp-server
    ```
    Ceck the readme file of the MCP Server repository to get help with this part

3. **Install dependencies:**
    ```bash
   npm install
    ```

4. **Configure Environment Variables:**
    Create a .env.local file in the root of the project and fill in your credentials:
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
    AZURE_OPENAI_API_KEY=your_ai_api_key
    MCP_SERVER_URL=http://localhost:3001/sse 
    ```

5. **Start the development server:**
    ```bash
    npm run dev
    ```

6. **Access the application:**
    Open your browser and navigate to http://localhost:3000

## 🏗️ AI Agent Architecture

The system's intelligence was built using the **Separation of Concerns** concept:

* **`01_copilot_db/src/app/actions/chat.ts`**: The **"Maestro"** - Connects to the MCP Server, receives user messages, reads files, dispatches tools requested by the AI, and saves the final output.
* **`01_mcp_server/index.ts`**: The **"Hands & Brain"** - Isolated Node.js server running the Model Context Protocol. Contains the Supabase queries and tool schemas (Zod/JSON) to guarantee a Single Source of Truth for any AI client.
* **`01_copilot_db/src/app/lib/ai-agent.ts`**: The **"Config"** - Defines the OpenAI client setup and selected model.

## ⚠️ Implementation Notes & Hardcoded Values

To keep this Proof of Concept (POC) focused and easy to test, some values are currently hardcoded. If you are adapting this for a production environment, please consider the following:

### 👤 User Identification (`TEMP_USER_ID`)
* **Where:** Found in `chat.ts` and `index.ts` (MCP).
* **Why:** I use a static UUID (`00000000...`) to simulate a multi-user environment without requiring a full Authentication flow (Auth) for this demonstration. In a real app, this should be replaced by the authenticated user's session ID.

### 🗄️ Storage Bucket (`poc01_file`)
* **Where:** Found in `src/app/actions/storage.ts`.
* **Why:** The Supabase bucket name is fixed. You must create a public bucket named `poc01_file` in your Supabase project for file uploads to work correctly or change the name in the file.

### 🧠 AI Configuration & History
* **Model Name:** The `MODEL_NAME` (gpt-4o-mini) is set in `src/app/lib/ai-agent.ts`.
* **Context Limit:** The conversation history is limited to the last 15 messages in `src/app/actions/chat.ts` to balance token costs and memory performance.

### 🤖 System Prompt
* **Where:** Located in the `messages` array within `src/app/actions/chat.ts`.
* **Why:** The AI's "personality" and rules are defined directly in the code for simplicity. For complex agents, it is recommended to move these prompts to environment variables or a dedicated configuration file.

### 📏 Upload Limits & Synchronization
* **Server-side Location:** `next.config.ts` (`bodySizeLimit: '20mb'`).
* **Client-side Location:** `src/app/page.tsx` (`MAX_FILE_SIZE` and `MAX_TOTAL_SIZE`).
* **Why:** Next.js has a default limit for Server Actions (usually 1MB). I explicitly increased this to **20MB** in the config to allow document and image processing.
* **Important:** The validation in the frontend (`page.tsx`) exists to provide immediate feedback to the user (via toast notifications), preventing a failed request from even reaching the server. Both values must be kept in sync to ensure a smooth experience.

### Author: Paulo Teles Serra Azul