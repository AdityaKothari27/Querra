/**
 * Security Audit and Assessment Tool
 * Run this to perform comprehensive security checks on the application
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface SecurityAuditResult {
  score: number;
  maxScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  findings: SecurityFinding[];
  recommendations: string[];
}

interface SecurityFinding {
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  file?: string;
  line?: number;
  recommendation: string;
}

class SecurityAuditor {
  private findings: SecurityFinding[] = [];
  private score = 0;
  private maxScore = 100;

  async performAudit(): Promise<SecurityAuditResult> {
    console.log('🔍 Starting comprehensive security audit...\n');

    await this.auditEnvironmentConfiguration();
    await this.auditDependencies();
    await this.auditCodePatterns();
    await this.auditAPIEndpoints();
    await this.auditFilePermissions();
    await this.auditSecurityHeaders();

    const grade = this.calculateGrade();
    const recommendations = this.generateRecommendations();

    return {
      score: this.score,
      maxScore: this.maxScore,
      grade,
      findings: this.findings,
      recommendations
    };
  }

  private async auditEnvironmentConfiguration(): Promise<void> {
    console.log('🔧 Auditing environment configuration...');

    // Check for .env files in repository
    const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        this.addFinding({
          category: 'Environment Security',
          severity: 'HIGH',
          description: `Environment file ${envFile} found in repository`,
          file: envFile,
          recommendation: 'Remove environment files from version control and add to .gitignore'
        });
        this.score -= 15;
      }
    }

    // Check for API keys in code
    try {
      const result = execSync('grep -r "AIza\\|sk-\\|gsk_" --include="*.ts" --include="*.js" src/', { encoding: 'utf8' });
      if (result) {
        this.addFinding({
          category: 'API Key Security',
          severity: 'CRITICAL',
          description: 'Potential API keys found in source code',
          recommendation: 'Remove hardcoded API keys and use environment variables'
        });
        this.score -= 25;
      }
    } catch (error) {
      // No matches found - good!
      this.score += 10;
    }

    // Check if example env file exists
    if (fs.existsSync('.env.example')) {
      this.score += 5;
    } else {
      this.addFinding({
        category: 'Documentation',
        severity: 'LOW',
        description: 'No .env.example file found',
        recommendation: 'Create .env.example with required environment variables'
      });
    }
  }

  private async auditDependencies(): Promise<void> {
    console.log('📦 Auditing dependencies...');

    try {
      // Run npm audit
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditResult);

      if (audit.vulnerabilities) {
        Object.entries(audit.vulnerabilities).forEach(([pkg, vuln]: [string, any]) => {
          this.addFinding({
            category: 'Dependency Security',
            severity: vuln.severity?.toUpperCase() || 'MEDIUM',
            description: `Vulnerable dependency: ${pkg}`,
            recommendation: 'Update to a secure version of the dependency'
          });

          const scoreDeduction = vuln.severity === 'critical' ? 20 : 
                                vuln.severity === 'high' ? 15 : 
                                vuln.severity === 'moderate' ? 10 : 5;
          this.score -= scoreDeduction;
        });
      } else {
        this.score += 10;
      }
    } catch (error) {
      console.warn('Could not run npm audit');
    }

    // Check for outdated dependencies
    try {
      const outdatedResult = execSync('npm outdated --json', { encoding: 'utf8' });
      const outdated = JSON.parse(outdatedResult);
      
      if (Object.keys(outdated).length > 5) {
        this.addFinding({
          category: 'Dependency Management',
          severity: 'MEDIUM',
          description: `${Object.keys(outdated).length} outdated dependencies`,
          recommendation: 'Update dependencies regularly'
        });
        this.score -= 5;
      }
    } catch (error) {
      // No outdated dependencies or error - continue
    }
  }

  private async auditCodePatterns(): Promise<void> {
    console.log('🔍 Auditing code patterns...');

    const patterns = [
      {
        pattern: 'eval\\(',
        severity: 'CRITICAL' as const,
        description: 'Use of eval() function detected',
        recommendation: 'Remove eval() usage - it can execute arbitrary code'
      },
      {
        pattern: 'innerHTML\\s*=',
        severity: 'HIGH' as const,
        description: 'Direct innerHTML assignment detected',
        recommendation: 'Use textContent or sanitize HTML to prevent XSS'
      },
      {
        pattern: 'console\\.log\\(',
        severity: 'LOW' as const,
        description: 'Console.log statements found',
        recommendation: 'Remove debug statements in production code'
      },
      {
        pattern: 'TODO|FIXME|HACK',
        severity: 'LOW' as const,
        description: 'TODO/FIXME comments found',
        recommendation: 'Review and address pending tasks'
      }
    ];

    for (const { pattern, severity, description, recommendation } of patterns) {
      try {
        const result = execSync(`grep -r "${pattern}" --include="*.ts" --include="*.js" src/`, { encoding: 'utf8' });
        if (result) {
          const lines = result.split('\n').filter(line => line.trim());
          this.addFinding({
            category: 'Code Quality',
            severity,
            description: `${description} (${lines.length} occurrences)`,
            recommendation
          });

          const scoreDeduction = severity === 'CRITICAL' ? 15 : 
                                severity === 'HIGH' ? 10 : 
                                5; // MEDIUM or LOW
          this.score -= Math.min(scoreDeduction * lines.length, 20);
        }
      } catch (error) {
        // Pattern not found - good for most cases
        if (!pattern.includes('TODO') && !pattern.includes('console')) {
          this.score += 5;
        }
      }
    }
  }

  private async auditAPIEndpoints(): Promise<void> {
    console.log('🌐 Auditing API endpoints...');

    const apiDir = 'src/pages/api';
    if (!fs.existsSync(apiDir)) {
      return;
    }

    const apiFiles = this.getAllFiles(apiDir, '.ts');
    
    for (const file of apiFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for rate limiting
      if (!content.includes('RateLimiter') && !content.includes('withSecurity')) {
        this.addFinding({
          category: 'API Security',
          severity: 'MEDIUM',
          description: `No rate limiting detected in ${file}`,
          file,
          recommendation: 'Add rate limiting to prevent abuse'
        });
        this.score -= 5;
      }

      // Check for input validation
      if (!content.includes('validate') && content.includes('req.body')) {
        this.addFinding({
          category: 'Input Validation',
          severity: 'HIGH',
          description: `No input validation detected in ${file}`,
          file,
          recommendation: 'Add input validation for all user inputs'
        });
        this.score -= 10;
      }

      // Check for error handling
      if (!content.includes('try') || !content.includes('catch')) {
        this.addFinding({
          category: 'Error Handling',
          severity: 'MEDIUM',
          description: `No error handling detected in ${file}`,
          file,
          recommendation: 'Add proper error handling'
        });
        this.score -= 5;
      }
    }
  }

  private async auditFilePermissions(): Promise<void> {
    console.log('🔐 Auditing file permissions...');

    const sensitiveFiles = [
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'next.config.js'
    ];

    for (const file of sensitiveFiles) {
      if (fs.existsSync(file)) {
        try {
          const stats = fs.statSync(file);
          const mode = (stats.mode & parseInt('777', 8)).toString(8);
          
          if (mode !== '644' && mode !== '755') {
            this.addFinding({
              category: 'File Permissions',
              severity: 'MEDIUM',
              description: `Unusual file permissions (${mode}) on ${file}`,
              file,
              recommendation: 'Set appropriate file permissions (644 for files, 755 for directories)'
            });
            this.score -= 3;
          }
        } catch (error) {
          // Continue on error
        }
      }
    }
  }

  private async auditSecurityHeaders(): Promise<void> {
    console.log('🛡️ Auditing security headers...');

    const nextConfigPath = 'next.config.js';
    if (fs.existsSync(nextConfigPath)) {
      const content = fs.readFileSync(nextConfigPath, 'utf8');
      
      const securityHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Strict-Transport-Security'
      ];

      const missingHeaders = securityHeaders.filter(header => !content.includes(header));
      
      if (missingHeaders.length > 0) {
        this.addFinding({
          category: 'Security Headers',
          severity: 'MEDIUM',
          description: `Missing security headers: ${missingHeaders.join(', ')}`,
          file: nextConfigPath,
          recommendation: 'Add security headers to Next.js configuration'
        });
        this.score -= missingHeaders.length * 3;
      } else {
        this.score += 10;
      }
    }
  }

  private getAllFiles(dir: string, extension: string): string[] {
    const files: string[] = [];
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...this.getAllFiles(fullPath, extension));
      } else if (entry.name.endsWith(extension)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  private addFinding(finding: Omit<SecurityFinding, 'category'> & { category: string }): void {
    this.findings.push(finding as SecurityFinding);
  }

  private calculateGrade(): 'A' | 'B' | 'C' | 'D' | 'F' {
    const percentage = (this.score / this.maxScore) * 100;
    
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  private generateRecommendations(): string[] {
    const recommendations = [
      'Implement comprehensive input validation on all API endpoints',
      'Add rate limiting to prevent API abuse',
      'Use HTTPS in production with proper SSL/TLS configuration',
      'Regularly update dependencies and monitor for vulnerabilities',
      'Implement proper error handling without exposing sensitive information',
      'Add security headers to prevent common web vulnerabilities',
      'Use environment variables for all sensitive configuration',
      'Implement logging and monitoring for security events',
      'Regular security audits and penetration testing',
      'Follow the principle of least privilege for access controls'
    ];

    return recommendations;
  }
}

// CLI usage
if (require.main === module) {
  const auditor = new SecurityAuditor();
  
  auditor.performAudit().then(result => {
    console.log('\n' + '='.repeat(60));
    console.log('🔒 SECURITY AUDIT REPORT');
    console.log('='.repeat(60));
    console.log(`Score: ${result.score}/${result.maxScore} (${Math.round((result.score/result.maxScore)*100)}%)`);
    console.log(`Grade: ${result.grade}`);
    console.log(`Findings: ${result.findings.length}`);
    
    if (result.findings.length > 0) {
      console.log('\n📋 FINDINGS:');
      result.findings.forEach((finding, index) => {
        console.log(`\n${index + 1}. [${finding.severity}] ${finding.description}`);
        if (finding.file) console.log(`   File: ${finding.file}`);
        console.log(`   Recommendation: ${finding.recommendation}`);
      });
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    result.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    console.log('\n' + '='.repeat(60));
    
    if (result.grade === 'F' || result.grade === 'D') {
      process.exit(1);
    }
  }).catch(error => {
    console.error('Audit failed:', error);
    process.exit(1);
  });
}

export default SecurityAuditor;
