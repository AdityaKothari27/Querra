import sqlite3 from 'sqlite3';
import { open, Database as SQLiteDatabase } from 'sqlite';
import path from 'path';
import { Report } from '../types';

// In-memory storage for serverless environments
const inMemoryDB = {
  reports: [] as any[],
  documents: [] as any[],
  reportCounter: 0,
  documentCounter: 0
};

export class Database {
  private db: SQLiteDatabase | null = null;
  private dbPath: string;
  private reports: Report[] = [];

  constructor() {
    this.dbPath = path.join(process.cwd(), 'knowledge_base.db');
  }

  private async getConnection() {
    if (!this.db) {
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database,
      });

      // Create tables if they don't exist
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          query TEXT NOT NULL,
          content TEXT NOT NULL,
          sources TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          path TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }
    return this.db;
  }

  async save_report(query: string, content: string, sources: string[]) {
    const id = ++inMemoryDB.reportCounter;
    inMemoryDB.reports.push({
      id,
      query,
      content,
      sources: JSON.stringify(sources),
      created_at: new Date().toISOString()
    });
    return id;
  }

  async get_reports() {
    return inMemoryDB.reports.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async save_document(name: string, path: string, content: string) {
    const id = ++inMemoryDB.documentCounter;
    inMemoryDB.documents.push({
      id,
      name,
      path,
      content,
      created_at: new Date().toISOString()
    });
    return id;
  }

  async get_documents() {
    return inMemoryDB.documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      path: doc.path,
      created_at: doc.created_at
    }));
  }

  async get_document_by_id(id: number) {
    return inMemoryDB.documents.find(doc => doc.id === id);
  }

  async get_document_content(id: number) {
    const doc = await this.get_document_by_id(id);
    return doc?.content || '';
  }

  async delete_document(id: number) {
    const index = inMemoryDB.documents.findIndex(doc => doc.id === id);
    if (index !== -1) {
      inMemoryDB.documents.splice(index, 1);
    }
  }

  async search_reports(query: string): Promise<Report[]> {
    return this.reports.filter(report => 
      report.query.toLowerCase().includes(query.toLowerCase())
    );
  }
} 