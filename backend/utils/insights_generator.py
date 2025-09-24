import pandas as pd
import numpy as np
from scipy import stats
from scipy.stats import pearsonr, spearmanr
import openai
from config import Config

class InsightsGenerator:
    def __init__(self):
        if Config.OPENAI_API_KEY:
            openai.api_key = Config.OPENAI_API_KEY
    
    def generate_comprehensive_insights(self, df, original_df=None):
        """Generate comprehensive insights from the dataset"""
        insights = {
            'basic_statistics': self._get_basic_statistics(df),
            'data_quality_insights': self._get_data_quality_insights(df, original_df),
            'correlation_insights': self._get_correlation_insights(df),
            'distribution_insights': self._get_distribution_insights(df),
            'categorical_insights': self._get_categorical_insights(df),
            'business_insights': self._generate_business_insights(df),
            'recommendations': self._generate_recommendations(df)
        }
        
        return insights
    
    def _get_basic_statistics(self, df):
        """Get basic statistical information"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        categorical_cols = df.select_dtypes(include=['object']).columns
        
        basic_stats = {
            'dataset_overview': {
                'total_rows': len(df),
                'total_columns': len(df.columns),
                'numeric_columns': len(numeric_cols),
                'categorical_columns': len(categorical_cols),
                'memory_usage_mb': round(df.memory_usage(deep=True).sum() / 1024**2, 2)
            },
            'numeric_summary': {},
            'categorical_summary': {}
        }
        
        # Numeric columns summary
        if len(numeric_cols) > 0:
            numeric_desc = df[numeric_cols].describe()
            for col in numeric_cols:
                basic_stats['numeric_summary'][col] = {
                    'mean': round(numeric_desc.loc['mean', col], 2),
                    'median': round(df[col].median(), 2),
                    'std': round(numeric_desc.loc['std', col], 2),
                    'min': round(numeric_desc.loc['min', col], 2),
                    'max': round(numeric_desc.loc['max', col], 2),
                    'skewness': round(stats.skew(df[col].dropna()), 2),
                    'kurtosis': round(stats.kurtosis(df[col].dropna()), 2)
                }
        
        # Categorical columns summary
        if len(categorical_cols) > 0:
            for col in categorical_cols:
                unique_values = df[col].nunique()
                most_common = df[col].mode().iloc[0] if len(df[col].mode()) > 0 else 'N/A'
                basic_stats['categorical_summary'][col] = {
                    'unique_values': unique_values,
                    'most_frequent': most_common,
                    'most_frequent_count': int(df[col].value_counts().iloc[0]) if len(df[col].value_counts()) > 0 else 0
                }
        
        return basic_stats
    
    def _get_data_quality_insights(self, df, original_df):
        """Analyze data quality improvements"""
        insights = []
        
        if original_df is not None:
            # Compare original vs cleaned
            orig_missing = original_df.isnull().sum().sum()
            clean_missing = df.isnull().sum().sum()
            
            insights.append({
                'type': 'data_cleaning_impact',
                'message': f'Data cleaning reduced missing values from {orig_missing} to {clean_missing}',
                'impact': 'positive' if clean_missing < orig_missing else 'neutral'
            })
            
            # Shape changes
            if original_df.shape != df.shape:
                insights.append({
                    'type': 'dataset_size_change',
                    'message': f'Dataset shape changed from {original_df.shape} to {df.shape}',
                    'impact': 'informational'
                })
        
        # Current data quality
        missing_by_col = df.isnull().sum()
        cols_with_missing = missing_by_col[missing_by_col > 0]
        
        if len(cols_with_missing) > 0:
            insights.append({
                'type': 'remaining_missing_data',
                'message': f'{len(cols_with_missing)} columns still have missing values',
                'details': cols_with_missing.to_dict(),
                'impact': 'attention_needed'
            })
        else:
            insights.append({
                'type': 'no_missing_data',
                'message': 'Dataset has no missing values - excellent data quality!',
                'impact': 'positive'
            })
        
        return insights
    
    def _get_correlation_insights(self, df):
        """Find interesting correlations in the data"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        insights = []
        
        if len(numeric_cols) < 2:
            return [{'type': 'insufficient_numeric_data', 'message': 'Not enough numeric columns for correlation analysis'}]
        
        # Calculate correlation matrix
        corr_matrix = df[numeric_cols].corr()
        
        # Find strong correlations (> 0.7 or < -0.7)
        strong_correlations = []
        for i in range(len(corr_matrix.columns)):
            for j in range(i+1, len(corr_matrix.columns)):
                corr_val = corr_matrix.iloc[i, j]
                if abs(corr_val) > 0.7:
                    strong_correlations.append({
                        'var1': corr_matrix.columns[i],
                        'var2': corr_matrix.columns[j],
                        'correlation': round(corr_val, 3),
                        'strength': 'Strong Positive' if corr_val > 0 else 'Strong Negative'
                    })
        
        if strong_correlations:
            insights.append({
                'type': 'strong_correlations',
                'message': f'Found {len(strong_correlations)} strong correlations',
                'details': strong_correlations,
                'impact': 'important'
            })
        
        # Find the most and least correlated pairs
        corr_values = []
        for i in range(len(corr_matrix.columns)):
            for j in range(i+1, len(corr_matrix.columns)):
                corr_values.append({
                    'pair': f"{corr_matrix.columns[i]} - {corr_matrix.columns[j]}",
                    'correlation': corr_matrix.iloc[i, j]
                })
        
        if corr_values:
            corr_values.sort(key=lambda x: abs(x['correlation']), reverse=True)
            insights.append({
                'type': 'correlation_ranking',
                'message': 'Top correlated variable pairs',
                'details': corr_values[:5],  # Top 5
                'impact': 'informational'
            })
        
        return insights
    
    def _get_distribution_insights(self, df):
        """Analyze distributions of numeric variables"""
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        insights = []
        
        for col in numeric_cols:
            data = df[col].dropna()
            if len(data) == 0:
                continue
                
            skewness = stats.skew(data)
            kurtosis = stats.kurtosis(data)
            
            # Analyze distribution shape
            if abs(skewness) < 0.5:
                dist_shape = "approximately normal"
            elif skewness > 0.5:
                dist_shape = "right-skewed (positive skew)"
            else:
                dist_shape = "left-skewed (negative skew)"
            
            # Check for outliers using IQR
            Q1 = data.quantile(0.25)
            Q3 = data.quantile(0.75)
            IQR = Q3 - Q1
            outlier_count = ((data < Q1 - 1.5*IQR) | (data > Q3 + 1.5*IQR)).sum()
            
            insights.append({
                'type': 'distribution_analysis',
                'variable': col,
                'message': f'{col} is {dist_shape}',
                'details': {
                    'skewness': round(skewness, 3),
                    'kurtosis': round(kurtosis, 3),
                    'outliers': int(outlier_count),
                    'outlier_percentage': round((outlier_count/len(data))*100, 2)
                },
                'impact': 'informational'
            })
        
        return insights
    
    def _get_categorical_insights(self, df):
        """Analyze categorical variables"""
        categorical_cols = df.select_dtypes(include=['object']).columns
        insights = []
        
        for col in categorical_cols:
            unique_count = df[col].nunique()
            total_count = len(df[col].dropna())
            
            if unique_count == total_count:
                insights.append({
                    'type': 'unique_identifier',
                    'variable': col,
                    'message': f'{col} appears to be a unique identifier (all values unique)',
                    'impact': 'informational'
                })
            elif unique_count / total_count > 0.9:
                insights.append({
                    'type': 'high_cardinality',
                    'variable': col,
                    'message': f'{col} has very high cardinality ({unique_count} unique values)',
                    'impact': 'attention_needed'
                })
            
            # Most common values
            top_values = df[col].value_counts().head(3)
            insights.append({
                'type': 'categorical_distribution',
                'variable': col,
                'message': f'Top values in {col}',
                'details': top_values.to_dict(),
                'impact': 'informational'
            })
        
        return insights
    
    def _generate_business_insights(self, df):
        """Generate business-relevant insights using AI"""
        insights = []
        
        # Prepare data summary for AI
        summary = {
            'columns': df.columns.tolist(),
            'shape': df.shape,
            'sample_data': df.head().to_dict()
        }
        
        # Use OpenAI if available
        if Config.OPENAI_API_KEY:
            try:
                prompt = f"""
                Analyze this dataset and provide 3-5 key business insights:
                
                Dataset Info:
                - Columns: {summary['columns']}
                - Shape: {summary['shape']}
                - Sample Data: {str(summary['sample_data'])[:500]}
                
                Provide actionable business insights in JSON format:
                [{{"insight": "insight description", "impact": "high/medium/low", "action": "recommended action"}}]
                """
                
                response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=500,
                    temperature=0.7
                )
                
                # Parse AI response
                ai_insights = eval(response.choices[0].message.content)
                insights.extend(ai_insights)
                
            except Exception as e:
                insights.append({
                    'insight': 'AI-powered insights unavailable',
                    'impact': 'low',
                    'action': 'Configure OpenAI API key for advanced insights'
                })
        else:
            # Fallback insights without AI
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 0:
                highest_var_col = df[numeric_cols].var().idxmax()
                insights.append({
                    'insight': f'{highest_var_col} shows the highest variability in the dataset',
                    'impact': 'medium',
                    'action': f'Investigate factors affecting {highest_var_col} variation'
                })
        
        return insights
    
    def _generate_recommendations(self, df):
        """Generate actionable recommendations"""
        recommendations = []
        
        # Data quality recommendations
        missing_data = df.isnull().sum().sum()
        if missing_data > 0:
            recommendations.append({
                'category': 'Data Quality',
                'recommendation': 'Consider collecting more complete data for missing values',
                'priority': 'high'
            })
        
        # Analysis recommendations
        numeric_cols = len(df.select_dtypes(include=[np.number]).columns)
        categorical_cols = len(df.select_dtypes(include=['object']).columns)
        
        if numeric_cols > 0 and categorical_cols > 0:
            recommendations.append({
                'category': 'Statistical Analysis',
                'recommendation': 'Perform cross-tabulation analysis between categorical and numeric variables',
                'priority': 'medium'
            })
        
        if numeric_cols >= 2:
            recommendations.append({
                'category': 'Advanced Analytics',
                'recommendation': 'Consider regression analysis to understand variable relationships',
                'priority': 'medium'
            })
        
        # Visualization recommendations
        if len(df) > 1000:
            recommendations.append({
                'category': 'Visualization',
                'recommendation': 'Use sampling for large dataset visualizations to improve performance',
                'priority': 'low'
            })
        
        return recommendations