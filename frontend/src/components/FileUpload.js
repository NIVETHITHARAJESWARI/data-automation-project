import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFile } from '../services/api';

const FileUpload = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await uploadFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        onUploadSuccess(response.data);
      }, 500);

    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
      setUploading(false);
      setUploadProgress(0);
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <div className="file-upload-container">
      <div className="upload-header">
        <h2>Upload Your Dataset</h2>
        <p>Support formats: CSV, Excel (.xlsx, .xls)</p>
      </div>

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${isDragReject ? 'reject' : ''} ${uploading ? 'uploading' : ''}`}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="upload-progress">
            <div className="upload-spinner"></div>
            <p>Processing your data...</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="progress-text">{uploadProgress}% complete</p>
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">📊</div>
            {isDragActive ? (
              <p>Drop your file here...</p>
            ) : (
              <>
                <p>Drag and drop your dataset here, or <strong>click to browse</strong></p>
                <div className="file-types">
                  <span>CSV</span>
                  <span>XLSX</span>
                  <span>XLS</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="upload-features">
        <h3>What happens after upload?</h3>
        <div className="features-grid">
          <div className="feature">
            <span className="feature-icon">🧹</span>
            <h4>Data Cleaning</h4>
            <p>Automatic removal of duplicates, handling missing values, and data type corrections</p>
          </div>
          <div className="feature">
            <span className="feature-icon">💡</span>
            <h4>Smart Insights</h4>
            <p>AI-powered analysis to discover patterns, correlations, and key findings</p>
          </div>
          <div className="feature">
            <span className="feature-icon">📈</span>
            <h4>Visualizations</h4>
            <p>Interactive charts, graphs, and dashboards tailored to your data</p>
          </div>
          <div className="feature">
            <span className="feature-icon">💬</span>
            <h4>Chat Interface</h4>
            <p>Ask questions about your data in natural language</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;