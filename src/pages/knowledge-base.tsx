import { FC, useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getReports, searchReports, deleteReport } from '../lib/api';
import { Report } from '../types';

const KnowledgeBasePage: FC = () => {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const data = await getReports();
    setReports(data);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">{report.query}</h2>
              <div className="prose max-w-none">{report.content}</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default KnowledgeBasePage; 