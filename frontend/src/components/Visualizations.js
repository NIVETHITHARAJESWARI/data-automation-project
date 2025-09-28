import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { getVisualizations, getChart } from '../services/api';

const Visualizations = ({ sessionId }) => {
  const [visualizations, setVisualizations] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('individual_charts');
  const [selectedChart, setSelectedChart] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVisualizations = async () => {
      try {
        setLoading(true);
        const response = await getVisualizations(sessionId);
        if (response.data.success) {
          setVisualizations(response.data.visualizations);
          // Auto-select first available chart
          const firstCategory = Object.keys(response.data.visualizations)[0];
          if (firstCategory && response.data.visualizations[firstCategory].length > 0) {
            setSelectedCategory(firstCategory);
            setSelectedChart(response.data.visualizations[firstCategory][0].id);
          }
        }
      } catch (err) {
        setError('Failed to load visualizations');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchVisualizations();
    }
  }, [sessionId]);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!selectedChart) return;

      try {
        const response = await getChart(sessionId, selectedChart);
        if (response.data.success) {
          setChartData(response.data.chart);
        }
      } catch (err) {
        console.error('Failed to load chart data:', err);
      }
    };

    if (selectedChart) {
      fetchChartData();
    }
  }, [sessionId, selectedChart]);

  const renderPlotlyChart = (data) => {
    try {
      const plotData = JSON.parse(data);
      return (
        <Plot
          data={plotData.data}
          layout={{
            ...plotData.layout,
            autosize: true,
            margin: { l: 50, r: 50, t: 50, b: 50 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)'
          }}
          style={{ width: '100%', height: '500px' }}
          useResizeHandler={true}
          config={{
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d']
          }}
        />
      );
    } catch (err) {
      return (
        <div className="chart-error">
          <h4>Error loading chart</h4>
          <p>Unable to render visualization data</p>
        </div>
      );
    }
  };

  const getCategoryName = (category) => {
    const names = {
      'individual_charts': '📊 Individual Charts',
      'correlation_charts': '🔗 Correlation Analysis',
      'distribution_charts': '📈 Distribution Analysis',
      'categorical_charts': '🏷️ Categorical Analysis',
      'dashboard_options': '📋 Dashboard Options'
    };
    return names[category] || category.replace('_', ' ').toUpperCase();
  };

  const getChartIcon = (chartType) => {
    const icons = {
      'line': '📈',
      'bar': '📊',
      'histogram': '📉',
      'scatter': '🔵',
      'heatmap': '🔥',
      'box': '📦',
      'pie': '🥧',
      'violin': '🎻',
      'distribution': '📊'
    };
    return icons[chartType] || '📊';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading visualizations...</p>
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

  if (!visualizations) {
    return (
      <div className="no-data-container">
        <h3>No visualizations available</h3>
        <p>Unable to generate charts from the current dataset.</p>
      </div>
    );
  }

  const currentCharts = visualizations[selectedCategory] || [];

  return (
    <div className="visualizations-container">
      <div className="visualizations-header">
        <h2>📈 Visualizations</h2>
        <p>Explore your data through interactive charts and graphs</p>
      </div>

      <div className="visualizations-layout">
        {/* Category Selector */}
        <div className="category-sidebar">
          <h3>Chart Categories</h3>
          <div className="category-list">
            {Object.keys(visualizations).map((category) => {
              const charts = visualizations[category];
              const count = Array.isArray(charts) ? charts.length : 0;
              
              return (
                <button
                  key={category}
                  className={`category-button ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(category);
                    if (charts.length > 0) {
                      setSelectedChart(charts[0].id);
                    }
                  }}
                  disabled={count === 0}
                >
                  <span className="category-name">{getCategoryName(category)}</span>
                  <span className="category-count">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart Selector and Display */}
        <div className="charts-main">
          {currentCharts.length > 0 ? (
            <>
              {/* Chart Selector */}
              <div className="chart-selector">
                <h3>Available Charts</h3>
                <div className="chart-buttons">
                  {currentCharts.map((chart) => (
                    <button
                      key={chart.id}
                      className={`chart-button ${selectedChart === chart.id ? 'active' : ''}`}
                      onClick={() => setSelectedChart(chart.id)}
                    >
                      <span className="chart-icon">{getChartIcon(chart.type)}</span>
                      <span className="chart-title">{chart.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Display */}
              <div className="chart-display">
                {chartData ? (
                  <div className="chart-container">
                    <div className="chart-header">
                      <h3>{chartData.title}</h3>
                      <div className="chart-actions">
                        <button 
                          className="download-btn"
                          onClick={() => {
                            // Download chart as image
                            const plotElement = document.querySelector('.js-plotly-plot');
                            if (plotElement) {
                              window.Plotly.downloadImage(plotElement, {
                                format: 'png',
                                width: 1200,
                                height: 800,
                                filename: `chart_${chartData.id}`
                              });
                            }
                          }}
                        >
                          📥 Download PNG
                        </button>
                      </div>
                    </div>
                    
                    <div className="chart-content">
                      {chartData.data && renderPlotlyChart(chartData.data)}
                    </div>
                    
                    <div className="chart-info">
                      <p><strong>Type:</strong> {chartData.type}</p>
                      <p><strong>Category:</strong> {getCategoryName(selectedCategory)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="chart-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading chart...</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-charts">
              <h3>No charts available in this category</h3>
              <p>Try selecting a different category or check if your data supports this type of visualization.</p>
            </div>
          )}
        </div>
      </div>

      {/* Visualization Tips */}
      <div className="visualization-tips">
        <h3>💡 Visualization Tips</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <h4>📊 Individual Charts</h4>
            <p>Explore single variables with histograms, bar charts, and line plots</p>
          </div>
          <div className="tip-card">
            <h4>🔗 Correlations</h4>
            <p>Discover relationships between variables with scatter plots and heatmaps</p>
          </div>
          <div className="tip-card">
            <h4>📈 Distributions</h4>
            <p>Understand data spread with box plots, violin plots, and density curves</p>
          </div>
          <div className="tip-card">
            <h4>🏷️ Categories</h4>
            <p>Analyze categorical data with pie charts and grouped comparisons</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Visualizations;