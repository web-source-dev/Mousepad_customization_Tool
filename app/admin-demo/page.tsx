"use client";

import React, { useState } from 'react';

export default function AdminDemoPage() {
  const [iframeHeight, setIframeHeight] = useState('800px');

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Admin Panel Demo
          </h1>
          <p className="text-gray-600 mb-4">
            This page demonstrates how to embed the admin panel in an iframe for Wix integration.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Iframe Embed Code:</h3>
            <code className="text-sm bg-white p-3 rounded border block overflow-x-auto">
              {`<iframe 
  src="https://your-domain.com/admin" 
  width="100%" 
  height="${iframeHeight}" 
  frameborder="0" 
  style="border: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"
></iframe>`}
            </code>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setIframeHeight('600px')}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Small (600px)
            </button>
            <button
              onClick={() => setIframeHeight('800px')}
              className="px-4 py-2 bg-blue-200 rounded hover:bg-blue-300"
            >
              Medium (800px)
            </button>
            <button
              onClick={() => setIframeHeight('1000px')}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Large (1000px)
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h2 className="text-lg font-semibold text-gray-700">
              Embedded Admin Panel Preview
            </h2>
          </div>
          
          <iframe
            src="/admin"
            width="100%"
            height={iframeHeight}
            frameBorder="0"
            style={{
              border: 'none',
              borderRadius: '0 0 8px 8px',
            }}
            title="Admin Panel"
          />
        </div>

        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">Features:</h3>
          <ul className="text-green-800 space-y-1">
            <li>• Responsive design that adapts to iframe size</li>
            <li>• Real-time order data with search and filtering</li>
            <li>• High-quality mousepad preview images</li>
            <li>• Download functionality for order images</li>
            <li>• Complete order details and shipping information</li>
            <li>• Order statistics and revenue tracking</li>
            <li>• Smooth loading with skeleton screens</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 