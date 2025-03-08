import { CategoryConfig } from '../types/index';

export const categories: CategoryConfig[] = [
  {
    id: 'general',
    name: 'General Research',
    description: 'Broad research across multiple sources',
    icon: 'GlobeAltIcon',
    defaultPrompt: 'Generate a comprehensive report based on the following sources. Format your response using Markdown with proper headings (##), bullet points, numbered lists, and emphasis where appropriate. Include key findings, analysis, and recommendations.',
    searchInstructions: 'Search across multiple domains for comprehensive research.',
    color: 'blue',
  },
  {
    id: 'academic',
    name: 'Academic Research',
    description: 'Scholarly articles, journals, and research papers',
    icon: 'AcademicCapIcon',
    defaultPrompt: 'Generate an academic research summary based on these scholarly sources. Format your response using Markdown with proper headings (##), citations, and academic terminology. Include methodology analysis, key findings, theoretical implications, and suggestions for future research. Maintain a formal academic tone throughout.',
    searchInstructions: 'Search academic and scholarly sources.',
    color: 'purple',
  },
  {
    id: 'financial',
    name: 'Financial Analysis',
    description: 'Market data, financial reports, and investment insights',
    icon: 'ChartBarIcon',
    defaultPrompt: 'Generate a financial analysis report based on these sources. Format your response using Markdown with proper headings (##). Include market trends, key financial metrics, risk assessment, and investment outlook. Where appropriate, suggest how data could be visualized (e.g., "Chart: Stock Price Trend"). Provide balanced analysis of bullish and bearish perspectives.',
    searchInstructions: 'Search financial and market analysis sources.',
    color: 'green',
  },
  {
    id: 'tech',
    name: 'Technology Review',
    description: 'Product specifications, comparisons, and technical documentation',
    icon: 'ComputerDesktopIcon',
    defaultPrompt: 'Generate a comprehensive technology review based on these sources. Format your response using Markdown with proper headings (##). Include technical specifications, feature analysis, competitive comparison, user reviews summary, and pros/cons. Highlight key technical aspects and provide a balanced assessment of the technology\'s strengths and limitations.',
    searchInstructions: 'Search technology news and documentation.',
    color: 'indigo',
  },
  {
    id: 'health',
    name: 'Health & Medical',
    description: 'Medical research, health guidelines, and clinical studies',
    icon: 'HeartIcon',
    defaultPrompt: 'Generate a health information report based on these medical sources. Format your response using Markdown with proper headings (##). Include clinical findings, medical consensus, treatment options, and preventative measures. Clearly distinguish between established medical facts and emerging research. Add a disclaimer that this information should not replace professional medical advice.',
    searchInstructions: 'Search medical and health-related sources.',
    color: 'red',
  },
  {
    id: 'legal',
    name: 'Legal Research',
    description: 'Laws, regulations, case studies, and legal analysis',
    icon: 'ScaleIcon',
    defaultPrompt: 'Generate a legal research brief based on these sources. Format your response using Markdown with proper headings (##). Include relevant laws/regulations, case precedents, legal interpretations, and potential implications. Organize information by jurisdiction where applicable. Add a disclaimer that this does not constitute legal advice and should not replace consultation with a legal professional.',
    searchInstructions: 'Search legal documents and case law.',
    color: 'amber',
  },
];

export const getCategoryById = (id: string): CategoryConfig => {
  return categories.find(cat => cat.id === id) || categories[0];
}; 