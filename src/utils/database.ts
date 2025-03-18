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
    const db = await this.getConnection();
    await db.run(
      'INSERT INTO reports (query, content, sources) VALUES (?, ?, ?)',
      query,
      content,
      JSON.stringify(sources)
    );
  }

  async get_reports() {
    const db = await this.getConnection();
    return db.all('SELECT * FROM reports ORDER BY created_at DESC');
  }

  async save_document(name: string, path: string, content: string) {
    const id = ++inMemoryDB.documentCounter;
    inMemoryDB.documents.push({
      id,
      name,
      path, // This is now just the filename, not an actual path
      content,
      created_at: new Date().toISOString()
    });
    return id;
  }

  async get_documents() {
    const db = await this.getConnection();
    return db.all('SELECT id, name, path, created_at FROM documents ORDER BY created_at DESC');
  }

  async get_document_content(id: number) {
    const db = await this.getConnection();
    const document = await db.get('SELECT content FROM documents WHERE id = ?', id);
    return document?.content || '';
  }

  async delete_document(id: number) {
    const db = await this.getConnection();
    await db.run('DELETE FROM documents WHERE id = ?', id);
  }

  async search_reports(query: string): Promise<Report[]> {
    return this.reports.filter(report => 
      report.query.toLowerCase().includes(query.toLowerCase())
    );
  }
} 