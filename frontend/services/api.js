const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
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

    // Upload endpoints
    async uploadFile(file, onProgress = null) {
        const formData = new FormData();
        formData.append('file', file);

        const config = {
            method: 'POST',
            body: formData,
            headers: {} // Don't set Content-Type, let browser set it with boundary
        };

        if (onProgress) {
            // Note: Progress tracking would require XMLHttpRequest for upload progress
            // This is a simplified version
            return this.uploadWithProgress(file, onProgress);
        }

        return this.makeRequest('/upload/file', config);
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

            xhr.open('POST', `${this.baseURL}/upload/file`);
            xhr.send(formData);
        });
    }

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
        return response; // This will be a Response object for file download
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

    // Analysis endpoints
    async getDatasetInfo() {
        return this.makeRequest('/analysis/dataset-info');
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

    // Chatbot endpoints
    async sendChatMessage(message) {
        return this.makeRequest('/chatbot/chat', {
            method: 'POST',
            body: JSON.stringify({ message })
        });
    }

    async getConversationHistory() {
        return this.makeRequest('/chatbot/conversation-history');
    }

    async clearConversationHistory() {
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

    // Utility methods
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

    // File validation
    validateFile(file, maxSize = 16 * 1024 * 1024) { // 16MB default
        const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
        const allowedExtensions = ['csv', 'xlsx', 'xls'];
        
        // Check file size
        if (file.size > maxSize) {
            throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
        }
        
        // Check file type
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
            throw new Error('Invalid file type. Please upload CSV or Excel files only.');
        }
        
        if (!allowedTypes.includes(file.type) && file.type !== '') {
            // Some browsers might not set the MIME type correctly, so we also check extension
            if (!allowedExtensions.includes(fileExtension)) {
                throw new Error('Invalid file type. Please upload CSV or Excel files only.');
            }
        }
        
        return true;
    }

    // Error handling helper
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