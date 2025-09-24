import pandas as pd
import numpy as np
import os
from datetime import datetime
from utils.data_cleaner import DataCleaner
from utils.insights_generator import InsightsGenerator
from utils.visualization_generator import VisualizationGenerator

class DataProcessor:
    def __init__(self):
        self.original_df = None
        self.cleaned_df = None
        self.file_info = {}
        self.cleaning_summary = {}
        self.insights = {}
        self.visualizations = {}
        
        # Initialize utility classes
        self.cleaner = DataCleaner()
        self.insights_generator = InsightsGenerator()
        self.viz_generator = VisualizationGenerator()
    
    def load_file(self, file_path, filename):
        """Load CSV or Excel file"""
        try:
            # Determine file type
            file_extension = filename.lower().split('.')[-1]
            
            if file_extension == 'csv':
                # Try different encodings for CSV
                encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
                for encoding in encodings:
                    try:
                        self.original_df = pd.read_csv(file_path, encoding=encoding)
                        break
                    except UnicodeDecodeError:
                        continue
                else:
                    raise Exception("Could not read CSV file with any encoding")
                    
            elif file_extension in ['xlsx', 'xls']:
                self.original_df = pd.read_excel(file_path)
            else:
                raise Exception(f"Unsupported file format: {file_extension}")
            
            # Store file information
            self.file_info = {
                'filename': filename,
                'file_type': file_extension,
                'upload_time': datetime.now().isoformat(),
                'original_shape': self.original_df.shape,
                'original_columns': self.original_df.columns.tolist(),
                'file_size_mb': round(os.path.getsize(file_path) / 1024**2, 2)
            }
            
            return True, "File loaded successfully"
            
        except Exception as e:
            return False, f"Error loading file: {str(e)}"
    
    def process_data(self):
        """Complete data processing pipeline"""
        if self.original_df is None:
            return False, "No data loaded"
        
        try:
            # Step 1: Clean the data
            self.cleaned_df = self.cleaner.clean_dataset(self.original_df.copy())
            self.cleaning_summary = self.cleaner.get_cleaning_summary()
            
            # Step 2: Generate insights
            self.insights = self.insights_generator.generate_comprehensive_insights(
                self.cleaned_df, self.original_df
            )
            
            # Step 3: Generate visualizations
            self.visualizations = self.viz_generator.generate_all_visualizations(
                self.cleaned_df
            )
            
            return True, "Data processed successfully"
            
        except Exception as e:
            return False, f"Error processing data: {str(e)}"
    
    def get_data_summary(self):
        """Get comprehensive data summary"""
        if self.cleaned_df is None:
            return None
            
        summary = {
            'file_info': self.file_info,
            'data_overview': {
                'original_shape': self.original_df.shape if self.original_df is not None else None,
                'cleaned_shape': self.cleaned_df.shape,
                'columns': self.cleaned_df.columns.tolist(),
                'data_types': self.cleaned_df.dtypes.astype(str).to_dict(),
                'missing_values': self.cleaned_df.isnull().sum().to_dict(),
                'sample_data': self.cleaned_df.head().to_dict('records')
            },
            'cleaning_summary': self.cleaning_summary,
            'insights': self.insights,
            'visualizations': self.visualizations
        }
        
        return summary
    
    def get_column_info(self):
        """Get detailed column information"""
        if self.cleaned_df is None:
            return None
            
        column_info = {}
        
        for col in self.cleaned_df.columns:
            col_data = self.cleaned_df[col]
            info = {
                'name': col,
                'type': str(col_data.dtype),
                'non_null_count': int(col_data.count()),
                'null_count': int(col_data.isnull().sum()),
                'unique_count': int(col_data.nunique()),
                'memory_usage': int(col_data.memory_usage(deep=True))
            }
            
            # Add type-specific information
            if col_data.dtype in ['int64', 'float64']:
                info.update({
                    'min': float(col_data.min()) if not col_data.isnull().all() else None,
                    'max': float(col_data.max()) if not col_data.isnull().all() else None,
                    'mean': float(col_data.mean()) if not col_data.isnull().all() else None,
                    'std': float(col_data.std()) if not col_data.isnull().all() else None,
                    'median': float(col_data.median()) if not col_data.isnull().all() else None
                })
            elif col_data.dtype == 'object':
                info.update({
                    'top_values': col_data.value_counts().head(5).to_dict(),
                    'avg_length': float(col_data.astype(str).str.len().mean()) if not col_data.isnull().all() else None
                })
            
            column_info[col] = info
        
        return column_info
    
    def export_cleaned_data(self, output_path, format='csv'):
        """Export cleaned data to file"""
        if self.cleaned_df is None:
            return False, "No cleaned data available"
        
        try:
            if format.lower() == 'csv':
                self.cleaned_df.to_csv(output_path, index=False)
            elif format.lower() in ['xlsx', 'excel']:
                self.cleaned_df.to_excel(output_path, index=False)
            else:
                return False, f"Unsupported export format: {format}"
            
            return True, f"Data exported successfully to {output_path}"
            
        except Exception as e:
            return False, f"Error exporting data: {str(e)}"
    
    def query_data(self, query):
        """Query the dataset using natural language (placeholder for AI integration)"""
        if self.cleaned_df is None:
            return "No data loaded"
        
        # Simple query processing (can be enhanced with AI)
        query_lower = query.lower()
        
        try:
            # Handle basic queries
            if "shape" in query_lower or "size" in query_lower:
                return f"The dataset has {self.cleaned_df.shape[0]} rows and {self.cleaned_df.shape[1]} columns."
            
            elif "columns" in query_lower:
                return f"Columns in the dataset: {', '.join(self.cleaned_df.columns.tolist())}"
            
            elif "missing" in query_lower:
                missing = self.cleaned_df.isnull().sum()
                missing_cols = missing[missing > 0]
                if len(missing_cols) == 0:
                    return "No missing values in the dataset."
                else:
                    return f"Missing values: {missing_cols.to_dict()}"
            
            elif "summary" in query_lower or "describe" in query_lower:
                numeric_cols = self.cleaned_df.select_dtypes(include=[np.number]).columns
                if len(numeric_cols) > 0:
                    desc = self.cleaned_df[numeric_cols].describe()
                    return f"Statistical summary:\n{desc.to_string()}"
                else:
                    return "No numeric columns available for statistical summary."
            
            elif "correlation" in query_lower:
                numeric_cols = self.cleaned_df.select_dtypes(include=[np.number]).columns
                if len(numeric_cols) >= 2:
                    corr = self.cleaned_df[numeric_cols].corr()
                    # Find highest correlation
                    corr_pairs = []
                    for i in range(len(corr.columns)):
                        for j in range(i+1, len(corr.columns)):
                            corr_pairs.append({
                                'pair': f"{corr.columns[i]} - {corr.columns[j]}",
                                'correlation': corr.iloc[i, j]
                            })
                    
                    corr_pairs.sort(key=lambda x: abs(x['correlation']), reverse=True)
                    top_corr = corr_pairs[0]
                    return f"Highest correlation: {top_corr['pair']} with correlation of {top_corr['correlation']:.3f}"
                else:
                    return "Not enough numeric columns for correlation analysis."
            
            else:
                return "I can help you with queries about: dataset shape, columns, missing values, statistical summary, and correlations. Please try rephrasing your question."
        
        except Exception as e:
            return f"Error processing query: {str(e)}"
    
    def get_visualization_data(self, chart_id):
        """Get specific visualization data"""
        if not self.visualizations:
            return None
        
        # Search through all visualization categories
        for category, charts in self.visualizations.items():
            if isinstance(charts, list):
                for chart in charts:
                    if chart.get('id') == chart_id:
                        return chart
        
        return None
    
    def get_dashboard_data(self, dashboard_id):
        """Get specific dashboard data"""
        if not self.visualizations or 'dashboard_options' not in self.visualizations:
            return None
        
        for dashboard in self.visualizations['dashboard_options']:
            if dashboard.get('id') == dashboard_id:
                return dashboard
        
        return None