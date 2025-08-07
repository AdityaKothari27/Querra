# Querra: AI-Powered Research Assistant

Querra is an advanced, intelligent research assistant that revolutionizes how you gather, analyze, and synthesize information from the web and your personal documents. Powered by Google's Gemini AI and equipped with sophisticated search capabilities, Querra provides comprehensive research reports tailored to specific domains and use cases.

## 🚀 Key Features

### 🔍 **Advanced Web Search with Category Intelligence**
- **Smart Categorical Search**: 6 specialized search categories (General, Academic, Financial, Technology, Health & Medical, Legal)
- **Google Custom Search Integration**: Leverages Google's powerful search API with custom filtering
- **Time-based Filtering**: Search within specific timeframes (Past 24 hours, week, month, year)
- **Domain Exclusion**: Filter out unwanted domains for refined results
- **Pagination Support**: Handle large result sets efficiently

### 📚 **Document Management System**
- **Multi-format Document Upload**: Support for PDF, DOCX, TXT, and MD files
- **Document Integration**: Seamlessly combine web sources with personal documents
- **Knowledge Base Storage**: Persistent storage of uploaded documents and generated reports
- **Content Extraction**: Advanced PDF and document text extraction capabilities

### 🤖 **AI-Powered Report Generation**
- **Dual Generation Modes**: Choose between thorough analysis and fast insights
  - **Traditional Mode**: Full content extraction and analysis 
  - **Fast Mode**: URL context-based generation 
- **Context-Aware AI**: Utilizes Google Gemini 2.5 Pro for intelligent content synthesis
- **Category-Specific Prompts**: Tailored AI prompts for each research category
- **Rich Markdown Formatting**: Professional reports with headings, citations, and structure
- **Source Attribution**: Clear tracking and citation of all sources used
- **Mode Indicators**: Visual feedback showing which generation method was used

### 📄 **Multiple Export Formats**
- **PDF Export**: Professional formatted documents with proper styling
- **DOCX Export**: Microsoft Word compatible files
- **TXT Export**: Plain text for universal compatibility
- **MD Export**: Markdown format for version control and further editing

### 💾 **Session & Knowledge Management**
- **Session Persistence**: Maintain research state across page navigation
- **Report History**: Access and manage previously generated reports
- **Document Library**: Organized storage and retrieval of uploaded documents
- **Cross-Platform Compatibility**: Works in both serverless and traditional environments

## 🛠 Technology Stack

- **Frontend**: Next.js 15.2.4, React 18, TypeScript 5.7.3
- **Styling**: Tailwind CSS 4.0.6, Heroicons
- **AI Integration**: Google Generative AI (@google/generative-ai)
- **Search API**: Google Custom Search API
- **Database**: SQLite3 with in-memory fallback for serverless
- **Document Processing**: PDF-parse, PDF-lib, DOCX
- **Content Extraction**: Cheerio, Axios
- **Export Libraries**: jsPDF, file-saver

## 🏗 Architecture Overview

Querra follows a modern Next.js architecture with API routes handling backend operations:

- **Frontend**: React components with TypeScript
- **API Layer**: Next.js API routes for search, generation, and data management
- **AI Processing**: Google Gemini integration for content synthesis
- **Data Layer**: SQLite database with serverless compatibility
- **Search Engine**: Google Custom Search API integration

## 📋 Prerequisites

Before installing Querra, ensure you have:

1. **Node.js** (version 18 or higher)
2. **npm** or **yarn** package manager
3. **Google API Key** with Custom Search API enabled
4. **Google Custom Search Engine ID**
5. **Google Gemini API Key**

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/querra.git
cd querra
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:

```bash
# Required API Keys
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_CX=your_google_custom_search_engine_id

# Optional Configuration
NEXT_PUBLIC_VERCEL_ENV=development
```

### 4. API Key Setup Guide

#### Google Gemini API Key:
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Create a new project or select existing one
3. Generate an API key for Gemini
4. Copy the API key to your `.env.local` file

