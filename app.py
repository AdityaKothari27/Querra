import streamlit as st
import os
from dotenv import load_dotenv
from utils.search import GoogleSearch
from utils.extractor import ContentExtractor
from utils.ai_processor import GeminiProcessor
from utils.database import Database
from utils.export import ReportExporter
import datetime

# Load environment variables
load_dotenv()

# Initialize components
db = Database()
search_engine = GoogleSearch()
extractor = ContentExtractor()
ai_processor = GeminiProcessor()
exporter = ReportExporter()

def init_session_state():
    if 'search_results' not in st.session_state:
        st.session_state.search_results = []
    if 'selected_urls' not in st.session_state:
        st.session_state.selected_urls = []
    if 'generated_report' not in st.session_state:
        st.session_state.generated_report = ""
    if 'current_query' not in st.session_state:
        st.session_state.current_query = ""

def search_page():
    st.title("🔍 Deep Research")
    
    # Sidebar configuration
    with st.sidebar:
        st.header("Configuration")
        max_results = st.slider("Max Search Results", 5, 20, 10)
        time_filter = st.selectbox(
            "Time Filter",
            ["Any", "Past 24 hours", "Past week", "Past month", "Past year"]
        )
    
    # Main content area
    col1, col2 = st.columns([2, 3])
    
    with col1:
        st.subheader("Search")
        query = st.text_input("Enter your research topic")
        st.session_state.current_query = query
        
        if st.button("Search"):
            with st.spinner("Fetching search results..."):
                results = search_engine.search(query, max_results=max_results, time_filter=time_filter)
                st.session_state.search_results = results
                
        if st.session_state.search_results:
            st.subheader("Select Sources")
            selected = []
            for idx, result in enumerate(st.session_state.search_results):
                if st.checkbox(f"{result['title'][:60]}...", key=f"result_{idx}"):
                    selected.append(result['url'])
            st.session_state.selected_urls = selected
    
    with col2:
        st.subheader("Report Generation")
        prompt_template = st.text_area(
            "Custom Prompt Template",
            "Generate a comprehensive report based on the following sources. "
            "Include key findings, analysis, and recommendations."
        )
        
        if st.button("Generate Report") and st.session_state.selected_urls:
            with st.spinner("Generating report..."):
                # Extract content from selected URLs
                contents = []
                for url in st.session_state.selected_urls:
                    content = extractor.extract(url)
                    contents.append(content)
                
                # Generate report using Gemini
                report = ai_processor.generate_report(query, contents, prompt_template)
                st.session_state.generated_report = report
                
                # Save to knowledge base
                db.save_report(query, report, st.session_state.selected_urls)
        
        if st.session_state.generated_report:
            st.subheader("Generated Report")
            st.markdown(st.session_state.generated_report)
            
            # Export options
            col_export_1, col_export_2 = st.columns([2, 1])
            with col_export_1:
                export_format = st.selectbox("Export Format", ["PDF", "DOCX", "TXT"])
            with col_export_2:
                if st.button("Export"):
                    with st.spinner("Exporting report..."):
                        if export_format == "PDF":
                            filepath = exporter.export_pdf(
                                st.session_state.current_query,
                                st.session_state.generated_report
                            )
                        elif export_format == "DOCX":
                            filepath = exporter.export_docx(
                                st.session_state.current_query,
                                st.session_state.generated_report
                            )
                        else:
                            filepath = exporter.export_txt(
                                st.session_state.current_query,
                                st.session_state.generated_report
                            )
                        
                        if filepath:
                            with open(filepath, 'rb') as f:
                                st.download_button(
                                    label="Download Report",
                                    data=f.read(),
                                    file_name=os.path.basename(filepath),
                                    mime="application/octet-stream"
                                )

def knowledge_base_page():
    st.title("🧠 Knowledge Base")
    
    # Search functionality
    search_query = st.text_input("Search previous reports")
    if search_query:
        reports = db.search_reports(search_query)
    else:
        reports = db.get_reports()
    
    # Display reports
    for report in reports:
        with st.expander(f"{report.query} - {report.created_at.strftime('%Y-%m-%d %H:%M')}"):
            st.markdown(report.content)
            st.markdown("**Sources:**")
            for url in eval(report.sources):
                st.markdown(f"- {url}")
            
            if st.button("Delete Report", key=f"delete_{report.id}"):
                if db.delete_report(report.id):
                    st.success("Report deleted successfully!")
                    st.experimental_rerun()

def main():
    st.set_page_config(page_title="Deep Research", layout="wide")
    
    # Load custom CSS
    with open('static/style.css') as f:
        st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)
    
    init_session_state()
    
    # Navigation
    page = st.sidebar.radio("Navigation", ["Search & Generate", "Knowledge Base"])
    
    if page == "Search & Generate":
        search_page()
    else:
        knowledge_base_page()

if __name__ == "__main__":
    main()