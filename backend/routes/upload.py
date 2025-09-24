from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import os
from config import allowed_file
from models.data_processor import DataProcessor

upload_bp = Blueprint('upload', __name__)

# Store data processors for different sessions (in production, use proper session management)
data_processors = {}

@upload_bp.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload and initial processing"""
    try:
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed. Please upload CSV or Excel files.'}), 400
        
        # Secure filename and save
        filename = secure_filename(file.filename)
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Create data processor instance
        processor = DataProcessor()
        
        # Load and process the file
        load_success, load_message = processor.load_file(file_path, filename)
        if not load_success:
            # Clean up file
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'error': load_message}), 400
        
        # Process the data
        process_success, process_message = processor.process_data()
        if not process_success:
            # Clean up file
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'error': process_message}), 400
        
        # Generate session ID (in production, use proper session management)
        session_id = f"session_{len(data_processors)}"
        data_processors[session_id] = processor
        
        # Get data summary
        summary = processor.get_data_summary()
        
        # Clean up uploaded file (data is now in memory)
        if os.path.exists(file_path):
            os.remove(file_path)
        
        return jsonify({
            'success': True,
            'message': 'File processed successfully',
            'session_id': session_id,
            'summary': summary
        })
    
    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@upload_bp.route('/download-cleaned/<session_id>')
def download_cleaned_data(session_id):
    """Download cleaned dataset"""
    try:
        if session_id not in data_processors:
            return jsonify({'error': 'Session not found'}), 404
        
        processor = data_processors[session_id]
        
        if processor.cleaned_df is None:
            return jsonify({'error': 'No cleaned data available'}), 400
        
        # Generate filename
        original_filename = processor.file_info.get('filename', 'dataset')
        base_name = os.path.splitext(original_filename)[0]
        cleaned_filename = f"{base_name}_cleaned.csv"
        
        # Create temporary file path
        temp_path = os.path.join(current_app.config['UPLOAD_FOLDER'], cleaned_filename)
        
        # Export data
        success, message = processor.export_cleaned_data(temp_path, 'csv')
        
        if success:
            # In a real application, you'd send the file and then clean up
            # For now, return the file path and data info
            return jsonify({
                'success': True,
                'message': 'Cleaned data ready for download',
                'filename': cleaned_filename,
                'download_url': f'/api/files/{cleaned_filename}',
                'file_info': {
                    'rows': processor.cleaned_df.shape[0],
                    'columns': processor.cleaned_df.shape[1],
                    'size_mb': round(processor.cleaned_df.memory_usage(deep=True).sum() / 1024**2, 2)
                }
            })
        else:
            return jsonify({'error': message}), 500
    
    except Exception as e:
        return jsonify({'error': f'Download failed: {str(e)}'}), 500

@upload_bp.route('/sessions/<session_id>/info')
def get_session_info(session_id):
    """Get session information"""
    try:
        if session_id not in data_processors:
            return jsonify({'error': 'Session not found'}), 404
        
        processor = data_processors[session_id]
        column_info = processor.get_column_info()
        
        return jsonify({
            'success': True,
            'file_info': processor.file_info,
            'column_info': column_info,
            'cleaning_summary': processor.cleaning_summary
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to get session info: {str(e)}'}), 500