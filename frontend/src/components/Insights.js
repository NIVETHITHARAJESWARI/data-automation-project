import React, { useState, useEffect } from 'react';
import { getInsights, explainInsight } from '../services/api';

const Insights = ({ sessionId }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedInsight, setExpandedInsight] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const response = await getInsights(sessionId);
        if (response.data.success) {
          setInsights(response.data.insights);
        }
      } catch (err) {
        setError('Failed to load insights');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchInsights();
    }
  }, [sessionId]);

  const handleExplainInsight = async (insightId) => {
    try {
      setLoadingExplanation(true);
      const response = await explainInsight(sessionId, { insight_id: insightId });
      if (response.data.success) {
        setExplanation(response.data.explanation);
        setExpandedInsight(insightId);
      }
    } catch (err) {
      setExplanation('Unable to generate explanation for this insight.');
      setExpandedInsight(insightId);
    } finally {
      setLoadingExplanation(false);
    }
  };

  const getImpactIcon = (impact) => {
    const icons = {
      'positive': '✅',
      'negative': '⚠️',
      'attention_needed': '🔍',
      'important': '⭐',
      'informational': 'ℹ️',
      'high': '🔴',
      'medium': '🟡',
      'low': '🟢'
    };
    return icons[impact] || 'ℹ️';
  };

  const renderBasicStatistics = (stats) => {
    return (
      <div className="insight-section">
        <h3>📊 Dataset Overview</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Dataset Size</h4>
            <p><strong>{stats.dataset_overview?.total_rows || 0}</strong> rows</p>
            <p><strong>{stats.dataset_overview?.total_columns || 0}</strong> columns</p>
            <p><strong>{stats.dataset_overview?.memory_usage_mb || 0}</strong> MB</p>
          </div>
          
          <div className="stat-card">
            <h4>Column Types</h4>
            <p><strong>{stats.dataset_overview?.numeric_columns || 0}</strong> numeric</p>
            <p><strong>{stats.dataset_overview?.categorical_columns || 0}</strong> categorical</p>
          </div>
        </div>

        {stats.numeric_summary && Object.keys(stats.numeric_summary).length > 0 && (
          <div className="numeric-summary">
            <h4>Numeric Variables Summary</h4>
            <div className="summary-table">
              <table>
                <thead>
                  <tr>
                    <th>Variable</th>
                    <th>Mean</th>
                    <th>Median</th>
                    <th>Std Dev</th>
                    <th>Skewness</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.numeric_summary).slice(0, 5).map(([col, summary]) => (
                    <tr key={col}>
                      <td><strong>{col}</strong></td>
                      <td>{summary.mean}</td>
                      <td>{summary.median}</td>
                      <td>{summary.std}</td>
                      <td>{summary.skewness}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInsightsList = (insightsList, title, icon) => {
    if (!insightsList || insightsList.length === 0) return null;

    return (
      <div className="insight-section">
        <h3>{icon} {title}</h3>
        <div className="insights-list">
          {insightsList.map((insight, index) => (
            <div key={index} className={`insight-card ${insight.impact || 'informational'}`}>
              <div className="insight-header">
                <span className="impact-icon">{getImpactIcon(insight.impact)}</span>
                <h4>{insight.type?.replace('_', ' ').toUpperCase() || 'INSIGHT'}</h4>
                <button 
                  className="explain-button"
                  onClick={() => handleExplainInsight(insight.type)}
                  disabled={loadingExplanation}
                >
                  {loadingExplanation && expandedInsight === insight.type ? '...' : '?'}
                </button>
              </div>
              
              <p className="insight-message">{insight.message || insight.insight}</p>
              
              {insight.details && (
                <div className="insight-details">
                  {typeof insight.details === 'object' ? (
                    <ul>
                      {Object.entries(insight.details).slice(0, 5).map(([key, value]) => (
                        <li key={key}>
                          <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>{insight.details}</p>
                  )}
                </div>
              )}

              {insight.action && (
                <div className="insight-action">
                  <strong>Recommended Action:</strong> {insight.action}
                </div>
              )}

              {expandedInsight === insight.type && explanation && (
                <div className="insight-explanation">
                  <h5>Detailed Explanation:</h5>
                  <p>{explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCorrelationInsights = (correlations) => {
    if (!correlations || correlations.length === 0) return null;

    return (
      <div className="insight-section">
        <h3>🔗 Correlation Analysis</h3>
        {correlations.map((insight, index) => (
          <div key={index} className="correlation-insight">
            <div className="insight-header">
              <span className="impact-icon">{getImpactIcon(insight.impact)}</span>
              <h4>{insight.message}</h4>
            </div>
            
            {insight.details && Array.isArray(insight.details) && (
              <div className="correlation-list">
                {insight.details.slice(0, 5).map((corr, i) => (
                  <div key={i} className="correlation-item">
                    <span className="variable-pair">{corr.var1} ↔ {corr.var2}</span>
                    <span className={`correlation-strength ${corr.correlation > 0 ? 'positive' : 'negative'}`}>
                      {corr.strength}: {corr.correlation}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderBusinessInsights = (businessInsights) => {
    if (!businessInsights || businessInsights.length === 0) return null;

    return (
      <div className="insight-section business-insights">
        <h3>💼 Business Insights</h3>
        <div className="business-insights-grid">
          {businessInsights.map((insight, index) => (
            <div key={index} className={`business-insight-card impact-${insight.impact}`}>
              <div className="business-insight-header">
                <span className="impact-badge">{insight.impact?.toUpperCase()}</span>
                <span className="impact-icon">{getImpactIcon(insight.impact)}</span>
              </div>
              <p className="business-insight-text">{insight.insight}</p>
              {insight.action && (
                <div className="business-action">
                  <strong>Action:</strong> {insight.action}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRecommendations = (recommendations) => {
    if (!recommendations || recommendations.length === 0) return null;

    return (
      <div className="insight-section recommendations">
        <h3>🎯 Recommendations</h3>
        <div className="recommendations-list">
          {recommendations.map((rec, index) => (
            <div key={index} className={`recommendation-card priority-${rec.priority}`}>
              <div className="recommendation-header">
                <span className="category-tag">{rec.category}</span>
                <span className={`priority-badge priority-${rec.priority}`}>
                  {rec.priority?.toUpperCase()}
                </span>
              </div>
              <p className="recommendation-text">{rec.recommendation}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Analyzing your data...</p>
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

  if (!insights) {
    return (
      <div className="no-data-container">
        <h3>No insights available</h3>
        <p>Unable to generate insights from the current dataset.</p>
      </div>
    );
  }

  return (
    <div className="insights-container">
      <div className="insights-header">
        <h2>💡 Data Insights</h2>
        <p>Discover patterns, relationships, and key findings in your data</p>
      </div>

      {insights.basic_statistics && renderBasicStatistics(insights.basic_statistics)}
      
      {insights.data_quality_insights && renderInsightsList(
        insights.data_quality_insights, 
        'Data Quality Analysis', 
        '🧹'
      )}
      
      {insights.correlation_insights && renderCorrelationInsights(insights.correlation_insights)}
      
      {insights.distribution_insights && renderInsightsList(
        insights.distribution_insights, 
        'Distribution Analysis', 
        '📈'
      )}
      
      {insights.categorical_insights && renderInsightsList(
        insights.categorical_insights, 
        'Categorical Analysis', 
        '🏷️'
      )}
      
      {insights.business_insights && renderBusinessInsights(insights.business_insights)}
      
      {insights.recommendations && renderRecommendations(insights.recommendations)}
    </div>
  );
};

export default Insights;