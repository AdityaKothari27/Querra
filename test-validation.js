// Test script to verify that the improved validation allows coding questions
const https = require('https');
const http = require('http');

const testMessages = [
  "How do I create a SELECT statement in SQL?",
  "Can you help me with this SQL query: SELECT * FROM users WHERE id = 1",
  "I need to create a JavaScript function with <script> tags",
  "Help me write a DROP TABLE statement for cleaning up test data",
  "How do I use document.cookie in JavaScript for authentication?",
  "What's the proper way to handle SQL injection prevention?",
  "Show me how to create an HTML form with <input> elements"
];

async function testMessage(message) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      message: message,
      sources: [],
      documentIds: []
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({
            message: message.substring(0, 50) + '...',
            status: res.statusCode,
            success: res.statusCode === 200,
            response: result.message ? 'Got response' : 'No response',
            error: result.message || result.error || null
          });
        } catch (e) {
          resolve({
            message: message.substring(0, 50) + '...',
            status: res.statusCode,
            success: false,
            response: 'Parse error',
            error: data
          });
        }
      });
    });

    req.on('error', (e) => {
      resolve({
        message: message.substring(0, 50) + '...',
        status: 'ERROR',
        success: false,
        response: 'Connection error',
        error: e.message
      });
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Input Validation Improvements');
  console.log('==========================================\n');

  for (const message of testMessages) {
    try {
      const result = await testMessage(message);
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status} ${result.message}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Response: ${result.response}`);
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    } catch (error) {
      console.log(`❌ FAILED ${message.substring(0, 50)}...`);
      console.log(`   Error: ${error.message}\n`);
    }
  }

  console.log('🎯 Test completed! All coding questions should now work without "Access denied" errors.');
}

// Wait a moment for the server to be ready
setTimeout(runTests, 2000);
