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
  private isServerless: boolean;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'knowledge_base.db');
    // Check if running in a serverless environment
    this.isServerless = process.env.VERCEL_ENV !== undefined;
  }

  private async getConnection() {
    if (this.isServerless) {
      // No need to create a SQLite connection in serverless
      return null;
    }

    if (!this.db) {
      try {
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
      } catch (error) {
        console.error('Failed to open SQLite database:', error);
        // Fallback to in-memory if there's an error
        return null;
      }
    }
    return this.db;
  }

  async save_report(query: string, content: string, sources: string[]) {
    const db = await this.getConnection();
    if (db) {
      try {
        await db.run(
          'INSERT INTO reports (query, content, sources) VALUES (?, ?, ?)',
          query,
          content,
          JSON.stringify(sources)
        );
      } catch (error) {
        console.error('Error saving report to SQLite:', error);
        // Fallback to in-memory
        const id = ++inMemoryDB.reportCounter;
        inMemoryDB.reports.push({
          id,
          query,
          content,
          sources: JSON.stringify(sources),
          created_at: new Date().toISOString()
        });
      }
    } else {
      // Use in-memory storage
      const id = ++inMemoryDB.reportCounter;
      inMemoryDB.reports.push({
        id,
        query,
        content,
        sources: JSON.stringify(sources),
        created_at: new Date().toISOString()
      });
    }
  }

  async get_reports() {
    const db = await this.getConnection();
    if (db) {
      try {
        return await db.all('SELECT * FROM reports ORDER BY created_at DESC');
      } catch (error) {
        console.error('Error getting reports from SQLite:', error);
        return inMemoryDB.reports;
      }
    }
    return inMemoryDB.reports;
  }

  async save_document(name: string, path: string, content: string) {
    const db = await this.getConnection();
    if (db) {
      try {
        const result = await db.run(
          'INSERT INTO documents (name, path, content) VALUES (?, ?, ?)',
          name,
          path,
          content
        );
        return result.lastID;
      } catch (error) {
        console.error('Error saving document to SQLite:', error);
        // Fallback to in-memory
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
    } else {
      // Use in-memory storage
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
  }

  async get_documents() {
    const db = await this.getConnection();
    if (db) {
      try {
        return await db.all('SELECT id, name, path, created_at FROM documents ORDER BY created_at DESC');
      } catch (error) {
        console.error('Error getting documents from SQLite:', error);
        return inMemoryDB.documents;
      }
    }
    return inMemoryDB.documents;
  }

  async get_document_content(id: number) {
    const db = await this.getConnection();
    if (db) {
      try {
        const document = await db.get('SELECT content FROM documents WHERE id = ?', id);
        return document?.content || '';
      } catch (error) {
        console.error('Error getting document content from SQLite:', error);
        const doc = inMemoryDB.documents.find(d => d.id === id);
        return doc?.content || '';
      }
    }
    const doc = inMemoryDB.documents.find(d => d.id === id);
    return doc?.content || '';
  }

  async delete_document(id: number) {
    const db = await this.getConnection();
    if (db) {
      try {
        await db.run('DELETE FROM documents WHERE id = ?', id);
      } catch (error) {
        console.error('Error deleting document from SQLite:', error);
        // Also update in-memory storage
        const index = inMemoryDB.documents.findIndex(d => d.id === id);
        if (index !== -1) {
          inMemoryDB.documents.splice(index, 1);
        }
      }
    } else {
      // Use in-memory storage
      const index = inMemoryDB.documents.findIndex(d => d.id === id);
      if (index !== -1) {
        inMemoryDB.documents.splice(index, 1);
      }
    }
  }

  async delete_report(id: number): Promise<void> {
    const db = await this.getConnection();
    if (db) {
      try {
        // Delete the report from SQLite
        await db.run('DELETE FROM reports WHERE id = ?', id);
      } catch (error) {
        console.error(`Error deleting report ${id} from SQLite:`, error);
      }
    }
    
    // Also update in-memory storage if needed
    const index = inMemoryDB.reports.findIndex(r => r.id === id);
    if (index !== -1) {
      inMemoryDB.reports.splice(index, 1);
    }
  }

  async search_reports(query: string): Promise<Report[]> {
    const db = await this.getConnection();
    if (db) {
      try {
        const reports = await db.all('SELECT * FROM reports ORDER BY created_at DESC');
        return reports.filter((report: Report) => 
          report.query.toLowerCase().includes(query.toLowerCase())
        );
      } catch (error) {
        console.error('Error searching reports from SQLite:', error);
        return inMemoryDB.reports.filter((report) => 
          report.query.toLowerCase().includes(query.toLowerCase())
        );
      }
    }
    return inMemoryDB.reports.filter((report) => 
      report.query.toLowerCase().includes(query.toLowerCase())
    );
  }
} 