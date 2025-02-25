from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
import json

Base = declarative_base()

class Report(Base):
    __tablename__ = 'reports'
    
    id = Column(Integer, primary_key=True)
    query = Column(String(500))
    content = Column(Text)
    sources = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Database:
    def __init__(self, db_path="sqlite:///knowledge_base.db"):
        self.engine = create_engine(db_path)
        Base.metadata.create_all(self.engine)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
    
    def save_report(self, query, content, sources):
        """Save a generated report to the knowledge base"""
        try:
            report = Report(
                query=query,
                content=content,
                sources=json.dumps(sources)
            )
            self.session.add(report)
            self.session.commit()
            return True
        except Exception as e:
            print(f"Error saving report: {str(e)}")
            self.session.rollback()
            return False
    
    def get_reports(self, limit=10):
        """Retrieve recent reports from the knowledge base"""
        try:
            return self.session.query(Report)\
                .order_by(Report.created_at.desc())\
                .limit(limit)\
                .all()
        except Exception as e:
            print(f"Error retrieving reports: {str(e)}")
            return []
    
    def search_reports(self, query):
        """Search for reports in the knowledge base"""
        try:
            return self.session.query(Report)\
                .filter(Report.query.ilike(f"%{query}%"))\
                .order_by(Report.created_at.desc())\
                .all()
        except Exception as e:
            print(f"Error searching reports: {str(e)}")
            return []
            
    def delete_report(self, report_id):
        """Delete a report from the knowledge base"""
        try:
            report = self.session.query(Report).get(report_id)
            if report:
                self.session.delete(report)
                self.session.commit()
                return True
            return False
        except Exception as e:
            print(f"Error deleting report: {str(e)}")
            self.session.rollback()
            return False
            
    def __del__(self):
        """Cleanup database connection"""
        try:
            self.session.close()
        except Exception as e:
            print(f"Error closing database session: {str(e)}")