from flask import Flask
import os

app = Flask(__name__)

@app.route('/')
def home():
    return "Hello from Vercel! Flask is working!"

@app.route('/test')
def test():
    return "Test route is working on Vercel!"

@app.route('/debug')
def debug():
    current_dir = os.getcwd()
    files = []
    try:
        files = os.listdir('.')
    except:
        files = ["Error listing files"]
    
    return f"""
    <h2>Vercel Debug:</h2>
    <p><strong>Current directory:</strong> {current_dir}</p>
    <p><strong>Files:</strong> {files}</p>
    """

# Point d'entrée pour Vercel
app = app
