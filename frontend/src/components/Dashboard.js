import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { getDashboards, getDashboard } from '../services/api';

const Dashboard = ({ sessionId, dataSummary }) => {
  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        setLoading(true);
        const response = await getDashboards(sessionId);
        if (response.data.success) {
          setDashboards(response.data.dashboards);
          if (response.data.dashboards.length > 0) {
            setSelectedDashboard(response.data.dashboards[0].id);
          }
        }
      } catch (err) {
        setError('Failed to load dashboards');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchDashboards();
    }
  }, [sessionId]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!selectedDashboard) return;

      try {
        const response = await getDashboard(sessionId, selectedDashboard);
        if (response.data.success) {
          setDashboardData(response.data.dashboard);
        }
      } catch (err) {
        setError('Failed to load dashboard data');
      }
    };

    if (selectedDashboard) {
      fetchDashboardData();
    }
  }, [sessionId, selectedDashboard]);

  const renderMetricCards = (metrics) => {
    return (
      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <div className="metric-icon">{getIconForMetric(metric.icon)}</div>
            <div className="metric-content">
              <h3>{metric.value}</h3>
              <p>{metric.title}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getIconForMetric = (iconName) => {
    const icons = {
      'database': '🗃️',
      'columns': '📊',
      'trending-up': '📈',
      'users': '👥',
      'default': '📋'
    };
    return icons[iconName] || icons.default;
  };

  const renderPlotlyChart = (chartData) => {
    try {
      const plotData = JSON.parse(chartData);
      return (
        <Plot
          data={plotData.data}
          layout={{
            ...plotData.layout,
            autosize: true,
            margin: { l: 50, r: 50, t: 50, b: 50 }
          }}
          style={{ width: '100%', height: '400px' }}
          useResizeHandler={true}
        />
      );
    } catch (err) {
      return <div className="chart-error">Error loading chart</div>;
    }
  };

  const renderChart = (chart) => {
    return (
      <div key={chart.type} className="chart-container">
        <h4>{chart.type.replace('_', ' ').toUpperCase()}</h4>
        {chart.type === 'metrics_cards' && renderMetricCards(chart.data)}
        {chart.type !== 'metrics_cards' && chart.data && renderPlotlyChart(chart.data)}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>📊 Dashboard</h2>
        <div className="dashboard-selector">
          <label>Choose Dashboard: </label>
          <select 
            value={selectedDashboard || ''} 
            onChange={(e) => setSelectedDashboard(e.target.value)}
          >
            {dashboards.map((dashboard) => (
              <option key={dashboard.id} value={dashboard.id}>
                {dashboard.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {dashboardData && (
        <>
          <div className="dashboard-info">
            <h3>{dashboardData.name}</h3>
            <p>{dashboardData.description}</p>
          </div>

          <div className={`dashboard-layout ${dashboardData.layout}`}>
            {dashboardData.charts.map((chart, index) => renderChart(chart))}
          </div>
        </>
      )}

      {dataSummary && (
        <div className="data-overview-section">
          <h3>📋 Data Overview</h3>
          <div className="overview-grid">
            <div className="overview-card">
              <h4>File Information</h4>
              <p><strong>Name:</strong> {dataSummary.file_info?.filename}</p>
              <p><strong>Type:</strong> {dataSummary.file_info?.file_type?.toUpperCase()}</p>
              <p><strong>Size:</strong> {dataSummary.file_info?.file_size_mb} MB</p>
            </div>
            
            <div className="overview-card">
              <h4>Data Quality</h4>
              <p><strong>Original:</strong> {dataSummary.data_overview?.original_shape?.[0]} rows × {dataSummary.data_overview?.original_shape?.[1]} cols</p>
              <p><strong>Cleaned:</strong> {dataSummary.data_overview?.cleaned_shape?.[0]} rows × {dataSummary.data_overview?.cleaned_shape?.[1]} cols</p>
              <p><strong>Cleaning Steps:</strong> {dataSummary.cleaning_summary?.cleaning_steps?.length || 0}</p>
            </div>

            <div className="overview-card">
              <h4>Data Types</h4>
              {Object.entries(dataSummary.data_overview?.data_types || {}).slice(0, 5).map(([col, type]) => (
                <p key={col}><strong>{col}:</strong> {type}</p>
              ))}
              {Object.keys(dataSummary.data_overview?.data_types || {}).length > 5 && (
                <p>... and {Object.keys(dataSummary.data_overview.data_types).length - 5} more</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;