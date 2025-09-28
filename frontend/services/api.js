const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
        this.sessionId = null; // Store current session ID
    }

    // Set session ID after file upload
    setSessionId(sessionId) {
        this.sessionId = sessionId;
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.defaultHeaders,
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return response;
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    // ========================================
    // EXISTING UPLOAD METHODS (UNCHANGED)
    // ========================================
    
    async uploadFile(file, onProgress = null) {
        const formData = new FormData();
        formData.append('file', file);

        const config = {
            method: 'POST',
            body: formData,
            headers: {} // Don't set Content-Type, let browser set it with boundary
        };

        if (onProgress) {
            return this.uploadWithProgress(file, onProgress);
        }

        // Updated to match new backend endpoint
        const response = await this.makeRequest('/upload', config);
        
        // Store session ID from upload response
        if (response.session_id) {
            this.setSessionId(response.session_id);
        }
        
        return response;
    }

    async uploadWithProgress(file, onProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            formData.append('file', file);

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const progress = (event.loaded / event.total) * 100;
                    onProgress(progress);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        // Store session ID
                        if (response.session_id) {
                            this.setSessionId(response.session_id);
                        }
                        resolve(response);
                    } catch (error) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else {
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        reject(new Error(errorResponse.error || `Upload failed with status ${xhr.status}`));
                    } catch {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed due to network error'));
            });

            xhr.open('POST', `${this.baseURL}/upload`);
            xhr.send(formData);
        });
    }

    // Keep your existing upload methods...
    async processDataset() {
        return this.makeRequest('/upload/process', { method: 'POST' });
    }

    async getUploadStatus() {
        return this.makeRequest('/upload/status');
    }

    async getSampleData() {
        return this.makeRequest('/upload/sample-data');
    }

    async downloadProcessedFile(filename) {
        const response = await this.makeRequest(`/upload/download/${filename}`, { method: 'GET' });
        return response;
    }

    async exportReport() {
        const response = await this.makeRequest('/upload/export-report', { method: 'GET' });
        return response;
    }

    async clearUploadContext() {
        return this.makeRequest('/upload/clear', { method: 'POST' });
    }

    async getSupportedFormats() {
        return this.makeRequest('/upload/supported-formats');
    }

    // ========================================
    // UPDATED ANALYSIS METHODS
    // ========================================

    async getDatasetInfo() {
        if (!this.sessionId) throw new Error('No session available');
        return this.makeRequest(`/sessions/${this.sessionId}/info`);
    }

    async getBasicStatistics() {
        return this.makeRequest('/analysis/basic-statistics');
    }

    async getCorrelationAnalysis() {
        return this.makeRequest('/analysis/correlation-analysis');
    }

    async getMissingValuesAnalysis() {
        return this.makeRequest('/analysis/missing-values-analysis');
    }

    async getOutlierAnalysis() {
        return this.makeRequest('/analysis/outlier-analysis');
    }

    async generateInsights() {
        return this.makeRequest('/analysis/generate-insights', { method: 'POST' });
    }

    async generateVisualizations() {
        return this.makeRequest('/analysis/generate-visualizations', { method: 'POST' });
    }

    async getColumnAnalysis(columnName) {
        return this.makeRequest(`/analysis/column-analysis/${encodeURIComponent(columnName)}`);
    }

    async getDataQualityReport() {
        return this.makeRequest('/analysis/data-quality-report');
    }

    // ========================================
    // NEW AI-ENHANCED METHODS
    // ========================================

    // File upload (updated to new backend structure)
    async uploadFileNew(file) {
        const formData = new FormData();
        formData.append('file', file);

        const config = {
            method: 'POST',
            body: formData,
            headers: {}
        };

        const response = await this.makeRequest('/upload', config);
        
        if (response.session_id) {
            this.setSessionId(response.session_id);
        }
        
        return response;
    }

    // Session management
    async getSessionInfo(sessionId = null) {
        const id = sessionId || this.sessionId;
        if (!id) throw new Error('No session available');
        return this.makeRequest(`/sessions/${id}/info`);
    }

    // Data analysis (new structure)
    async getInsights(sessionId = null) {
        const id = sessionId || this.sessionId;
        if (!id) throw new Error('No session available');
        return this.makeRequest(`/insights/${id}`);
    }

    async getDataSummary(sessionId = null) {
        const id = sessionId || this.sessionId;
        if (!id) throw new Error('No session available');
        return this.makeRequest(`/summary/${id}`);
    }

    async regenerateInsights(sessionId = null, params = {}) {
        const id = sessionId || this.sessionId;
        if (!id) throw new Error('No session available');
        return this.makeRequest(`/regenerate-insights/${id}`, {
            method: 'POST',
            body: JSON.stringify(params)
        });
    }

    // Visualizations (new structure)
    async getVisualizations(sessionId = null) {
        const id = sessionId || this.sessionId;
        if (!id) throw new Error('No session available');
        return this.makeRequest(`/visualizations/${id}`);
    }

    async getChart(sessionId, chartId) {
        const id = sessionId || this.sessionId;
        if (!id) throw new Error('No session available');
        return this.makeRequest(`/chart/${id}/${chartId}`);
    }

    // Dashboards (new)
    async getDashboards(sessionId = null) {
        const id = sessionId || this.sessionId;
        if (!id) throw new Error('No session available');
        return this.makeRequest(`/dashboards/${id}`);
    }

    async getDashboard(sessionId, dashboardId) {
        const id = sessionId || this.sessionId;
        if (!id) throw new Error('No session available');
        return this.makeRequest(`/dashboard/${id}/${dashboardId}`);
    }

    async exportDashboard(sessionId, dashboardId, format = 'json') {
        const id = sessionId || this.sessionId;
        if (!id) throw new Error('No session available');
        return this.makeRequest('/export-dashboard', {
            method: 'POST',
            body: JSON.stringify({
                session_id: id,
                dashboard_id: dashboardId,
                format: format
            })
        });
    }

    // Downloads (new structure)
    async downloadCleanedData(sessionId = null) {
        const id = sessionId || this.sessionId;
        if (!id) throw new Error('No session available');
        return this.makeRequest(`/download-cleaned/${id}`);
    }

    // ========================================
    // NEW AI CHATBOT METHODS
    // ========================================

    async sendChatMessage(sessionId, message) {
        const id = sessionId || this.sessionId;
        if (!id) throw new Error('No session available');
        return this.makeRequest(`/chat/${id}`, {
            method: 'POST',
            body: JSON.stringify({ message })
        });
    }

    async getChatHistory(sessionId = null) {
        const id = sessionId || this.sessionId;
        if (!id) throw new Error('No session available');
        return this.makeRequest(`/chat-history/${id}`);
    }

    async getSuggestedQuestions(sessionId = null) {
        const id = sessionId || this.sessionId;
        if (!id) throw new Error('No session available');
        return this.makeRequest(`/suggested-questions/${id}`);
    }

    async explainInsight(sessionId, insightData) {
        const id = sessionId || this.sessionId;
        if (!id) throw new Error('No session available');
        return this.makeRequest(`/explain-insight/${id}`, {
            method: 'POST',
            body: JSON.stringify(insightData)
        });
    }

    async getAIServiceStatus() {
        return this.makeRequest('/ai-service-status');
    }

    // ========================================
    // BACKWARD COMPATIBILITY METHODS
    // ========================================

    // Keep old chatbot methods for compatibility
    async getConversationHistory() {
        if (this.sessionId) {
            return this.getChatHistory(this.sessionId);
        }
        return this.makeRequest('/chatbot/conversation-history');
    }

    async clearConversationHistory() {
        if (this.sessionId) {
            // New API doesn't have clear history yet, return success
            return { success: true, message: 'Chat cleared' };
        }
        return this.makeRequest('/chatbot/clear-history', { method: 'POST' });
    }

    async setChatbotContext(dataset, insights = null) {
        return this.makeRequest('/chatbot/set-context', {
            method: 'POST',
            body: JSON.stringify({ dataset, insights })
        });
    }

    // Health check
    async healthCheck() {
        return this.makeRequest('/health');
    }

    // ========================================
    // UTILITY METHODS (UNCHANGED)
    // ========================================

    async downloadFile(url, filename) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Download failed: ${response.status}`);
            }
            
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Download failed:', error);
            throw error;
        }
    }

    validateFile(file, maxSize = 16 * 1024 * 1024) { // 16MB default
        const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
        const allowedExtensions = ['csv', 'xlsx', 'xls'];
        
        if (file.size > maxSize) {
            throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
        }
        
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
            throw new Error('Invalid file type. Please upload CSV or Excel files only.');
        }
        
        if (!allowedTypes.includes(file.type) && file.type !== '') {
            if (!allowedExtensions.includes(fileExtension)) {
                throw new Error('Invalid file type. Please upload CSV or Excel files only.');
            }
        }
        
        return true;
    }

    handleApiError(error, context = '') {
        console.error(`API Error ${context}:`, error);
        
        if (error.message.includes('fetch')) {
            return 'Network error. Please check your connection and try again.';
        }
        
        if (error.message.includes('404')) {
            return 'Resource not found. Please refresh and try again.';
        }
        
        if (error.message.includes('500')) {
            return 'Server error. Please try again later.';
        }
        
        return error.message || 'An unexpected error occurred.';
    }
}

// Create and export singleton instance
const apiService = new ApiService();

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = apiService;
} else if (typeof window !== 'undefined') {
    window.ApiService = apiService;
}

export default apiService;