import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import Visualizations from './components/Visualizations';
import Insights from './components/Insights';
import Chatbot from './components/Chatbot';
import DownloadOptions from './components/DownloadOptions';
import './styles/App.css';

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [currentView, setCurrentView] = useState('upload');
  const [dataSummary, setDataSummary] = useState(null);

  const handleFileUpload = (uploadData) => {
    setSessionId(uploadData.session_id);
    setDataSummary(uploadData.summary);
    setDataLoaded(true);
    setCurrentView('dashboard');
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const resetApp = () => {
    setSessionId(null);
    setDataLoaded(false);
    setCurrentView('upload');
    setDataSummary(null);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🔍 Data Analyst Automation Tool</h1>
        <p>Upload, Clean, Analyze, and Visualize your data automatically</p>
      </header>

      {!dataLoaded ? (
        <div className="upload-section">
          <FileUpload onUploadSuccess={handleFileUpload} />
        </div>
      ) : (
        <div className="main-app">
          <nav className="app-navigation">
            <button 
              className={currentView === 'dashboard' ? 'active' : ''}
              onClick={() => handleViewChange('dashboard')}
            >
              📊 Dashboard
            </button>
            <button 
              className={currentView === 'insights' ? 'active' : ''}
              onClick={() => handleViewChange('insights')}
            >
              💡 Insights
            </button>
            <button 
              className={currentView === 'visualizations' ? 'active' : ''}
              onClick={() => handleViewChange('visualizations')}
            >
              📈 Visualizations
            </button>
            <button 
              className={currentView === 'chat' ? 'active' : ''}
              onClick={() => handleViewChange('chat')}
            >
              💬 Chat with Data
            </button>
            <button 
              className={currentView === 'download' ? 'active' : ''}
              onClick={() => handleViewChange('download')}
            >
              ⬇️ Downloads
            </button>
            <button className="reset-button" onClick={resetApp}>
              🔄 New Dataset
            </button>
          </nav>

          <main className="app-content">
            {dataSummary && (
              <div className="data-info-bar">
                <span>📋 {dataSummary.file_info?.filename}</span>
                <span>📏 {dataSummary.data_overview?.cleaned_shape?.[0]} rows × {dataSummary.data_overview?.cleaned_shape?.[1]} columns</span>
                <span>🧹 Data cleaned and processed</span>
              </div>
            )}

            {currentView === 'dashboard' && (
              <Dashboard sessionId={sessionId} dataSummary={dataSummary} />
            )}

            {currentView === 'insights' && (
              <Insights sessionId={sessionId} />
            )}

            {currentView === 'visualizations' && (
              <Visualizations sessionId={sessionId} />
            )}

            {currentView === 'chat' && (
              <Chatbot sessionId={sessionId} />
            )}

            {currentView === 'download' && (
              <DownloadOptions sessionId={sessionId} />
            )}
          </main>
        </div>
      )}

      <footer className="app-footer">
        <p>Built with React & Flask | Automated Data Analysis Tool</p>
      </footer>
    </div>
  );
}

export default App;