from flask import Blueprint, request, jsonify
import openai
from config import Config
from routes.upload import data_processors

chatbot_bp = Blueprint('chatbot', __name__)

@chatbot_bp.route('/chat/<session_id>', methods=['POST'])
def chat_with_data(session_id):
    """Chat with the dataset using AI"""
    try:
        if session_id not in data_processors:
            return jsonify({'error': 'Session not found'}), 404
        
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400
        
        user_message = data['message']
        processor = data_processors[session_id]
        
        # First, try to answer with basic data queries
        basic_response = processor.query_data(user_message)
        
        # If we have OpenAI API key, enhance the response
        if Config.OPENAI_API_KEY and basic_response.startswith("I can help you"):
            try:
                # Prepare context about the dataset
                context = {
                    'shape': processor.cleaned_df.shape,
                    'columns': processor.cleaned_df.columns.tolist(),
                    'dtypes': processor.cleaned_df.dtypes.astype(str).to_dict(),
                    'sample_data': processor.cleaned_df.head(3).to_dict('records'),
                    'summary_stats': processor.cleaned_df.describe().to_dict() if len(processor.cleaned_df.select_dtypes(include=['number']).columns) > 0 else {}
                }
                
                # Create AI prompt
                prompt = f"""
                You are a data analyst assistant. Answer the user's question about their dataset.
                
                Dataset Information:
                - Shape: {context['shape']} (rows, columns)
                - Columns: {context['columns']}
                - Data Types: {context['dtypes']}
                - Sample Data: {str(context['sample_data'])[:500]}...
                
                User Question: {user_message}
                
                Provide a helpful, accurate response about the dataset. If you need to perform calculations, 
                use the provided information. Be specific and actionable.
                """
                
                openai.api_key = Config.OPENAI_API_KEY
                response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=500,
                    temperature=0.7
                )
                
                ai_response = response.choices[0].message.content
                
                return jsonify({
                    'success': True,
                    'response': ai_response,
                    'source': 'ai'
                })
                
            except Exception as e:
                # Fallback to basic response if AI fails
                return jsonify({
                    'success': True,
                    'response': basic_response,
                    'source': 'basic',
                    'ai_error': str(e)
                })
        else:
            return jsonify({
                'success': True,
                'response': basic_response,
                'source': 'basic'
            })
    
    except Exception as e:
        return jsonify({'error': f'Chat failed: {str(e)}'}), 500

@chatbot_bp.route('/chat-history/<session_id>')
def get_chat_history(session_id):
    """Get chat history for a session"""
    try:
        if session_id not in data_processors:
            return jsonify({'error': 'Session not found'}), 404
        
        # In a real application, you'd store chat history
        # For now, return empty history
        return jsonify({
            'success': True,
            'chat_history': [],
            'message': 'Chat history feature will be implemented with database integration'
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to get chat history: {str(e)}'}), 500

@chatbot_bp.route('/suggested-questions/<session_id>')
def get_suggested_questions(session_id):
    """Get suggested questions based on the dataset"""
    try:
        if session_id not in data_processors:
            return jsonify({'error': 'Session not found'}), 404
        
        processor = data_processors[session_id]
        
        # Generate suggested questions based on data characteristics
        suggestions = []
        
        # Basic questions
        suggestions.append("What is the shape and size of the dataset?")
        suggestions.append("What columns are available?")
        suggestions.append("Are there any missing values?")
        
        # Numeric column questions
        numeric_cols = processor.cleaned_df.select_dtypes(include=['number']).columns
        if len(numeric_cols) > 0:
            suggestions.append(f"Show me statistics for {numeric_cols[0]}")
            suggestions.append("What are the correlations between numeric variables?")
        
        # Categorical column questions
        categorical_cols = processor.cleaned_df.select_dtypes(include=['object']).columns
        if len(categorical_cols) > 0:
            suggestions.append(f"What are the unique values in {categorical_cols[0]}?")
        
        # Advanced questions
        if len(numeric_cols) >= 2:
            suggestions.append("Which variables are most strongly correlated?")
            suggestions.append("Are there any outliers in the data?")
        
        return jsonify({
            'success': True,
            'suggested_questions': suggestions
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to get suggestions: {str(e)}'}), 500

@chatbot_bp.route('/explain-insight/<session_id>', methods=['POST'])
def explain_insight(session_id):
    """Explain a specific insight in detail"""
    try:
        if session_id not in data_processors:
            return jsonify({'error': 'Session not found'}), 404
        
        data = request.get_json()
        if not data or 'insight_id' not in data:
            return jsonify({'error': 'No insight ID provided'}), 400
        
        insight_id = data['insight_id']
        processor = data_processors[session_id]
        
        # Find the specific insight
        insight = None
        for category, insights in processor.insights.items():
            if isinstance(insights, list):
                for item in insights:
                    if isinstance(item, dict) and item.get('type') == insight_id:
                        insight = item
                        break
        
        if not insight:
            return jsonify({'error': 'Insight not found'}), 404
        
        # Generate detailed explanation
        if Config.OPENAI_API_KEY:
            try:
                prompt = f"""
                Explain this data insight in detail for a non-technical audience:
                
                Insight: {insight.get('message', insight.get('insight', str(insight)))}
                Details: {insight.get('details', {})}
                
                Provide:
                1. What this means in plain English
                2. Why it's important
                3. What actions might be taken based on this insight
                
                Keep it clear and actionable.
                """
                
                openai.api_key = Config.OPENAI_API_KEY
                response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=400,
                    temperature=0.7
                )
                
                explanation = response.choices[0].message.content
                
            except Exception as e:
                explanation = f"This insight shows: {insight.get('message', 'an important pattern in your data')}. For detailed analysis, consider the provided statistics and consider consulting with a data analyst."
        else:
            explanation = f"This insight indicates: {insight.get('message', 'an important finding')}. The details show: {insight.get('details', 'additional context about this pattern')}."
        
        return jsonify({
            'success': True,
            'insight': insight,
            'explanation': explanation
        })
    
    except Exception as e:
        return jsonify({'error': f'Failed to explain insight: {str(e)}'}), 500