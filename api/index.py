from flask import Flask, render_template, send_file, redirect, request, Response, stream_with_context
from time import time
from os import urandom
import requests
from json import loads
import os

# Create Flask app
app = Flask(__name__, template_folder='client/html')

# Simple test route first
@app.route('/test')
def test():
    return "Flask app is working!"

# Debug route
@app.route('/debug')
def debug():
    import os
    current_dir = os.getcwd()
    
    # List all files in current directory
    all_files = []
    try:
        for root, dirs, files in os.walk('.'):
            for file in files:
                all_files.append(os.path.join(root, file))
    except Exception as e:
        all_files = [f"Error walking directory: {str(e)}"]
    
    template_path = os.path.abspath(app.template_folder)
    template_exists = os.path.exists(template_path)
    
    return f"""
    <h2>Debug Info:</h2>
    <p><strong>Current directory:</strong> {current_dir}</p>
    <p><strong>Template folder:</strong> {template_path}</p>
    <p><strong>Template folder exists:</strong> {template_exists}</p>
    <h3>All files in project:</h3>
    <ul>
    {''.join([f'<li>{file}</li>' for file in all_files[:50]])}
    </ul>
    """

# Root route
@app.route('/')
def index():
    return redirect('/chat/')

# Chat route
@app.route('/chat/')
def chat_index():
    try:
        chat_id = f'{urandom(4).hex()}-{urandom(2).hex()}-{urandom(2).hex()}-{urandom(2).hex()}-{hex(int(time() * 1000))[2:]}'
        return render_template('index.html', chat_id=chat_id)
    except Exception as e:
        return f"Template error: {str(e)}<br><a href='/debug'>Debug info</a>", 500

# Chat with ID route
@app.route('/chat/<conversation_id>')
def chat_with_id(conversation_id):
    if not '-' in conversation_id:
        return redirect('/chat/')
    
    try:
        return render_template('index.html', chat_id=conversation_id)
    except Exception as e:
        return f"Template error: {str(e)}<br><a href='/debug'>Debug info</a>", 500

# Assets route
@app.route('/assets/<folder>/<file>')
def assets(folder, file):
    try:
        return send_file(f"client/{folder}/{file}", as_attachment=False)
    except Exception as e:
        return f"File not found: client/{folder}/{file} - Error: {str(e)}", 404

# API route
@app.route('/backend-api/v2/conversation', methods=['POST'])
def conversation():
    try:
        if not request.json:
            return Response("No JSON data provided", status=400)
        
        # Simple test response first
        return Response("API endpoint is working", status=200)
        
    except Exception as e:
        return Response(f"An error occurred: {str(e)}", status=500)

# For local development
if __name__ == '__main__':
    app.run(debug=True)
