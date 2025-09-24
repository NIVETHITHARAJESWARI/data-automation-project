from flask import Blueprint, request, jsonify
from routes.upload import data_processors  # Import shared data processors

analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('/insights/<session_id>')
def get_insights(session_id):
    """Get data insights for a session"""
    try:
        if session_id not in data_processors:
            return jsonify({'error': 'Session not found'}), 404
        
        processor = data_processors[session_id]
        
        if not processor.insights:
            return jsonify({'error': 'No insights available'}), 400
        
        return jsonify({
            'success': True,
            'insights': processor.insights
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to get insights: {str(e)}'}), 500

@analysis_bp.route('/visualizations/<session_id>')
def get_visualizations(session_id):
    """Get all visualizations for a session"""
    try:
        if session_id not in data_processors:
            return jsonify({'error': 'Session not found'}), 404
        
        processor = data_processors[session_id]
        
        if not processor.visualizations:
            return jsonify({'error': 'No visualizations available'}), 400
        
        return jsonify({
            'success': True,
            'visualizations': processor.visualizations
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to get visualizations: {str(e)}'}), 500

@analysis_bp.route('/dashboards/<session_id>')
def get_dashboards(session_id):
    """Get dashboard options for a session"""
    try:
        if session_id not in data_processors:
            return jsonify({'error': 'Session not found'}), 404
        
        processor = data_processors[session_id]
        
        if not processor.visualizations or 'dashboard_options' not in processor.visualizations:
            return jsonify({'error': 'No dashboards available'}), 400
        
        return jsonify({
            'success': True,
            'dashboards': processor.visualizations['dashboard_options']
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to get dashboards: {str(e)}'}), 500

@analysis_bp.route('/dashboard/<session_id>/<dashboard_id>')
def get_dashboard(session_id, dashboard_id):
    """Get specific dashboard data"""
    try:
        if session_id not in data_processors:
            return jsonify({'error': 'Session not found'}), 404
        
        processor = data_processors[session_id]
        dashboard = processor.get_dashboard_data(dashboard_id)
        
        if not dashboard:
            return jsonify({'error': 'Dashboard not found'}), 404
        
        return jsonify({
            'success': True,
            'dashboard': dashboard
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to get dashboard: {str(e)}'}), 500

@analysis_bp.route('/chart/<session_id>/<chart_id>')
def get_chart(session_id, chart_id):
    """Get specific chart data"""
    try:
        if session_id not in data_processors:
            return jsonify({'error': 'Session not found'}), 404
        
        processor = data_processors[session_id]
        chart = processor.get_visualization_data(chart_id)
        
        if not chart:
            return jsonify({'error': 'Chart not found'}), 404
        
        return jsonify({
            'success': True,
            'chart': chart
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to get chart: {str(e)}'}), 500

@analysis_bp.route('/summary/<session_id>')
def get_data_summary(session_id):
    """Get comprehensive data summary"""
    try:
        if session_id not in data_processors:
            return jsonify({'error': 'Session not found'}), 404
        
        processor = data_processors[session_id]
        summary = processor.get_data_summary()
        
        if not summary:
            return jsonify({'error': 'No summary available'}), 400
        
        return jsonify({
            'success': True,
            'summary': summary
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to get summary: {str(e)}'}), 500

@analysis_bp.route('/export-dashboard', methods=['POST'])
def export_dashboard():
    """Export dashboard configuration"""
    try:
        data = request.get_json()
        
        if not data or 'session_id' not in data or 'dashboard_id' not in data:
            return jsonify({'error': 'Missing session_id or dashboard_id'}), 400
        
        session_id = data['session_id']
        dashboard_id = data['dashboard_id']
        
        if session_id not in data_processors:
            return jsonify({'error': 'Session not found'}), 404
        
        processor = data_processors[session_id]
        dashboard = processor.get_dashboard_data(dashboard_id)
        
        if not dashboard:
            return jsonify({'error': 'Dashboard not found'}), 404
        
        # In a real application, you'd generate and save the dashboard file
        export_data = {
            'dashboard_config': dashboard,
            'export_format': data.get('format', 'json'),
            'export_timestamp': '2024-01-01T00:00:00Z',
            'file_info': processor.file_info
        }
        
        return jsonify({
            'success': True,
            'message': 'Dashboard exported successfully',
            'export_data': export_data,
            'download_url': f'/api/downloads/dashboard_{dashboard_id}.json'
        })
    
    except Exception as e:
        return jsonify({'error': f'Export failed: {str(e)}'}), 500

@analysis_bp.route('/regenerate-insights/<session_id>', methods=['POST'])
def regenerate_insights(session_id):
    """Regenerate insights with new parameters"""
    try:
        if session_id not in data_processors:
            return jsonify({'error': 'Session not found'}), 404
        
        processor = data_processors[session_id]
        
        # Get any parameters from request
        params = request.get_json() or {}
        
        # Regenerate insights
        processor.insights = processor.insights_generator.generate_comprehensive_insights(
            processor.cleaned_df, processor.original_df
        )
        
        return jsonify({
            'success': True,
            'message': 'Insights regenerated successfully',
            'insights': processor.insights
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to regenerate insights: {str(e)}'}), 500