#### Google Custom Search Setup:
1. Visit [Google Custom Search](https://cse.google.com/)
2. Create a new search engine
3. Get your Search Engine ID (CX)
4. Enable Custom Search API in [Google Cloud Console](https://console.cloud.google.com/)
5. Create an API key with Custom Search API access

### 5. Run the Application
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start

# Linting
npm run lint
```

### 6. Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

## 📖 How to Use Querra

### 1. **Select Research Category**
Choose from 6 specialized categories based on your research needs:
- **General Search**: Broad research across multiple domains
- **Academic Search**: Scholarly articles and research papers
- **Financial Analysis**: Market data and investment insights
- **Technology Review**: Product specs and technical documentation
- **Health & Medical**: Medical research and health guidelines
- **Legal Search**: Laws, regulations, and legal analysis

### 2. **Configure Search Parameters**
- Set maximum number of results (1-100)
- Apply time filters (Any, Past 24 hours, Past week, Past month, Past year)
- Exclude specific domains to refine results
- Add your own documents to the research scope

### 3. **Configure Research Mode**
Choose your preferred generation method:
- **Traditional Mode (Thorough Analysis)**:
  - Full content extraction from web pages
  - Deep analysis of all source materials
  - Best for comprehensive research reports
  - Processing time: 30-60 seconds
  
- **Fast Mode (Quick Insights)**:
  - Uses Gemini's URL context feature
  - Faster processing with web sources
  - Ideal for quick summaries and overviews
  - Processing time: 10-20 seconds
  - Note: Documents always use traditional mode for accuracy

### 4. **Generate Reports**
- Enter your research query
- Review and select relevant sources from search results
- Choose additional documents from your knowledge base
- Select generation mode based on your needs
- Generate AI-powered research reports with rich formatting

### 5. **Export and Save**
- Export reports in PDF, DOCX, TXT, or MD format
- Save reports to your knowledge base for future reference
- Organize and manage your research library

## � **Generation Modes Explained**

Querra offers two distinct generation modes to suit different research needs:

### ⚡ **Fast Mode (Quick Insights)**
- **Technology**: Uses Google Gemini's URL Context feature
- **Speed**: 10-20 seconds generation time
- **Best For**: 
  - Quick summaries and overviews
  - Time-sensitive research
  - Getting rapid insights from web sources
- **Limitations**: 
  - Web sources only (documents use traditional mode)
  - Less detailed content extraction
- **Output**: Professional formatted reports with citations and structure

### 🔬 **Traditional Mode (Thorough Analysis)**  
- **Technology**: Full content extraction + AI analysis
- **Speed**: 30-60 seconds generation time
- **Best For**:
  - Comprehensive research reports
  - Academic and professional research
  - Detailed analysis requirements
- **Capabilities**:
  - Supports both web sources and documents
  - Deep content extraction and analysis
  - Maximum accuracy and detail
- **Output**: Richly formatted reports with extensive citations

### 🎯 **When to Use Each Mode**

| Scenario | Recommended Mode | Why |
|----------|------------------|-----|
| Breaking news analysis | Fast Mode | Speed matters for current events |
| Academic research paper | Traditional Mode | Depth and accuracy required |
| Market trend overview | Fast Mode | Quick insights from multiple sources |
| Legal document analysis | Traditional Mode | Precision and detail critical |
| Technology comparison | Either Mode | Depends on time constraints |
| Financial analysis | Traditional Mode | Accuracy crucial for decisions |

## �🔧 Category-Specific Search Features

### Academic Search
- Focuses on scholarly sources and peer-reviewed content
- Enhanced prompts for academic writing style
- Emphasis on methodology and citations

### Financial Analysis
- Targets financial news and market data sources
- Specialized prompts for market trends and risk assessment
- Structured analysis format for investment insights

### Technology Review
- Optimized for tech specifications and product reviews
- Comparative analysis capabilities
- Focus on technical documentation and user feedback

### Health & Medical
- Medical journal and health guideline focused
- Clinical study emphasis with safety disclaimers
- Evidence-based research prioritization

### Legal Search
- Legal document and case law targeting
- Jurisdiction-aware search enhancement
- Professional disclaimers included

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically with each push

### Traditional Hosting
1. Build the application: `npm run build`
2. Set up Node.js server environment
3. Configure environment variables
4. Start the application: `npm start`

## 📁 Project Structure

```
Querra/
├── src/
│   ├── components/          # React components
│   │   ├── CategorySelector.tsx
│   │   ├── SearchSection.tsx
│   │   ├── ReportSection.tsx
│   │   └── ...
│   ├── pages/              # Next.js pages and API routes
│   │   ├── api/            # Backend API endpoints
│   │   ├── index.tsx       # Main research interface
│   │   └── knowledge-base.tsx
│   ├── utils/              # Utility classes and functions
│   │   ├── ai_processor.ts # Gemini AI integration
│   │   ├── search.ts       # Google Search API client
│   │   ├── database.ts     # SQLite database manager
│   │   └── extractor.ts    # Content extraction engine
│   ├── config/             # Configuration files
│   │   └── categories.ts   # Search category definitions
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
├── uploads/               # Document upload directory
└── knowledge_base.db      # SQLite database (auto-generated)
```

## 🔒 Environment & Security

### Production Considerations
- Ensure API keys are properly secured
- Implement rate limiting for API endpoints
- Configure proper CORS settings
- Use HTTPS in production

### Serverless Compatibility
- Automatic fallback to in-memory storage on Vercel
- Stateless operation for scalability
- Environment detection for optimal performance

## 🐛 Troubleshooting

### Common Issues
1. **API Key Errors**: Verify all environment variables are set correctly
2. **Search Not Working**: Check Google Custom Search API quotas
3. **PDF Upload Issues**: Ensure file size is under 10MB
4. **Generation Timeout**: Try reducing the number of sources

### Performance Optimization
- Limit concurrent requests to APIs
- Implement caching for frequently accessed content
- Use pagination for large result sets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please:
1. Check the troubleshooting section
2. Review the technical documentation (TECHNICAL.md)
3. Open an issue on GitHub
4. Contact the development team

---

**Querra** - Revolutionizing research with AI-powered intelligence.

### 📊 Export Options
- PDF export with proper formatting and styling
- DOCX export with preserved structure
- Plain text export
- Clickable citation links in the web view

### 📚 Knowledge Base
- Save generated reports for future reference
- Browse and search through past reports
- Organize research by topic
- Use documents from knowledge base in new reports

### 🌓 Dark Mode Support
- Full dark mode support throughout the application
- Custom-styled report display for better readability in dark mode
- Consistent styling across all components

### 🔔 User Experience Enhancements
- Toast notifications for user feedback
- Loading animations during report generation and search
- Improved mobile responsiveness
- Enhanced error handling and informative messages

### **Multiple Export Formats**: Export your research reports in various formats:
- PDF (formatted document with sections and styling)
- DOCX (Microsoft Word compatible)
- TXT (plain text)
- MD (Markdown format for easy version control and further editing)

### 🔄 Session Management
- Persistent state across page navigation
- All search results, selected sources, and generated reports are preserved
- Resume your research exactly where you left off
- Easily clear session data when starting new research
- Session data is securely stored in the browser's local storage

## Tech Stack

### Frontend
- **React**: UI library
- **Next.js**: React framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React Markdown**: Markdown rendering
- **jsPDF**: PDF generation
- **docx**: DOCX file generation
- **File-Saver**: Client-side file saving
- **Heroicons**: SVG icon library

### Backend (API Routes)
- **Next.js API Routes**: Serverless functions
- **Axios**: HTTP client
- **Cheerio**: Web scraping and HTML parsing

### AI/ML
- **Google Generative AI SDK**: Interface with Gemini AI
- **Google Custom Search API**: Web search functionality

### Development Tools
- **npm**: Package management
- **ESLint**: Code linting
- **TypeScript**: Static type checking

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- Google API Key (for search functionality)
- Google Custom Search Engine ID
- Google Gemini API Key

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/AdityaKothari27/querra.git
   cd querra
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   GOOGLE_API_KEY=your_google_api_key
   GOOGLE_CX=your_google_custom_search_id
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Selecting a Research Category

1. Choose a research category that matches your needs:
   - General Research: For broad topics across multiple domains
   - Academic Research: For scholarly and academic topics
   - Financial Analysis: For market data and financial information
   - Technology Review: For product reviews and technical documentation
   - Health & Medical: For medical research and health information
   - Legal Research: For laws, regulations, and legal analysis

### Searching for Sources

1. Enter your search topic in the search bar
2. Adjust search parameters if needed:
   - Max Results: Control the number of search results (5-20)
   - Time Filter: Filter results by recency
   - Domain Exclusion: Add domains you want to exclude from results
3. Click "Search" to find relevant sources
4. Navigate through results using pagination controls

### Generating Reports

1. Select sources to include in your report:
   - Use individual checkboxes to select specific sources
   - Use "Select All" to include all sources
2. Customize the prompt template if desired
3. Click "Generate Report" to create your research report
4. Monitor progress through the animated loading indicator
5. Review toast notifications for success or error messages

### Exporting Reports

1. Choose your preferred format (PDF, DOCX, or TXT)
2. Click "Export" to download the report
3. Open the file with the appropriate application

### Using the Knowledge Base

1. Navigate to the Knowledge Base page
2. Browse through previously generated reports
3. Search for specific topics or keywords
4. View or export saved reports

## API Configuration

### Google Custom Search API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Custom Search API
4. Create API credentials and copy your API key

### Google Programmable Search Engine

1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Create a new search engine
3. Configure it to search the entire web
4. Copy your Search Engine ID (cx)

### Google Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/)
2. Get API key for Gemini
3. Copy your API key

## Project Structure 
```
Querra/
├── public/                   # Static files
├── src/
│   ├── components/           # React components
│   │   ├── Layout.tsx        # Main layout component
│   │   ├── CategorySelector.tsx # Research category selection
│   │   ├── SearchSection.tsx # Search interface
│   │   ├── ReportSection.tsx # Report generation interface
│   │   └── Toast.tsx         # Toast notification component
│   ├── config/
│   │   └── categories.ts # Research category configurations
│   ├── lib/
│   │   └── api.ts            # API client functions
│   ├── pages/
│   │   ├── api/              # API routes
│   │   │   ├── generate.ts   # Report generation endpoint
│   │   │   ├── search.ts     # Search endpoint
│   │   │   └── reports.ts    # Knowledge base endpoint
│   │   ├── index.tsx         # Home page  
│   │   └── knowledge-base.tsx # Knowledge base page
│   ├── styles/
│   │   └── globals.css # Global styles and dark mode
│   ├── utils/
│   │   ├── ai_processor.ts   # AI integration
│   │   ├── database.ts       # Data storage
│   │   ├── extractor.ts      # Content extraction
│   │   └── search.ts         # Search functionality
│   └── types.ts              # TypeScript type definitions
├── .env.local                # Environment variables
├── next.config.js            # Next.js configuration
├── package.json              # Project dependencies
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Project documentation
```

## Recent Updates

- Added domain exclusion feature to filter out specific websites from search results
- Implemented pagination controls for easier navigation through search results
- Added loading animations for report generation with progress indication
- Added toast notifications for better user feedback during operations
- Improved report formatting with better section heading styles
- Enhanced dark mode styling for reports with better text contrast
- Added clickable citation links in report web view
- Optimized PDF and DOCX export functionality
- Improved error handling throughout the application
- Enhanced mobile responsiveness for better experience on smaller screens

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
