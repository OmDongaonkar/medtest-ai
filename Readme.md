# 🏥 MedTest AI

> **Automate Healthcare Test Case Generation with AI**  
> Reduce manual QA effort by 70-80% while ensuring regulatory compliance.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](YOUR_DEMO_LINK)

---

## 🚀 The Problem

Healthcare software development faces critical bottlenecks:

- ⏱️ **Time-Intensive** — QA teams spend weeks manually converting specifications into test cases
- 📋 **Complex Compliance** — Must adhere to FDA, IEC 62304, ISO 9001, ISO 13485, ISO 27001 standards
- 🔗 **Traceability Burden** — Maintaining requirement-to-test mappings across enterprise tools
- 📊 **Diverse Formats** — Requirements scattered across PDF, Excel, Word, Jira, and XML

**Result:** Slow product cycles, limited scalability, and compliance risks.

---

## 💡 Our Solution

MedTest AI leverages Google's Gemini AI to transform requirements into production-ready test cases in minutes.

### ✨ Key Features

**🤖 AI-Powered Generation**
- Upload requirements (PDF, Excel, Word) or fetch from Jira
- Gemini analyzes and generates tailored test cases
- Automatic compliance mapping to regulatory standards

**💬 Intelligent Chatbot (RAG)**
- Ask questions about generated test cases
- Get context-aware explanations like "Why was this test created?"
- Powered by Gemini + Mastra RAG framework

**📤 Seamless Export**
- Download as Excel, PDF, or XML
- Direct export to Jira projects
- Zero manual reformatting needed

**✅ Full Compliance & Traceability**
- Built-in support for FDA, IEC 62304, ISO standards
- Automatic requirement-to-test traceability matrices
- Professional, audit-ready documentation

**👤 User Management**
- Google OAuth & manual authentication
- Profile page with generation history
- Re-engage with previous test cases

---

## 🎯 Who Is This For?

- **QA Testers** — Working on medical software testing
- **Healthcare Software Companies** — Developing regulated products
- **Compliance Officers** — Managing regulatory documentation
- **Project Managers** — Accelerating development cycles

---

## 🛠️ Tech Stack

### Frontend
- **React** with **Vite** — Fast, modern UI
- **Responsive Design** — Desktop & mobile friendly

### Backend
- **Node.js** + **Express.js** — RESTful API server
- **Authentication** — Google OAuth 2.0 + JWT

### AI & Intelligence
- **Google Gemini API** — LLM for generation & chat
- **Mastra** — RAG framework for context-aware responses
- **Pinecone** — Vector database for semantic search

### Database & Storage
- **Firebase Firestore** — User data & metadata
- **Firebase Storage** — Document storage

### Integrations
- **Jira API** — Fetch requirements & export test cases
- **Document Processors** — PDF, Excel, Word, XML parsing

### Deployment
- **Frontend** — Vercel/Firebase Hosting
- **Backend** — Render
- **Database** — Firebase (Google Cloud)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- Google Gemini API key
- Pinecone account
- Cohere account

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/medtest-ai.git
cd medtest-ai
```

**2. Install dependencies**

Frontend:
```bash
cd frontend
npm install
```

Backend:
```bash
cd backend
npm install
```

**3. Environment Setup**

Create `.env` files in both frontend and backend directories:

**Backend `.env`:**

```bash
# Server Configuration
PORT=your_port_number
FRONTEND_URL=your_frontend_url

# Database
DATABASE_URL=your_firebase_db_url

# API Keys
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_API_KEY=your_backup_gemini_api_key
COHERE_API_KEY=your_cohere_api_key
PINECONE_API_KEY=your_pinecone_api_key

# Jira Integration
JIRA_CLIENT_ID=your_jira_client_id
JIRA_CLIENT_SECRET=your_jira_client_secret
JIRA_REDIRECT_URI=http://{YOUR_JIRA_REDIRECT_URL}/integrations/jira/callback
```

**Frontend `.env`:**

```bash
# App Configuration
VITE_PORT=your_port_number
VITE_REQUEST_URL=your_backend_url

# Firebase Configuration
VITE_DATABASE_URL=your_firebase_db_url
VITE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_PROJECT_ID=your_firebase_project_id
VITE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_APP_ID=your_firebase_app_id
VITE_MEASUREMENT_ID=your_firebase_measurement_id

# API Keys
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_API_KEY=your_backup_gemini_api_key
```

**4. Run the application**

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

**5. Access the app**

Open [http://localhost:{PORT_NUMBER}](http://localhost:{PORT_NUMBER}) in your browser

---

## 📖 Usage

### 1. Sign In
Use Google OAuth or create an account manually

### 2. Upload Requirements
Drag and drop PDF/Excel files or connect your Jira project

### 3. Generate Test Cases
Click "Generate Test Cases" — AI analyzes requirements and creates compliant test cases. View compliance mappings and traceability.

### 4. Explore with Chat
Ask questions about generated test cases and get instant, context-aware answers

### 5. Export
Download as Excel, PDF, or XML, or export directly to Jira

### 6. Access History
View previous generations in your profile and re-engage with past test cases

---

## 🗺️ Roadmap

### ✅ Completed (Live Now)
- Multi-format requirement upload (PDF, Excel, Word, XML)
- Jira integration for requirement fetching
- AI-powered test case generation with Gemini
- Compliance mapping (FDA, IEC 62304, ISO standards)
- RAG-powered chatbot for Q&A
- Multi-format export (Excel, PDF, XML, Jira)
- User authentication & profile management

### 🔜 Next 30 Days
- Optimize generation speed (target: <30 seconds)
- Add Excel template customization
- Improve mobile UX
- Beta user feedback implementation

### 📅 Next 60 Days
- Team collaboration features (shared projects)
- Comment threads on test cases
- Role-based access control
- Activity logs & audit trails

### 🚀 Next 90 Days
- Fine-tune Gemini on healthcare testing datasets (Vertex AI)
- Azure DevOps integration
- Polarion connector
- Advanced analytics dashboard
- API for third-party integrations
---

## 📊 Project Stats
- **Supported Standards:** FDA, IEC 62304, ISO 9001, ISO 13485, ISO 27001
- **Supported Formats:** PDF, Excel, Word, XML, Jira
- **Export Options:** 4 (Excel, PDF, XML, Jira)

---

## 🔒 Security & Compliance

- **Authentication:** OAuth 2.0 + JWT tokens
- **Data Encryption:** In transit (HTTPS) and at rest (Firebase)
- **GDPR Ready:** User data control and deletion capabilities
- **Regulatory Support:** FDA, IEC 62304, ISO compliance mapping
- **No Data Training:** User data never used to train AI models

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**Team Name:** Versatile  
**Team Leader:** Sneha Yadav

### Built For
GenAI Exchange Hackathon — Automating Test Case Generation with AI

---

## 🙏 Acknowledgments

- **Google Gemini** — Powering our AI generation
- **Firebase** — Reliable backend infrastructure
- **Mastra** — RAG framework implementation
- **Pinecone** — Vector database for semantic search
- **Healthcare Community** — For valuable feedback and testing

---

**Made with ❤️ for Healthcare QA Teams**
