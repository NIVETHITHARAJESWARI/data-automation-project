import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, LabelEncoder
import re

class DataCleaner:
    def __init__(self):
        self.cleaning_report = []
        self.original_shape = None
        self.cleaned_shape = None
    
    def clean_dataset(self, df):
        """Main cleaning function that applies all cleaning steps"""
        self.original_shape = df.shape
        self.cleaning_report = []
        
        # Make a copy to avoid modifying original
        df_cleaned = df.copy()
        
        # Step 1: Remove completely empty rows and columns
        df_cleaned = self._remove_empty_rows_cols(df_cleaned)
        
        # Step 2: Handle missing values
        df_cleaned = self._handle_missing_values(df_cleaned)
        
        # Step 3: Remove duplicates
        df_cleaned = self._remove_duplicates(df_cleaned)
        
        # Step 4: Fix data types
        df_cleaned = self._fix_data_types(df_cleaned)
        
        # Step 5: Handle outliers
        df_cleaned = self._handle_outliers(df_cleaned)
        
        # Step 6: Standardize text data
        df_cleaned = self._standardize_text(df_cleaned)
        
        # Step 7: Clean column names
        df_cleaned = self._clean_column_names(df_cleaned)
        
        self.cleaned_shape = df_cleaned.shape
        
        return df_cleaned
    
    def _remove_empty_rows_cols(self, df):
        """Remove completely empty rows and columns"""
        initial_shape = df.shape
        
        # Remove empty columns
        df = df.dropna(axis=1, how='all')
        
        # Remove empty rows
        df = df.dropna(axis=0, how='all')
        
        removed_rows = initial_shape[0] - df.shape[0]
        removed_cols = initial_shape[1] - df.shape[1]
        
        if removed_rows > 0 or removed_cols > 0:
            self.cleaning_report.append({
                'step': 'Remove Empty Rows/Columns',
                'action': f'Removed {removed_rows} empty rows and {removed_cols} empty columns'
            })
        
        return df
    
    def _handle_missing_values(self, df):
        """Handle missing values based on column type"""
        missing_info = []
        
        for col in df.columns:
            missing_count = df[col].isnull().sum()
            if missing_count > 0:
                missing_percent = (missing_count / len(df)) * 100
                
                if missing_percent > 70:
                    # Drop columns with >70% missing values
                    df = df.drop(columns=[col])
                    missing_info.append(f"Dropped column '{col}' ({missing_percent:.1f}% missing)")
                else:
                    # Impute based on data type
                    if df[col].dtype in ['object', 'string']:
                        # For categorical data, use mode or 'Unknown'
                        mode_val = df[col].mode()
                        fill_val = mode_val[0] if len(mode_val) > 0 else 'Unknown'
                        df[col] = df[col].fillna(fill_val)
                        missing_info.append(f"Filled {missing_count} missing values in '{col}' with '{fill_val}'")
                    else:
                        # For numerical data, use median
                        median_val = df[col].median()
                        df[col] = df[col].fillna(median_val)
                        missing_info.append(f"Filled {missing_count} missing values in '{col}' with median ({median_val})")
        
        if missing_info:
            self.cleaning_report.append({
                'step': 'Handle Missing Values',
                'action': '; '.join(missing_info)
            })
        
        return df
    
    def _remove_duplicates(self, df):
        """Remove duplicate rows"""
        initial_count = len(df)
        df = df.drop_duplicates()
        removed_count = initial_count - len(df)
        
        if removed_count > 0:
            self.cleaning_report.append({
                'step': 'Remove Duplicates',
                'action': f'Removed {removed_count} duplicate rows'
            })
        
        return df
    
    def _fix_data_types(self, df):
        """Fix data types for better analysis"""
        type_changes = []
        
        for col in df.columns:
            # Try to convert string numbers to numeric
            if df[col].dtype == 'object':
                # Check if it might be numeric
                sample_non_null = df[col].dropna().astype(str)
                if len(sample_non_null) > 0:
                    # Remove common non-numeric characters
                    cleaned_sample = sample_non_null.str.replace(r'[,$%]', '', regex=True)
                    
                    # Try to convert to numeric
                    try:
                        pd.to_numeric(cleaned_sample, errors='raise')
                        # If successful, apply to entire column
                        df[col] = pd.to_numeric(
                            df[col].astype(str).str.replace(r'[,$%]', '', regex=True),
                            errors='coerce'
                        )
                        type_changes.append(f"Converted '{col}' to numeric")
                    except:
                        # Try to convert to datetime
                        try:
                            df[col] = pd.to_datetime(df[col], errors='raise')
                            type_changes.append(f"Converted '{col}' to datetime")
                        except:
                            pass
        
        if type_changes:
            self.cleaning_report.append({
                'step': 'Fix Data Types',
                'action': '; '.join(type_changes)
            })
        
        return df
    
    def _handle_outliers(self, df):
        """Handle outliers in numeric columns using IQR method"""
        outlier_info = []
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            outlier_mask = (df[col] < lower_bound) | (df[col] > upper_bound)
            outlier_count = outlier_mask.sum()
            
            if outlier_count > 0:
                # Cap outliers instead of removing (less aggressive)
                df.loc[df[col] < lower_bound, col] = lower_bound
                df.loc[df[col] > upper_bound, col] = upper_bound
                outlier_info.append(f"Capped {outlier_count} outliers in '{col}'")
        
        if outlier_info:
            self.cleaning_report.append({
                'step': 'Handle Outliers',
                'action': '; '.join(outlier_info)
            })
        
        return df
    
    def _standardize_text(self, df):
        """Standardize text data"""
        text_changes = []
        
        text_cols = df.select_dtypes(include=['object']).columns
        
        for col in text_cols:
            if df[col].dtype == 'object':
                # Remove extra whitespace and standardize case
                original_values = df[col].dropna().nunique()
                df[col] = df[col].astype(str).str.strip().str.title()
                new_values = df[col].dropna().nunique()
                
                if original_values != new_values:
                    text_changes.append(f"Standardized text in '{col}' ({original_values} -> {new_values} unique values)")
        
        if text_changes:
            self.cleaning_report.append({
                'step': 'Standardize Text',
                'action': '; '.join(text_changes)
            })
        
        return df
    
    def _clean_column_names(self, df):
        """Clean and standardize column names"""
        original_cols = df.columns.tolist()
        
        # Clean column names
        df.columns = (df.columns
                     .str.strip()
                     .str.replace(r'[^\w\s]', '', regex=True)
                     .str.replace(r'\s+', '_', regex=True)
                     .str.lower())
        
        new_cols = df.columns.tolist()
        
        if original_cols != new_cols:
            self.cleaning_report.append({
                'step': 'Clean Column Names',
                'action': 'Standardized column names (lowercase, underscores)'
            })
        
        return df
    
    def get_cleaning_summary(self):
        """Get summary of cleaning operations"""
        return {
            'original_shape': self.original_shape,
            'cleaned_shape': self.cleaned_shape,
            'rows_removed': self.original_shape[0] - self.cleaned_shape[0] if self.original_shape and self.cleaned_shape else 0,
            'columns_removed': self.original_shape[1] - self.cleaned_shape[1] if self.original_shape and self.cleaned_shape else 0,
            'cleaning_steps': self.cleaning_report
        }