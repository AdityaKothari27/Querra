# Deep Research

A powerful AI-powered research assistant that helps you gather information, analyze sources, and generate comprehensive reports on any topic.

![Deep Research](https://via.placeholder.com/800x400?text=Deep+Research)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [API Configuration](#api-configuration)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Overview

Deep Research is a web application that streamlines the research process by automating source discovery, content extraction, and report generation. It leverages AI to analyze multiple sources and synthesize information into well-structured reports.

The application allows users to:
- Search for relevant sources on any topic
- Select which sources to include in their research
- Generate comprehensive reports based on selected sources
- Export reports in various formats (PDF, DOCX, TXT)
- Save reports to a knowledge base for future reference

## Features

### 🔍 Intelligent Search
- Customizable search parameters (max results, time filters)
- Preview of search results with titles, snippets, and URLs
- "Select All" functionality for quick source selection

### 📝 AI-Powered Report Generation
- Extracts content from selected web sources
- Uses Google's Gemini AI to analyze and synthesize information
- Generates well-structured reports with proper formatting
- Customizable prompt templates for different report styles

### 📊 Export Options
- PDF export with proper formatting and styling
- DOCX export with preserved structure
- Plain text export

### 📚 Knowledge Base
- Save generated reports for future reference
- Browse and search through past reports
- Organize research by topic

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
   git clone https://github.com/yourusername/deep_research.git
   cd deep_research
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

### Searching for Sources

1. Enter your research topic in the search bar
2. Adjust search parameters if needed:
   - Max Results: Control the number of search results (5-20)
   - Time Filter: Filter results by recency
3. Click "Search" to find relevant sources

### Generating Reports

1. Select sources to include in your report:
   - Use individual checkboxes to select specific sources
   - Use "Select All" to include all sources
2. Customize the prompt template if desired
3. Click "Generate Report" to create your research report
4. Wait for the AI to analyze sources and generate the report

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