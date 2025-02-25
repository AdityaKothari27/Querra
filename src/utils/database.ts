import { Report } from '../types';

export class Database {
  private reports: Report[] = [];

  async save_report(query: string, report: string, sources: string[]): Promise<void> {
    const newReport: Report = {
      id: Date.now(),
      query,
      content: report,
      sources,
      created_at: new Date().toISOString()
    };
    this.reports.push(newReport);
  }

  async get_reports(): Promise<Report[]> {
    return this.reports;
  }

  async search_reports(query: string): Promise<Report[]> {
    return this.reports.filter(report => 
      report.query.toLowerCase().includes(query.toLowerCase())
    );
  }
} 