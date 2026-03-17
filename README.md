# 🤖 Customer Insights Copilot

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

The **Customer Insights Copilot** is a Proof of Concept (POC) of an Artificial Intelligence Agent integrated directly into a database. It acts as a virtual assistant capable of managing customer data, reading documents, and interpreting images, all through a natural chat interface.

## ✨ Features (What the AI can do)

* **🧠 Context Memory:** The AI remembers previous messages in the conversation, allowing for a continuous and natural dialogue.
* **🛠️ Tool Execution (Function Calling):** The AI autonomously decides when to query or modify the database.
    * `List Customers`: Queries all registered customers.
    * `Fetch Customer`: Retrieves details of a specific customer by ID.
    * `Create Customer`: Inserts new records into Supabase.
    * `Update Customer`: Edits existing customer data.
    * `Delete Customer`: Removes records from the system.
* **📄 Server-Side PDF Reading:** Native processing of `.pdf` files using `pdf2json`, extracting text and sending it as context to the AI.
* **👁️ Multimodal Computer Vision:** Support for uploading and analyzing images (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`).
* **🛡️ File Validation:** The system automatically blocks unsupported visual formats (like SVGs) and politely notifies the user.

## 💻 Technologies Used

* **Frontend / Backend:** [Next.js 16 (Turbopack)](https://nextjs.org/) using Server Actions.
* **Database & Storage:** [Supabase](https://supabase.com/) (PostgreSQL).
* **Artificial Intelligence:** [OpenAI SDK](https://platform.openai.com/docs/) with the `gpt-4o-mini` model (via GitHub Models/Azure Endpoint).
* **File Processing:** `pdf2json` for text extraction from PDFs.

## 🚀 How to run the project locally

### Prerequisites
* Node.js (v18 or higher)
* A Supabase account with the `client`, `message`, and `user` tables created.
* GitHub Models (or OpenAI) API Key.

### Step by Step

1. **Clone the repository:**
   ```bash
    git clone https://github.com/paulo-azul/customer-insights-copilot.git
    cd customer-insights-copilot
    ```
2. **Install dependencies:**
    ```bash
   npm install
    ```

3. **Configure Environment Variables:**
    Create a .env.local file in the root of the project and fill in your credentials:
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    AZURE_OPENAI_API_KEY=your_ai_api_key
    ```

4. **Start the development server:**
    ```bash
    npm run dev
    ```

5. **Access the application:**
    Open your browser and navigate to http://localhost:3000


## 🏗️ AI Agent Architecture

The system's intelligence was built using the **Separation of Concerns** concept:

* **`src/app/lib/ai-agent.ts`**: The **"Brain"** - Defines the AI client setup and the tool schemas (JSON).
* **`src/app/actions/client-tools.ts`**: The **"Hands"** - Functions that execute queries directly in Supabase.
* **`src/app/actions/chat.ts`**: The **"Maestro"** - Receives the message, fetches conversation history, reads files, dispatches tools requested by the AI, and saves the final output.

## ⚠️ Implementation Notes & Hardcoded Values

To keep this Proof of Concept (POC) focused and easy to test, some values are currently hardcoded. If you are adapting this for a production environment, please consider the following:

### 👤 User Identification (`TEMP_USER_ID`)
* **Where:** Found in `src/app/actions/chat.ts` and `src/app/lib/ai-agent.ts`.
* **Why:** I use a static UUID (`00000000...`) to simulate a multi-user environment without requiring a full Authentication flow (Auth) for this demonstration. In a real app, this should be replaced by the authenticated user's session ID.

### 🗄️ Storage Bucket (`poc01_file`)
* **Where:** Found in `src/app/actions/storage.ts`.
* **Why:** The Supabase bucket name is fixed. **Note:** You must create a public bucket named `poc01_file` in your Supabase project for file uploads to work correctly or change the name in the file.

### 🧠 AI Configuration & History
* **Model Name:** The `MODEL_NAME` (gpt-4o-mini) is set in `src/app/lib/ai-agent.ts`.
* **Context Limit:** The conversation history is limited to the last 15 messages in `src/app/actions/chat.ts` to balance token costs and memory performance.

### 🤖 System Prompt
* **Where:** Located in the `messages` array within `src/app/actions/chat.ts`.
* **Why:** The AI's "personality" and rules are defined directly in the code for simplicity. For complex agents, it is recommended to move these prompts to environment variables or a dedicated configuration file.

### 📏 Upload Limits & Synchronization
* **Where:** * **Server-side:** `next.config.ts` (`bodySizeLimit: '20mb'`).
    * **Client-side:** `src/app/page.tsx` (`MAX_FILE_SIZE` and `MAX_TOTAL_SIZE`).
* **Why:** Next.js has a default limit for Server Actions (usually 1MB). I explicitly increased this to **20MB** in the config to allow document and image processing.
* **Important:** The validation in the frontend (`page.tsx`) exists to provide immediate feedback to the user (via toast notifications), preventing a failed request from even reaching the server. Both values must be kept in sync to ensure a smooth experience.

### Author: Paulo Teles Serra Azul