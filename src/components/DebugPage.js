import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const DebugPage = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results = {};

    // Test 1: Environment Variables
    results.envVars = {
      REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL || 'NOT SET',
      REACT_APP_SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV
    };

    // Test 2: Supabase Client
    results.supabaseClient = supabase ? 'Initialized' : 'Failed to initialize';

    // Test 3: Direct Fetch Test
    try {
      const url = process.env.REACT_APP_SUPABASE_URL;
      if (url) {
        const response = await fetch(`${url}/rest/v1/`, {
          headers: {
            'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY || '',
            'Content-Type': 'application/json'
          }
        });
        results.directFetch = `Status: ${response.status}`;
      } else {
        results.directFetch = 'Cannot test - URL not available';
      }
    } catch (error) {
      results.directFetch = `Error: ${error.message}`;
    }

    // Test 4: Supabase Auth Test
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.getSession();
        results.authTest = error ? `Error: ${error.message}` : 'Auth working';
      } else {
        results.authTest = 'Supabase client not available';
      }
    } catch (error) {
      results.authTest = `Error: ${error.message}`;
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>BiotrackerApp Debug Page</h2>
      <button 
        onClick={runTests} 
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px',
          marginBottom: '20px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Running Tests...' : 'Run Debug Tests'}
      </button>

      {Object.keys(testResults).length > 0 && (
        <div>
          <h3>Test Results:</h3>
          <pre style={{ 
            background: '#f0f0f0', 
            padding: '15px', 
            borderRadius: '5px',
            overflow: 'auto'
          }}>
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <h3>Manual Checks:</h3>
        <ol>
          <li>Open browser DevTools (F12)</li>
          <li>Check Console tab for any red errors</li>
          <li>Check Network tab when trying to login</li>
          <li>Look for failed requests (red status)</li>
        </ol>
      </div>
    </div>
  );
};

export default DebugPage;