from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class Report(Base):
    """Report model for storing generated research reports"""
    __tablename__ = 'reports'
    
    id = Column(Integer, primary_key=True)
    query = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    sources = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    def __repr__(self):
        return f"<Report(id={self.id}, query='{self.query[:30]}...', created_at={self.created_at})>"
        
    def to_dict(self):
        return {
            'id': self.id,
            'query': self.query,
            'content': self.content,
            'sources': self.sources,
            'created_at': self.created_at.isoformat()
        }