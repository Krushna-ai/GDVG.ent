import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BulkImport = ({ darkTheme, onImportComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showTemplate, setShowTemplate] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                         'application/vnd.ms-excel', 'text/csv'];
      
      if (validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setImportResult(null);
      } else {
        alert('Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file');
        e.target.value = '';
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const token = localStorage.getItem('admin_token');
      const response = await axios.post(`${API}/admin/bulk-import`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setImportResult(response.data);
      if (response.data.success && onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setImportResult({
        success: false,
        total_rows: 0,
        successful_imports: 0,
        failed_imports: 0,
        errors: [error.response?.data?.detail || 'Upload failed'],
        imported_content: []
      });
    } finally {
      setUploading(false);
    }
  };

  const getTemplate = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/bulk-import/template`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Create CSV content from template data
      const template = response.data.sample_data;
      const headers = Object.keys(template);
      const rows = [];
      
      // Get max length of arrays to handle all sample data
      const maxRows = Math.max(...Object.values(template).map(arr => arr.length));
      
      for (let i = 0; i < maxRows; i++) {
        const row = headers.map(header => {
          const value = template[header][i];
          return value !== null && value !== undefined ? value : '';
        });
        rows.push(row);
      }
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gdvg_bulk_import_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Error downloading template');
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setImportResult(null);
    document.getElementById('file-input').value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className={`text-xl font-bold ${
          darkTheme ? 'text-white' : 'text-gray-900'
        }`}>
          Bulk Import Content
        </h3>
        <button
          onClick={() => setShowTemplate(!showTemplate)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            darkTheme
              ? 'bg-gray-800 text-white hover:bg-gray-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {showTemplate ? 'Hide' : 'Show'} Instructions
        </button>
      </div>

      {/* Instructions */}
      {showTemplate && (
        <div className={`p-6 rounded-xl border ${
          darkTheme 
            ? 'bg-gray-900 border-red-900/50' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <h4 className={`font-semibold mb-4 ${
            darkTheme ? 'text-white' : 'text-gray-900'
          }`}>
            Bulk Import Instructions
          </h4>
          
          <div className="space-y-4">
            <div>
              <h5 className={`font-medium mb-2 ${
                darkTheme ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Supported File Formats:
              </h5>
              <ul className={`list-disc list-inside text-sm space-y-1 ${
                darkTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <li>Excel files (.xlsx, .xls)</li>
                <li>CSV files (.csv)</li>
              </ul>
            </div>

            <div>
              <h5 className={`font-medium mb-2 ${
                darkTheme ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Required Columns:
              </h5>
              <div className={`text-sm ${
                darkTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <code className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                  title, year, country, content_type, synopsis, rating
                </code>
              </div>
            </div>

            <div>
              <h5 className={`font-medium mb-2 ${
                darkTheme ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Optional Columns:
              </h5>
              <div className={`text-sm ${
                darkTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                  original_title, episodes, duration, cast, crew, streaming_platforms, tags, poster_url, banner_url
                </code>
              </div>
            </div>

            <div>
              <h5 className={`font-medium mb-2 ${
                darkTheme ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Content Types:
              </h5>
              <div className={`text-sm ${
                darkTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>
                movie, series, drama, anime
              </div>
            </div>

            <div>
              <h5 className={`font-medium mb-2 ${
                darkTheme ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Special Format Notes:
              </h5>
              <ul className={`list-disc list-inside text-sm space-y-1 ${
                darkTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <li><strong>Genres:</strong> Comma-separated (e.g., "thriller,drama,mystery")</li>
                <li><strong>Cast:</strong> JSON format [name, character fields]</li>
                <li><strong>Crew:</strong> JSON format [name, role fields]</li>
                <li><strong>Streaming Platforms:</strong> Comma-separated (e.g., "Netflix,Hulu")</li>
                <li><strong>Rating:</strong> Number between 0-10</li>
              </ul>
            </div>

            <button
              onClick={getTemplate}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
            >
              Download Sample Template
            </button>
          </div>
        </div>
      )}

      {/* File Upload */}
      <div className={`p-6 border-2 border-dashed rounded-xl transition-colors ${
        darkTheme
          ? 'border-gray-700 hover:border-red-600 bg-gray-900'
          : 'border-gray-300 hover:border-red-500 bg-gray-50'
      }`}>
        <div className="text-center">
          <svg className={`mx-auto h-12 w-12 mb-4 ${
            darkTheme ? 'text-gray-600' : 'text-gray-400'
          }`} stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <label
            htmlFor="file-input"
            className={`cursor-pointer inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all duration-200`}
          >
            Choose File
          </label>
          
          {selectedFile && (
            <div className="mt-4">
              <p className={`text-sm ${
                darkTheme ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Selected: <span className="font-medium">{selectedFile.name}</span>
              </p>
              <p className={`text-xs ${
                darkTheme ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Size: {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Button */}
      {selectedFile && (
        <div className="flex gap-4">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {uploading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importing...
              </div>
            ) : (
              'Import Content'
            )}
          </button>
          
          <button
            onClick={resetUpload}
            disabled={uploading}
            className={`px-6 py-3 rounded-lg transition-colors disabled:opacity-50 ${
              darkTheme
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Reset
          </button>
        </div>
      )}

      {/* Import Results */}
      {importResult && (
        <div className={`p-6 rounded-xl border ${
          importResult.success
            ? (darkTheme ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200')
            : (darkTheme ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200')
        }`}>
          <div className="flex items-center mb-4">
            {importResult.success ? (
              <svg className="h-6 w-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <h4 className={`font-semibold ${
              importResult.success 
                ? 'text-green-800' 
                : 'text-red-800'
            }`}>
              Import {importResult.success ? 'Completed' : 'Failed'}
            </h4>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className={`text-center p-3 rounded-lg ${
              darkTheme ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`text-2xl font-bold ${
                darkTheme ? 'text-white' : 'text-gray-900'
              }`}>
                {importResult.total_rows}
              </div>
              <div className={`text-sm ${
                darkTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Total Rows
              </div>
            </div>

            <div className={`text-center p-3 rounded-lg ${
              darkTheme ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="text-2xl font-bold text-green-600">
                {importResult.successful_imports}
              </div>
              <div className={`text-sm ${
                darkTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Imported
              </div>
            </div>

            <div className={`text-center p-3 rounded-lg ${
              darkTheme ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="text-2xl font-bold text-red-600">
                {importResult.failed_imports}
              </div>
              <div className={`text-sm ${
                darkTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Failed
              </div>
            </div>

            <div className={`text-center p-3 rounded-lg ${
              darkTheme ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className={`text-2xl font-bold ${
                importResult.successful_imports > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {importResult.total_rows > 0 ? Math.round((importResult.successful_imports / importResult.total_rows) * 100) : 0}%
              </div>
              <div className={`text-sm ${
                darkTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Success Rate
              </div>
            </div>
          </div>

          {/* Successfully Imported Content */}
          {importResult.imported_content.length > 0 && (
            <div className="mb-4">
              <h5 className={`font-medium mb-2 ${
                darkTheme ? 'text-green-300' : 'text-green-800'
              }`}>
                Successfully Imported:
              </h5>
              <div className="max-h-32 overflow-y-auto">
                <ul className={`text-sm space-y-1 ${
                  darkTheme ? 'text-green-200' : 'text-green-700'
                }`}>
                  {importResult.imported_content.map((content, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {content}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Errors */}
          {importResult.errors.length > 0 && (
            <div>
              <h5 className={`font-medium mb-2 ${
                darkTheme ? 'text-red-300' : 'text-red-800'
              }`}>
                Errors:
              </h5>
              <div className="max-h-32 overflow-y-auto">
                <ul className={`text-sm space-y-1 ${
                  darkTheme ? 'text-red-200' : 'text-red-700'
                }`}>
                  {importResult.errors.map((error, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="h-4 w-4 mr-2 mt-0.5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkImport;