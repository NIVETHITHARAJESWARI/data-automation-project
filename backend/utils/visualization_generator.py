import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.figure_factory as ff
import json

class VisualizationGenerator:
    def __init__(self):
        self.color_palette = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
                             '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf']
    
    def generate_all_visualizations(self, df):
        """Generate all possible visualizations for the dataset"""
        visualizations = {
            'dashboard_options': self._generate_dashboard_options(df),
            'individual_charts': self._generate_individual_charts(df),
            'correlation_charts': self._generate_correlation_charts(df),
            'distribution_charts': self._generate_distribution_charts(df),
            'categorical_charts': self._generate_categorical_charts(df)
        }
        
        return visualizations
    
    def _generate_dashboard_options(self, df):
        """Generate different dashboard layout options"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        
        dashboards = []
        
        # Dashboard 1: Overview Dashboard
        if len(numeric_cols) >= 2 and len(categorical_cols) >= 1:
            dashboards.append({
                'id': 'overview_dashboard',
                'name': 'Overview Dashboard',
                'description': 'Comprehensive overview with key metrics and distributions',
                'layout': 'grid',
                'charts': [
                    {'type': 'metrics_cards', 'data': self._create_metrics_cards(df)},
                    {'type': 'correlation_heatmap', 'data': self._create_correlation_heatmap(df)},
                    {'type': 'distribution_histogram', 'data': self._create_distribution_charts(df)},
                    {'type': 'categorical_bar', 'data': self._create_categorical_charts(df)}
                ]
            })
        
        # Dashboard 2: Statistical Dashboard
        if len(numeric_cols) >= 2:
            dashboards.append({
                'id': 'statistical_dashboard',
                'name': 'Statistical Analysis Dashboard',
                'description': 'Focus on statistical relationships and patterns',
                'layout': 'grid',
                'charts': [
                    {'type': 'scatter_matrix', 'data': self._create_scatter_matrix(df)},
                    {'type': 'box_plots', 'data': self._create_box_plots(df)},
                    {'type': 'violin_plots', 'data': self._create_violin_plots(df)}
                ]
            })
        
        # Dashboard 3: Business Dashboard
        dashboards.append({
            'id': 'business_dashboard',
            'name': 'Business Intelligence Dashboard',
            'description': 'Business-focused metrics and KPIs',
            'layout': 'executive',
            'charts': [
                {'type': 'kpi_cards', 'data': self._create_kpi_cards(df)},
                {'type': 'trend_analysis', 'data': self._create_trend_charts(df)},
                {'type': 'comparison_charts', 'data': self._create_comparison_charts(df)}
            ]
        })
        
        return dashboards
    
    def _generate_individual_charts(self, df):
        """Generate individual chart options"""
        charts = []
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        
        # Line charts for time series or trends
        for col in numeric_cols:
            if df[col].nunique() > 5:  # Enough variation for a meaningful chart
                fig = px.line(df.reset_index(), x=df.index, y=col, 
                             title=f'Trend Analysis: {col}')
                charts.append({
                    'id': f'line_{col}',
                    'type': 'line',
                    'title': f'Trend: {col}',
                    'data': fig.to_json()
                })
        
        # Bar charts for categorical data
        for col in categorical_cols:
            if df[col].nunique() <= 20:  # Not too many categories
                value_counts = df[col].value_counts().head(10)
                fig = px.bar(x=value_counts.index, y=value_counts.values,
                           title=f'Distribution: {col}')
                charts.append({
                    'id': f'bar_{col}',
                    'type': 'bar',
                    'title': f'Distribution: {col}',
                    'data': fig.to_json()
                })
        
        # Histograms for numeric data
        for col in numeric_cols:
            fig = px.histogram(df, x=col, title=f'Distribution: {col}')
            charts.append({
                'id': f'hist_{col}',
                'type': 'histogram',
                'title': f'Distribution: {col}',
                'data': fig.to_json()
            })
        
        return charts
    
    def _generate_correlation_charts(self, df):
        """Generate correlation visualizations"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        charts = []
        
        if len(numeric_cols) < 2:
            return charts
        
        # Correlation heatmap
        corr_matrix = df[numeric_cols].corr()
        fig = px.imshow(corr_matrix, 
                       title='Correlation Heatmap',
                       color_continuous_scale='RdBu_r',
                       aspect='auto')
        charts.append({
            'id': 'correlation_heatmap',
            'type': 'heatmap',
            'title': 'Correlation Heatmap',
            'data': fig.to_json()
        })
        
        # Scatter plots for strong correlations
        for i, col1 in enumerate(numeric_cols):
            for col2 in numeric_cols[i+1:]:
                corr = df[col1].corr(df[col2])
                if abs(corr) > 0.5:  # Only strong correlations
                    fig = px.scatter(df, x=col1, y=col2, 
                                   title=f'Correlation: {col1} vs {col2} (r={corr:.3f})')
                    charts.append({
                        'id': f'scatter_{col1}_{col2}',
                        'type': 'scatter',
                        'title': f'{col1} vs {col2}',
                        'data': fig.to_json()
                    })
        
        return charts
    
    def _generate_distribution_charts(self, df):
        """Generate distribution analysis charts"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        charts = []
        
        # Box plots
        if len(numeric_cols) > 0:
            fig = go.Figure()
            for col in numeric_cols[:6]:  # Limit to 6 columns for readability
                fig.add_trace(go.Box(y=df[col], name=col))
            fig.update_layout(title='Distribution Comparison (Box Plots)')
            charts.append({
                'id': 'box_plots_comparison',
                'type': 'box',
                'title': 'Distribution Comparison',
                'data': fig.to_json()
            })
        
        # Individual distribution charts
        for col in numeric_cols:
            # Histogram with density curve
            fig = px.histogram(df, x=col, marginal='box', 
                             title=f'Distribution Analysis: {col}')
            charts.append({
                'id': f'dist_{col}',
                'type': 'distribution',
                'title': f'Distribution: {col}',
                'data': fig.to_json()
            })
        
        return charts
    
    def _generate_categorical_charts(self, df):
        """Generate categorical data visualizations"""
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        charts = []
        
        # Simple categorical distributions
        for col in categorical_cols:
            if df[col].nunique() <= 20:
                value_counts = df[col].value_counts().head(15)
                fig = px.pie(values=value_counts.values, names=value_counts.index,
                           title=f'Distribution: {col}')
                charts.append({
                    'id': f'pie_{col}',
                    'type': 'pie',
                    'title': f'Distribution: {col}',
                    'data': fig.to_json()
                })
        
        # Categorical vs Numeric analysis
        for cat_col in categorical_cols:
            for num_col in numeric_cols:
                if df[cat_col].nunique() <= 10:  # Reasonable number of categories
                    fig = px.box(df, x=cat_col, y=num_col,
                               title=f'{num_col} by {cat_col}')
                    charts.append({
                        'id': f'catbox_{cat_col}_{num_col}',
                        'type': 'categorical_box',
                        'title': f'{num_col} by {cat_col}',
                        'data': fig.to_json()
                    })
        
        return charts
    
    def _create_metrics_cards(self, df):
        """Create metrics cards for dashboard"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        metrics = []
        
        # Basic metrics
        metrics.append({
            'title': 'Total Records',
            'value': len(df),
            'icon': 'database'
        })
        
        metrics.append({
            'title': 'Total Columns',
            'value': len(df.columns),
            'icon': 'columns'
        })
        
        if len(numeric_cols) > 0:
            # Find column with highest mean
            highest_avg_col = df[numeric_cols].mean().idxmax()
            highest_avg_val = df[numeric_cols].mean().max()
            
            metrics.append({
                'title': f'Highest Avg ({highest_avg_col})',
                'value': round(highest_avg_val, 2),
                'icon': 'trending-up'
            })
        
        return metrics
    
    def _create_correlation_heatmap(self, df):
        """Create correlation heatmap"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) < 2:
            return None
            
        corr_matrix = df[numeric_cols].corr()
        fig = px.imshow(corr_matrix, 
                       title='Variable Correlations',
                       color_continuous_scale='RdBu_r')
        return fig.to_json()
    
    def _create_distribution_charts(self, df):
        """Create distribution charts"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if not numeric_cols:
            return None
            
        # Create subplots for multiple distributions
        fig = make_subplots(rows=1, cols=min(3, len(numeric_cols)),
                           subplot_titles=numeric_cols[:3])
        
        for i, col in enumerate(numeric_cols[:3]):
            fig.add_trace(
                go.Histogram(x=df[col], name=col, showlegend=False),
                row=1, col=i+1
            )
        
        fig.update_layout(title='Variable Distributions')
        return fig.to_json()
    
    def _create_categorical_charts(self, df):
        """Create categorical charts"""
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        if not categorical_cols:
            return None
            
        # Take first categorical column with reasonable number of categories
        for col in categorical_cols:
            if 2 <= df[col].nunique() <= 10:
                value_counts = df[col].value_counts()
                fig = px.bar(x=value_counts.index, y=value_counts.values,
                           title=f'Distribution: {col}')
                return fig.to_json()
        
        return None
    
    def _create_scatter_matrix(self, df):
        """Create scatter matrix for numeric variables"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if len(numeric_cols) < 2:
            return None
            
        # Limit to first 5 columns for performance
        cols_to_use = numeric_cols[:5]
        fig = px.scatter_matrix(df[cols_to_use], title='Variable Relationships')
        return fig.to_json()
    
    def _create_box_plots(self, df):
        """Create box plots for all numeric variables"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if not numeric_cols:
            return None
            
        fig = go.Figure()
        for col in numeric_cols[:6]:  # Limit for readability
            fig.add_trace(go.Box(y=df[col], name=col))
        
        fig.update_layout(title='Distribution Analysis (Box Plots)')
        return fig.to_json()
    
    def _create_violin_plots(self, df):
        """Create violin plots for distribution analysis"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if not numeric_cols:
            return None
            
        fig = go.Figure()
        for col in numeric_cols[:4]:  # Limit for performance
            fig.add_trace(go.Violin(y=df[col], name=col))
        
        fig.update_layout(title='Distribution Shapes (Violin Plots)')
        return fig.to_json()
    
    def _create_kpi_cards(self, df):
        """Create KPI cards for business dashboard"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        kpis = []
        
        for col in numeric_cols[:4]:  # Limit to 4 KPIs
            kpis.append({
                'title': f'Total {col}',
                'value': round(df[col].sum(), 2),
                'change': '+5.2%',  # This would be calculated from historical data
                'trend': 'up'
            })
        
        return kpis
    
    def _create_trend_charts(self, df):
        """Create trend analysis charts"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if not numeric_cols:
            return None
            
        # Use first numeric column for trend
        col = numeric_cols[0]
        fig = px.line(df.reset_index(), x=df.index, y=col,
                     title=f'Trend Analysis: {col}')
        return fig.to_json()
    
    def _create_comparison_charts(self, df):
        """Create comparison charts"""
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        if not categorical_cols or not numeric_cols:
            return None
            
        # Create grouped bar chart
        cat_col = categorical_cols[0]
        num_col = numeric_cols[0]
        
        if df[cat_col].nunique() <= 10:
            grouped_data = df.groupby(cat_col)[num_col].mean().reset_index()
            fig = px.bar(grouped_data, x=cat_col, y=num_col,
                        title=f'Average {num_col} by {cat_col}')
            return fig.to_json()
        
        return None