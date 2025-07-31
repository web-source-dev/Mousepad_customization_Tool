"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminTestPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (test: string, status: 'pass' | 'fail', message?: string) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      timestamp: new Date().toISOString()
    }]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    // Test 1: Check if window object exists
    try {
      if (typeof window !== 'undefined') {
        addTestResult('Window Object', 'pass', 'Window object is available');
      } else {
        addTestResult('Window Object', 'fail', 'Window object is not available');
      }
    } catch (error) {
      addTestResult('Window Object', 'fail', `Error: ${error}`);
    }

    // Test 2: Check if we're in an iframe
    try {
      if (window.parent !== window) {
        addTestResult('Iframe Detection', 'pass', 'Running in iframe');
      } else {
        addTestResult('Iframe Detection', 'pass', 'Not running in iframe (expected for test)');
      }
    } catch (error) {
      addTestResult('Iframe Detection', 'fail', `Error: ${error}`);
    }

    // Test 3: Check postMessage availability
    try {
      if (window.postMessage) {
        addTestResult('PostMessage API', 'pass', 'PostMessage API is available');
      } else {
        addTestResult('PostMessage API', 'fail', 'PostMessage API is not available');
      }
    } catch (error) {
      addTestResult('PostMessage API', 'fail', `Error: ${error}`);
    }

    // Test 4: Check fetch API
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        addTestResult('API Endpoint', 'pass', 'Orders API endpoint is accessible');
      } else {
        addTestResult('API Endpoint', 'fail', `API returned status: ${response.status}`);
      }
    } catch (error) {
      addTestResult('API Endpoint', 'fail', `Error: ${error}`);
    }

    // Test 5: Check localStorage
    try {
      localStorage.setItem('test', 'value');
      const value = localStorage.getItem('test');
      localStorage.removeItem('test');
      if (value === 'value') {
        addTestResult('LocalStorage', 'pass', 'LocalStorage is working');
      } else {
        addTestResult('LocalStorage', 'fail', 'LocalStorage test failed');
      }
    } catch (error) {
      addTestResult('LocalStorage', 'fail', `Error: ${error}`);
    }

    // Test 6: Check console logging
    try {
      console.log('Test console log');
      console.warn('Test console warn');
      console.error('Test console error');
      addTestResult('Console Logging', 'pass', 'Console logging is working');
    } catch (error) {
      addTestResult('Console Logging', 'fail', `Error: ${error}`);
    }

    // Test 7: Check Date object
    try {
      const date = new Date();
      if (date instanceof Date) {
        addTestResult('Date Object', 'pass', 'Date object is working');
      } else {
        addTestResult('Date Object', 'fail', 'Date object test failed');
      }
    } catch (error) {
      addTestResult('Date Object', 'fail', `Error: ${error}`);
    }

    // Test 8: Check Array methods
    try {
      const arr = [1, 2, 3];
      const mapped = arr.map(x => x * 2);
      const filtered = arr.filter(x => x > 1);
      if (mapped.length === 3 && filtered.length === 2) {
        addTestResult('Array Methods', 'pass', 'Array methods are working');
      } else {
        addTestResult('Array Methods', 'fail', 'Array methods test failed');
      }
    } catch (error) {
      addTestResult('Array Methods', 'fail', `Error: ${error}`);
    }

    setIsRunning(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel Test Suite</h1>
          <p className="text-gray-600">Run tests to verify admin panel functionality</p>
        </div>

        <div className="flex gap-4 mb-6">
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? 'Running Tests...' : 'Run Tests'}
          </Button>
          <Button 
            onClick={clearResults} 
            variant="outline"
            disabled={isRunning}
          >
            Clear Results
          </Button>
        </div>

        <div className="space-y-4">
          {testResults.map((result, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      result.status === 'pass' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium">{result.test}</span>
                  </div>
                  <span className={`text-sm px-2 py-1 rounded ${
                    result.status === 'pass' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.status.toUpperCase()}
                  </span>
                </div>
                {result.message && (
                  <p className="text-sm text-gray-600 mt-2 ml-6">{result.message}</p>
                )}
                <p className="text-xs text-gray-400 mt-1 ml-6">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {testResults.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tests</p>
                  <p className="text-2xl font-bold text-gray-900">{testResults.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Passed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {testResults.filter(r => r.status === 'pass').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {testResults.filter(r => r.status === 'fail').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {testResults.length > 0 
                      ? Math.round((testResults.filter(r => r.status === 'pass').length / testResults.length) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 