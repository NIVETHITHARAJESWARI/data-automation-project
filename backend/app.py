from flask import Flask, jsonify
from flask_cors import CORS
import os
from config import Config

# Import routes
from routes.upload import upload_bp
from routes.analysis import analysis_bp
from routes.chatbot import chatbot_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS
    CORS(app)
    
    # Ensure upload directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Register blueprints
    app.register_blueprint(upload_bp, url_prefix='/api')
    app.register_blueprint(analysis_bp, url_prefix='/api')
    app.register_blueprint(chatbot_bp, url_prefix='/api')
    
    @app.route('/api/health')
    def health_check():
        return jsonify({'status': 'healthy', 'message': 'Data Analyst API is running'})
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)