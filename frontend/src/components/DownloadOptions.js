import React, { useState, useEffect } from 'react';
import { downloadCleanedData, exportDashboard, getDashboards } from '../services/api';

const DownloadOptions = ({ sessionId }) => {
  const [dashboards, setDashboards] = useState([]);
  const [downloadStatus, setDownloadStatus] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        const response = await getDashboards(sessionId);
        if (response.data.success) {
          setDashboards(response.data.dashboards);
        }
      } catch (err) {
        console.error('Failed to load dashboards:', err);
      }
    };

    if (sessionId) {
      fetchDashboards();
    }
  }, [sessionId]);

  const handleDownloadData = async (format = 'csv') => {
    try {
      setLoading(true);
      setDownloadStatus({ type: 'data', status: 'downloading' });

      const response = await downloadCleanedData(sessionId);
      
      if (response.data.success) {
        setDownloadStatus({ 
          type: 'data', 
          status: 'success',
          message: response.data.message,
          fileInfo: response.data.file_info
        });

        // In a real app, you'd trigger actual file download here
        // For demo, we show success message
        setTimeout(() => {
          setDownloadStatus({});
        }, 3000);

      } else {
        setDownloadStatus({ 
          type: 'data', 
          status: 'error',
          message: 'Failed to prepare download'
        });
      }
    } catch (err) {
      setDownloadStatus({ 
        type: 'data', 
        status: 'error',
        message: err.response?.data?.error || 'Download failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportDashboard = async (dashboardId, format = 'json') => {
    try {
      setLoading(true);
      setDownloadStatus({ type: 'dashboard', status: 'downloading', dashboardId });

      const response = await exportDashboard(sessionId, dashboardId, format);
      
      if (response.data.success) {
        setDownloadStatus({ 
          type: 'dashboard', 
          status: 'success',
          message: response.data.message,
          dashboardId
        });

        // In a real app, trigger download
        setTimeout(() => {
          setDownloadStatus({});
        }, 3000);

      } else {
        setDownloadStatus({ 
          type: 'dashboard', 
          status: 'error',
          message: 'Failed to export dashboard',
          dashboardId
        });
      }
    } catch (err) {
      setDownloadStatus({ 
        type: 'dashboard', 
        status: 'error',
        message: err.response?.data?.error || 'Export failed',
        dashboardId
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      'downloading': '⏳',
      'success': '✅',
      'error': '❌'
    };
    return icons[status] || '';
  };

  return (
    <div className="download-container">
      <div className="download-header">
        <h2>⬇️ Download Options</h2>
        <p>Export your cleaned data and visualizations</p>
      </div>

      {/* Data Downloads */}
      <div className="download-section">
        <h3>📊 Dataset Downloads</h3>
        <div className="download-cards">
          <div className="download-card">
            <div className="card-icon">📋</div>
            <div className="card-content">
              <h4>Cleaned Dataset (CSV)</h4>
              <p>Download your processed and cleaned dataset in CSV format</p>
              <ul>
                <li>✅ Missing values handled</li>
                <li>✅ Duplicates removed</li>
                <li>✅ Data types optimized</li>
                <li>✅ Outliers processed</li>
              </ul>
            </div>
            <div className="card-actions">
              <button
                onClick={() => handleDownloadData('csv')}
                disabled={loading}
                className="download-btn primary"
              >
                {loading && downloadStatus.type === 'data' ? '⏳ Processing...' : '📥 Download CSV'}
              </button>
            </div>
          </div>

          <div className="download-card">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <h4>Cleaned Dataset (Excel)</h4>
              <p>Download your processed dataset in Excel format</p>
              <ul>
                <li>✅ Multiple sheets support</li>
                <li>✅ Formatted data</li>
                <li>✅ Ready for Excel analysis</li>
                <li>✅ Preserves data types</li>
              </ul>
            </div>
            <div className="card-actions">
              <button
                onClick={() => handleDownloadData('xlsx')}
                disabled={loading}
                className="download-btn primary"
              >
                {loading && downloadStatus.type === 'data' ? '⏳ Processing...' : '📥 Download Excel'}
              </button>
            </div>
          </div>
        </div>

        {downloadStatus.type === 'data' && (
          <div className={`status-message ${downloadStatus.status}`}>
            <span className="status-icon">{getStatusIcon(downloadStatus.status)}</span>
            <span className="status-text">{downloadStatus.message}</span>
            {downloadStatus.fileInfo && (
              <div className="file-info">
                <p>📏 {downloadStatus.fileInfo.rows} rows × {downloadStatus.fileInfo.columns} columns</p>
                <p>📦 File size: ~{downloadStatus.fileInfo.size_mb} MB</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dashboard Downloads */}
      <div className="download-section">
        <h3>📈 Dashboard Downloads</h3>
        <div className="dashboard-downloads">
          {dashboards.length > 0 ? (
            <div className="dashboard-grid">
              {dashboards.map((dashboard) => (
                <div key={dashboard.id} className="dashboard-card">
                  <div className="dashboard-header">
                    <h4>{dashboard.name}</h4>
                    <p>{dashboard.description}</p>
                  </div>
                  <div className="dashboard-info">
                    <p><strong>Layout:</strong> {dashboard.layout}</p>
                    <p><strong>Charts:</strong> {dashboard.charts?.length || 0}</p>
                  </div>
                  <div className="dashboard-actions">
                    <button
                      onClick={() => handleExportDashboard(dashboard.id, 'json')}
                      disabled={loading}
                      className="export-btn json"
                    >
                      📄 Export JSON
                    </button>
                    <button
                      onClick={() => handleExportDashboard(dashboard.id, 'html')}
                      disabled={loading}
                      className="export-btn html"
                    >
                      🌐 Export HTML
                    </button>
                  </div>
                  
                  {downloadStatus.type === 'dashboard' && downloadStatus.dashboardId === dashboard.id && (
                    <div className={`status-message ${downloadStatus.status}`}>
                      <span className="status-icon">{getStatusIcon(downloadStatus.status)}</span>
                      <span className="status-text">{downloadStatus.message}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-dashboards">
              <p>No dashboards available for download. Create visualizations first!</p>
            </div>
          )}
        </div>
      </div>

      {/* Report Downloads */}
      <div className="download-section">
        <h3>📑 Analysis Reports</h3>
        <div className="report-cards">
          <div className="report-card">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <h4>Data Analysis Report</h4>
              <p>Comprehensive PDF report with all insights and visualizations</p>
              <ul>
                <li>📋 Data summary and statistics</li>
                <li>💡 Key insights and patterns</li>
                <li>📈 All visualizations included</li>
                <li>🎯 Recommendations and next steps</li>
              </ul>
            </div>
            <div className="card-actions">
              <button
                disabled={true}
                className="download-btn secondary"
                title="Coming soon in next update"
              >
                📥 Generate Report (Coming Soon)
              </button>
            </div>
          </div>

          <div className="report-card">
            <div className="card-icon">📋</div>
            <div className="card-content">
              <h4>Data Cleaning Summary</h4>
              <p>Detailed report of all data preprocessing steps</p>
              <ul>
                <li>🧹 Cleaning operations performed</li>
                <li>📊 Before/after comparisons</li>
                <li>⚠️ Issues found and resolved</li>
                <li>✅ Data quality improvements</li>
              </ul>
            </div>
            <div className="card-actions">
              <button
                disabled={true}
                className="download-btn secondary"
                title="Coming soon in next update"
              >
                📥 Get Summary (Coming Soon)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Download Instructions */}
      <div className="download-instructions">
        <h3>💡 Download Tips</h3>
        <div className="tips-grid">
          <div className="tip-item">
            <h4>📋 CSV Format</h4>
            <p>Best for importing into other analysis tools like R, Python, or Excel</p>
          </div>
          <div className="tip-item">
            <h4>📊 Excel Format</h4>
            <p>Ideal for business users and Microsoft Office workflows</p>
          </div>
          <div className="tip-item">
            <h4>📈 Dashboard Exports</h4>
            <p>JSON for developers, HTML for sharing interactive dashboards</p>
          </div>
          <div className="tip-item">
            <h4>🔄 Re-processing</h4>
            <p>Download cleaned data anytime - your original file is safely processed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadOptions;