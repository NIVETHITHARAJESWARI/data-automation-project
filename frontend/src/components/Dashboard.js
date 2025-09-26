import apiService from '../../services/api.js';

class DashboardComponent {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.data = null;
        this.refreshInterval = null;
        
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Dashboard container not found');
            return;
        }

        this.render();
        this.loadData();
    }

    render() {
        this.container.innerHTML = `
            <div class="dashboard-container space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-3xl font-bold text-gray-900">Data Overview Dashboard</h2>
                        <p class="text-gray-600 mt-1">Comprehensive analysis of your dataset's characteristics and quality</p>
                    </div>
                    <button id="refresh-dashboard" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                        <i class="fas fa-sync-alt"></i>
                        <span>Refresh</span>
                    </button>
                </div>

                <!-- Loading State -->
                <div id="dashboard-loading" class="flex justify-center items-center py-12">
                    <div class="text-center">
                        <div class="loading-spinner mb-4"></div>
                        <p class="text-gray-600">Loading dashboard data...</p>
                    </div>
                </div>

                <!-- Dashboard Content -->
                <div id="dashboard-content" class="hidden space-y-6">
                    <!-- Key Metrics Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div id="metric-cards">
                            <!-- Metric cards will be populated here -->
                        </div>
                    </div>

                    <!-- Data Quality Overview -->
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-xl font-semibold text-gray-900">Data Quality Overview</h3>
                            <div id="overall-grade" class="flex items-center">
                                <!-- Grade will be populated here -->
                            </div>
                        </div>
                        <div id="quality-metrics" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <!-- Quality metrics will be populated here -->
                        </div>
                    </div>

                    <!-- Missing Values Analysis -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div class="bg-white rounded-lg shadow-lg p-6">
                            <h3 class="text-xl font-semibold text-gray-900 mb-4">Missing Values Analysis</h3>
                            <div id="missing-values-content">
                                <!-- Missing values analysis will be populated here -->
                            </div>
                        </div>

                        <!-- Data Types Distribution -->
                        <div class="bg-white rounded-lg shadow-lg p-6">
                            <h3 class="text-xl font-semibold text-gray-900 mb-4">Data Types Distribution</h3>
                            <div id="data-types-content">
                                <!-- Data types content will be populated here -->
                            </div>
                        </div>
                    </div>

                    <!-- Column Analysis -->
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <h3 class="text-xl font-semibold text-gray-900 mb-4">Column Analysis</h3>
                        <div id="columns-analysis">
                            <!-- Column analysis will be populated here -->
                        </div>
                    </div>

                    <!-- Sample Data Preview -->
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-xl font-semibold text-gray-900">Data Preview</h3>
                            <button id="view-full-data" class="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                                View Full Dataset →
                            </button>
                        </div>
                        <div id="sample-data-table" class="overflow-x-auto">
                            <!-- Sample data table will be populated here -->
                        </div>
                    </div>

                    <!-- Recommendations -->
                    <div id="recommendations-section" class="hidden bg-white rounded-lg shadow-lg p-6">
                        <h3 class="text-xl font-semibold text-gray-900 mb-4">
                            <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
                            Recommendations
                        </h3>
                        <div id="recommendations-content">
                            <!-- Recommendations will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Error State -->
                <div id="dashboard-error" class="hidden text-center py-12">
                    <div class="text-red-500 mb-4">
                        <i class="fas fa-exclamation-triangle text-4xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h3>
                    <p class="text-gray-600 mb-4">Please ensure you have uploaded and processed a dataset.</p>
                    <button id="retry-dashboard" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">
                        Try Again
                    </button>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const refreshBtn = this.container.querySelector('#refresh-dashboard');
        const retryBtn = this.container.querySelector('#retry-dashboard');
        const viewFullDataBtn = this.container.querySelector('#view-full-data');

        refreshBtn?.addEventListener('click', () => {
            this.refresh();
        });

        retryBtn?.addEventListener('click', () => {
            this.loadData();
        });

        viewFullDataBtn?.addEventListener('click', () => {
            this.showFullDataModal();
        });
    }

    async loadData() {
        this.showLoading();
        
        try {
            // Load all dashboard data
            const [datasetInfo, basicStats, qualityReport, sampleData] = await Promise.all([
                apiService.getDatasetInfo(),
                apiService.getBasicStatistics(), 
                apiService.getDataQualityReport(),
                apiService.getSampleData()
            ]);

            this.data = {
                datasetInfo,
                basicStats,
                qualityReport,
                sampleData
            };

            this.renderDashboard();
            this.showContent();

        } catch (error) {
            console.error('Dashboard loading error:', error);
            this.showError();
        }
    }

    renderDashboard() {
        if (!this.data) return;

        this.renderMetricCards();
        this.renderQualityOverview();
        this.renderMissingValues();
        this.renderDataTypes();
        this.renderColumnAnalysis();
        this.renderSampleData();
        this.renderRecommendations();
    }

    renderMetricCards() {
        const { datasetInfo, basicStats, qualityReport } = this.data;
        const container = this.container.querySelector('#metric-cards');
        
        if (!container) return;

        const metrics = [
            {
                title: 'Total Records',
                value: datasetInfo.shape[0].toLocaleString(),
                icon: 'fas fa-database',
                color: 'bg-blue-500',
                trend: null
            },
            {
                title: 'Features',
                value: datasetInfo.shape[1].toLocaleString(),
                icon: 'fas fa-columns',
                color: 'bg-green-500',
                breakdown: `${basicStats.dataset_overview.numeric_features} numeric, ${basicStats.dataset_overview.categorical_features} categorical`
            },
            {
                title: 'Data Quality',
                value: `${qualityReport.overall_score.completeness.toFixed(1)}%`,
                icon: 'fas fa-check-circle',
                color: this.getQualityColor(qualityReport.overall_score.completeness),
                subtext: 'Completeness Score'
            },
            {
                title: 'Missing Values',
                value: Object.values(datasetInfo.missing_values).reduce((sum, count) => sum + count, 0).toLocaleString(),
                icon: 'fas fa-exclamation-triangle', 
                color: this.getMissingValuesColor(Object.values(datasetInfo.missing_values).reduce((sum, count) => sum + count, 0)),
                percentage: ((Object.values(datasetInfo.missing_values).reduce((sum, count) => sum + count, 0) / (datasetInfo.shape[0] * datasetInfo.shape[1])) * 100).toFixed(2)
            }
        ];

        container.innerHTML = metrics.map(metric => this.createMetricCard(metric)).join('');
    }

    createMetricCard(metric) {
        return `
            <div class="bg-white overflow-hidden shadow-lg rounded-lg card-hover">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="${metric.color} rounded-md p-3">
                                <i class="${metric.icon} text-white text-xl"></i>
                            </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">
                                    ${metric.title}
                                </dt>
                                <dd class="flex items-baseline">
                                    <div class="text-2xl font-semibold text-gray-900">
                                        ${metric.value}
                                    </div>
                                    ${metric.percentage ? `<div class="ml-2 text-sm text-gray-600">(${metric.percentage}%)</div>` : ''}
                                </dd>
                                ${metric.breakdown ? `<div class="text-xs text-gray-500 mt-1">${metric.breakdown}</div>` : ''}
                                ${metric.subtext ? `<div class="text-xs text-gray-500 mt-1">${metric.subtext}</div>` : ''}
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderQualityOverview() {
        const { qualityReport } = this.data;
        const gradeContainer = this.container.querySelector('#overall-grade');
        const metricsContainer = this.container.querySelector('#quality-metrics');

        if (!gradeContainer || !metricsContainer) return;

        // Overall grade
        const grade = this.calculateOverallGrade(qualityReport.overall_score);
        gradeContainer.innerHTML = `
            <div class="flex items-center space-x-2">
                <div class="w-12 h-12 ${this.getGradeColorClass(grade)} rounded-full flex items-center justify-center text-white font-bold text-lg">
                    ${grade}
                </div>
                <div class="text-sm text-gray-600">Overall Grade</div>
            </div>
        `;

        // Quality metrics
        const metrics = [
            {
                name: 'Completeness',
                score: qualityReport.overall_score.completeness,
                description: 'Percentage of non-missing data'
            },
            {
                name: 'Uniqueness', 
                score: qualityReport.overall_score.uniqueness,
                description: 'Percentage of non-duplicate records'
            },
            {
                name: 'Consistency',
                score: qualityReport.overall_score.consistency,
                description: 'Data format and type consistency'
            }
        ];

        metricsContainer.innerHTML = metrics.map(metric => `
            <div class="text-center">
                <div class="relative pt-1">
                    <div class="flex mb-2 items-center justify-between">
                        <div>
                            <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${this.getScoreColorClass(metric.score)}">
                                ${metric.name}
                            </span>
                        </div>
                        <div class="text-right">
                            <span class="text-xs font-semibold inline-block text-gray-600">
                                ${metric.score.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                        <div style="width:${metric.score}%" class="${this.getScoreProgressColor(metric.score)} shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"></div>
                    </div>
                </div>
                <p class="text-xs text-gray-500">${metric.description}</p>
            </div>
        `).join('');
    }

    renderMissingValues() {
        const { datasetInfo } = this.data;
        const container = this.container.querySelector('#missing-values-content');
        if (!container) return;

        const missingValues = datasetInfo.missing_values;
        const totalMissing = Object.values(missingValues).reduce((sum, count) => sum + count, 0);

        if (totalMissing === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-green-500 text-4xl mb-2">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <p class="text-lg font-medium text-green-700">No Missing Values!</p>
                    <p class="text-sm text-gray-600">Your dataset is complete.</p>
                </div>
            `;
            return;
        }

        const missingByColumn = Object.entries(missingValues)
            .filter(([_, count]) => count > 0)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        const totalCells = datasetInfo.shape[0] * datasetInfo.shape[1];
        const missingPercentage = (totalMissing / totalCells) * 100;

        container.innerHTML = `
            <div class="space-y-4">
                <div class="text-center p-4 bg-yellow-50 rounded-lg">
                    <div class="text-2xl font-bold text-yellow-600">${totalMissing.toLocaleString()}</div>
                    <div class="text-sm text-yellow-700">Missing Values (${missingPercentage.toFixed(2)}%)</div>
                </div>
                
                <div class="space-y-2">
                    ${missingByColumn.map(([column, count]) => {
                        const percentage = (count / datasetInfo.shape[0]) * 100;
                        return `
                            <div class="flex items-center justify-between">
                                <span class="text-sm font-medium text-gray-700 truncate max-w-32" title="${column}">${column}</span>
                                <div class="flex items-center space-x-2">
                                    <span class="text-sm text-gray-600">${count.toLocaleString()}</span>
                                    <div class="w-20 bg-gray-200 rounded-full h-2">
                                        <div class="bg-yellow-500 h-2 rounded-full" style="width: ${Math.min(percentage, 100)}%"></div>
                                    </div>
                                    <span class="text-xs text-gray-500 w-12 text-right">${percentage.toFixed(1)}%</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderDataTypes() {
        const { datasetInfo } = this.data;
        const container = this.container.querySelector('#data-types-content');
        if (!container) return;

        const dtypeCounts = {};
        Object.values(datasetInfo.dtypes).forEach(dtype => {
            dtypeCounts[dtype] = (dtypeCounts[dtype] || 0) + 1;
        });

        const typeColors = {
            'object': 'bg-blue-100 text-blue-800',
            'int64': 'bg-green-100 text-green-800',
            'float64': 'bg-purple-100 text-purple-800',
            'bool': 'bg-yellow-100 text-yellow-800',
            'datetime64[ns]': 'bg-indigo-100 text-indigo-800'
        };

        container.innerHTML = `
            <div class="space-y-3">
                ${Object.entries(dtypeCounts).map(([dtype, count]) => `
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div class="flex items-center space-x-3">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full ${typeColors[dtype] || 'bg-gray-100 text-gray-800'}">
                                ${dtype}
                            </span>
                            <span class="text-sm text-gray-600">${this.getDataTypeDescription(dtype)}</span>
                        </div>
                        <span class="text-lg font-semibold text-gray-900">${count}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderColumnAnalysis() {
        const { datasetInfo, basicStats } = this.data;
        const container = this.container.querySelector('#columns-analysis');
        if (!container) return;

        const columns = datasetInfo.columns.slice(0, 10); // Show first 10 columns
        
        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Type</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Missing</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sample Values</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${columns.map(column => {
                            const dtype = datasetInfo.dtypes[column];
                            const missing = datasetInfo.missing_values[column] || 0;
                            const sampleValues = this.getSampleValues(column);
                            
                            return `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${column}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${typeColors[dtype] || 'bg-gray-100 text-gray-800'}">
                                            ${dtype}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${missing > 0 ? `<span class="text-red-600">${missing.toLocaleString()}</span>` : '<span class="text-green-600">0</span>'}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">-</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div class="max-w-xs truncate">${sampleValues}</div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                ${datasetInfo.columns.length > 10 ? `<p class="text-sm text-gray-500 mt-4">Showing 10 of ${datasetInfo.columns.length} columns</p>` : ''}
            </div>
        `;
    }

    renderSampleData() {
        const { sampleData } = this.data;
        const container = this.container.querySelector('#sample-data-table');
        if (!container) return;

        if (!sampleData.sample_rows || sampleData.sample_rows.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">No sample data available.</p>';
            return;
        }

        const headers = sampleData.columns.slice(0, 8); // Show first 8 columns
        const rows = sampleData.sample_rows.slice(0, 5); // Show first 5 rows

        container.innerHTML = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        ${headers.map(header => `
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-32 truncate" title="${header}">
                                ${header}
                            </th>
                        `).join('')}
                        ${sampleData.columns.length > 8 ? '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500">...</th>' : ''}
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${rows.map(row => `
                        <tr class="hover:bg-gray-50">
                            ${headers.map(header => `
                                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 max-w-32 truncate" title="${this.formatCellValue(row[header])}">
                                    ${this.formatCellValue(row[header], true)}
                                </td>
                            `).join('')}
                            ${sampleData.columns.length > 8 ? '<td class="px-4 py-3 text-sm text-gray-400">...</td>' : ''}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="text-sm text-gray-500 mt-4 text-center">
                Showing ${rows.length} of ${sampleData.shape[0].toLocaleString()} rows
                ${sampleData.columns.length > 8 ? ` • ${headers.length} of ${sampleData.columns.length} columns` : ''}
            </div>
        `;
    }

    renderRecommendations() {
        // This would typically come from the insights data
        // For now, we'll generate some basic recommendations based on the dashboard data
        const recommendations = this.generateBasicRecommendations();
        
        if (recommendations.length === 0) return;

        const recommendationsSection = this.container.querySelector('#recommendations-section');
        const recommendationsContent = this.container.querySelector('#recommendations-content');
        
        if (!recommendationsSection || !recommendationsContent) return;

        recommendationsContent.innerHTML = `
            <div class="space-y-4">
                ${recommendations.map(rec => `
                    <div class="flex items-start p-4 bg-${this.getPriorityColor(rec.priority)}-50 border border-${this.getPriorityColor(rec.priority)}-200 rounded-lg">
                        <div class="flex-shrink-0 mr-3">
                            <i class="fas fa-${this.getPriorityIcon(rec.priority)} text-${this.getPriorityColor(rec.priority)}-600 text-lg mt-0.5"></i>
                        </div>
                        <div class="flex-1">
                            <h4 class="text-sm font-medium text-${this.getPriorityColor(rec.priority)}-800 mb-1">
                                ${rec.title}
                            </h4>
                            <p class="text-sm text-${this.getPriorityColor(rec.priority)}-700">
                                ${rec.description}
                            </p>
                            ${rec.action ? `
                                <button class="mt-2 text-xs bg-${this.getPriorityColor(rec.priority)}-600 hover:bg-${this.getPriorityColor(rec.priority)}-700 text-white px-3 py-1 rounded transition-colors">
                                    ${rec.action}
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        recommendationsSection.classList.remove('hidden');
    }

    generateBasicRecommendations() {
        if (!this.data) return [];

        const { datasetInfo, qualityReport } = this.data;
        const recommendations = [];

        // Missing values recommendation
        const totalMissing = Object.values(datasetInfo.missing_values).reduce((sum, count) => sum + count, 0);
        if (totalMissing > 0) {
            const percentage = (totalMissing / (datasetInfo.shape[0] * datasetInfo.shape[1])) * 100;
            recommendations.push({
                title: 'Missing Values Detected',
                description: `Your dataset has ${totalMissing.toLocaleString()} missing values (${percentage.toFixed(2)}%). Consider using imputation techniques or removing incomplete records.`,
                priority: percentage > 10 ? 'high' : 'medium',
                action: 'View Missing Values Analysis'
            });
        }

        // Data quality recommendation
        if (qualityReport.overall_score.completeness < 90) {
            recommendations.push({
                title: 'Data Quality Improvement',
                description: `Your data completeness score is ${qualityReport.overall_score.completeness.toFixed(1)}%. Improving data quality will enhance analysis accuracy.`,
                priority: qualityReport.overall_score.completeness < 70 ? 'high' : 'medium',
                action: 'View Quality Report'
            });
        }

        // Large dataset recommendation
        if (datasetInfo.shape[0] > 100000) {
            recommendations.push({
                title: 'Large Dataset Optimization',
                description: 'Your dataset is quite large. Consider sampling for exploratory analysis or using distributed computing for better performance.',
                priority: 'low',
                action: 'Learn More'
            });
        }

        return recommendations;
    }

    // Utility methods
    getQualityColor(score) {
        if (score >= 90) return 'bg-green-500';
        if (score >= 80) return 'bg-blue-500';
        if (score >= 70) return 'bg-yellow-500';
        if (score >= 60) return 'bg-orange-500';
        return 'bg-red-500';
    }

    getMissingValuesColor(count) {
        if (count === 0) return 'bg-green-500';
        if (count < 100) return 'bg-yellow-500';
        return 'bg-red-500';
    }

    calculateOverallGrade(scores) {
        const average = (scores.completeness + scores.uniqueness + scores.consistency) / 3;
        if (average >= 90) return 'A';
        if (average >= 80) return 'B';
        if (average >= 70) return 'C';
        if (average >= 60) return 'D';
        return 'F';
    }

    getGradeColorClass(grade) {
        const colors = {
            'A': 'bg-green-500',
            'B': 'bg-blue-500', 
            'C': 'bg-yellow-500',
            'D': 'bg-orange-500',
            'F': 'bg-red-500'
        };
        return colors[grade] || 'bg-gray-500';
    }

    getScoreColorClass(score) {
        if (score >= 90) return 'text-green-600 bg-green-100';
        if (score >= 80) return 'text-blue-600 bg-blue-100';
        if (score >= 70) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    }

    getScoreProgressColor(score) {
        if (score >= 90) return 'bg-green-500';
        if (score >= 80) return 'bg-blue-500';
        if (score >= 70) return 'bg-yellow-500';
        return 'bg-red-500';
    }

    getDataTypeDescription(dtype) {
        const descriptions = {
            'object': 'Text/String data',
            'int64': 'Integer numbers',
            'float64': 'Decimal numbers',
            'bool': 'Boolean (True/False)',
            'datetime64[ns]': 'Date and time'
        };
        return descriptions[dtype] || 'Unknown type';
    }

    getSampleValues(column) {
        // This would typically come from the sample data
        // For demo purposes, returning placeholder
        return 'Sample values...';
    }

    formatCellValue(value, truncate = false) {
        if (value === null || value === undefined) {
            return '<span class="text-gray-400 italic">null</span>';
        }
        if (typeof value === 'number') {
            return value.toLocaleString();
        }
        const strValue = String(value);
        if (truncate && strValue.length > 20) {
            return strValue.substring(0, 20) + '...';
        }
        return strValue;
    }

    getPriorityColor(priority) {
        const colors = {
            'high': 'red',
            'medium': 'yellow', 
            'low': 'blue'
        };
        return colors[priority] || 'gray';
    }

    getPriorityIcon(priority) {
        const icons = {
            'high': 'exclamation-triangle',
            'medium': 'exclamation-circle',
            'low': 'info-circle'
        };
        return icons[priority] || 'info-circle';
    }

    // State management methods
    showLoading() {
        this.container.querySelector('#dashboard-loading')?.classList.remove('hidden');
        this.container.querySelector('#dashboard-content')?.classList.add('hidden');
        this.container.querySelector('#dashboard-error')?.classList.add('hidden');
    }

    showContent() {
        this.container.querySelector('#dashboard-loading')?.classList.add('hidden');
        this.container.querySelector('#dashboard-content')?.classList.remove('hidden');
        this.container.querySelector('#dashboard-error')?.classList.add('hidden');
    }

    showError() {
        this.container.querySelector('#dashboard-loading')?.classList.add('hidden');
        this.container.querySelector('#dashboard-content')?.classList.add('hidden');
        this.container.querySelector('#dashboard-error')?.classList.remove('hidden');
    }

    refresh() {
        const refreshBtn = this.container.querySelector('#refresh-dashboard');
        const icon = refreshBtn?.querySelector('i');
        
        if (icon) {
            icon.classList.add('animate-spin');
        }
        
        this.loadData().finally(() => {
            if (icon) {
                icon.classList.remove('animate-spin');
            }
        });
    }

    showFullDataModal() {
        // Create modal for full data view
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
                <div class="flex items-center justify-between p-6 border-b">
                    <h3 class="text-lg font-semibold text-gray-900">Full Dataset View</h3>
                    <button class="text-gray-400 hover:text-gray-600" onclick="this.closest('.fixed').remove()">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="flex-1 overflow-auto p-6">
                    <div class="text-center py-8">
                        <div class="loading-spinner mb-4"></div>
                        <p class="text-gray-600">Loading full dataset...</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Load full sample data
        this.loadFullSampleData(modal);
    }

    async loadFullSampleData(modal) {
        try {
            const sampleData = await apiService.getSampleData();
            const container = modal.querySelector('.overflow-auto');
            
            if (sampleData.sample_rows && sampleData.sample_rows.length > 0) {
                const headers = sampleData.columns;
                const rows = sampleData.sample_rows;

                container.innerHTML = `
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50 sticky top-0">
                                <tr>
                                    ${headers.map(header => `
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            ${header}
                                        </th>
                                    `).join('')}
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${rows.map(row => `
                                    <tr class="hover:bg-gray-50">
                                        ${headers.map(header => `
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                ${this.formatCellValue(row[header])}
                                            </td>
                                        `).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                container.innerHTML = '<p class="text-gray-500 text-center py-8">No data available</p>';
            }
        } catch (error) {
            const container = modal.querySelector('.overflow-auto');
            container.innerHTML = '<p class="text-red-500 text-center py-8">Error loading data</p>';
        }
    }

    // Public methods for external use
    updateData(newData) {
        this.data = newData;
        this.renderDashboard();
    }

    setAutoRefresh(interval = 30000) {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.refreshInterval = setInterval(() => {
            this.refresh();
        }, interval);
    }

    clearAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    destroy() {
        this.clearAutoRefresh();
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardComponent;
} else if (typeof window !== 'undefined') {
    window.DashboardComponent = DashboardComponent;
}

export default DashboardComponent;