from flask import Flask, render_template, send_from_directory, jsonify, request, Response, stream_with_context
import os
import sys
import requests
from json import loads

# Configuration Flask optimisée pour Vercel
app = Flask(__name__)

# Configuration pour éviter les erreurs de cache
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

@app.route('/')
def home():
    try:
        # Essayer de servir le fichier HTML depuis différents chemins
        possible_paths = [
            'client/html/index.html',
            '../client/html/index.html', 
            './client/html/index.html'
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    return f.read()
        
        # Si aucun fichier trouvé, retourner une page simple
        return """
        <!DOCTYPE html>
        <html>
        <head><title>Vercel Flask App</title></head>
        <body>
            <h1>Hello from Vercel! Flask is working!</h1>
            <p><a href="/test">Test Route</a></p>
            <p><a href="/debug">Debug Info</a></p>
        </body>
        </html>
        """
    except Exception as e:
        return f"Error loading home page: {str(e)}"

@app.route('/test')
def test():
    return """
    <h1>Test Route Working!</h1>
    <p>✅ Flask 3.0.2 is running correctly on Vercel</p>
    <p><a href="/">← Back to Home</a> | <a href="/debug">Debug Info →</a></p>
    """

@app.route('/debug')
def debug():
    try:
        current_dir = os.getcwd()
        
        # Lister les fichiers de manière sécurisée
        def safe_listdir(path):
            try:
                if os.path.exists(path):
                    return os.listdir(path)
                else:
                    return [f"Path not found: {path}"]
            except Exception as e:
                return [f"Error: {str(e)}"]
        
        root_files = safe_listdir('.')
        api_files = safe_listdir('./api')
        client_files = safe_listdir('./client')
        
        # Vérifier les sous-dossiers
        html_files = safe_listdir('./client/html')
        css_files = safe_listdir('./client/css')
        js_files = safe_listdir('./client/js')
        img_files = safe_listdir('./client/img')
        
        # Informations système
        python_version = sys.version
        flask_version = Flask.__version__
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Debug Info</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .section {{ margin: 20px 0; padding: 10px; border: 1px solid #ccc; }}
                .files {{ background: #f5f5f5; padding: 10px; }}
            </style>
        </head>
        <body>
            <h1>🔍 Vercel Debug Information</h1>
            
            <div class="section">
                <h2>System Info</h2>
                <p><strong>Current Directory:</strong> {current_dir}</p>
                <p><strong>Python Version:</strong> {python_version}</p>
                <p><strong>Flask Version:</strong> {flask_version}</p>
                <p><strong>Request Method:</strong> {request.method}</p>
                <p><strong>Request Path:</strong> {request.path}</p>
            </div>
            
            <div class="section">
                <h2>File Structure</h2>
                <div class="files">
                    <p><strong>Root files:</strong> {root_files}</p>
                    <p><strong>API files:</strong> {api_files}</p>
                    <p><strong>Client files:</strong> {client_files}</p>
                </div>
                
                <h3>Client Subdirectories:</h3>
                <div class="files">
                    <p><strong>HTML files:</strong> {html_files}</p>
                    <p><strong>CSS files:</strong> {css_files}</p>
                    <p><strong>JS files:</strong> {js_files}</p>
                    <p><strong>Image files:</strong> {img_files}</p>
                </div>
            </div>
            
            <div class="section">
                <h2>Navigation</h2>
                <p><a href="/">← Home</a> | <a href="/test">Test Route</a></p>
            </div>
        </body>
        </html>
        """
    except Exception as e:
        return f"""
        <h1>Debug Error</h1>
        <p>Error generating debug info: {str(e)}</p>
        <p><a href="/">← Back to Home</a></p>
        """

@app.route('/onboarding')
@app.route('/onboarding/')
def onboarding():
    try:
        # Essayer de lire le fichier onboarding.html
        possible_paths = [
            'client/html/onboarding.html',
            '../client/html/onboarding.html',
            './client/html/onboarding.html'
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    return f.read()
        
        return """
        <h1>Onboarding Page</h1>
        <p>Onboarding template not found, but route is working!</p>
        <p><a href="/">← Back to Home</a></p>
        """
    except Exception as e:
        return f"Error loading onboarding: {str(e)}"

@app.route('/links')
@app.route('/links/')
@app.route('/links/<path:subpath>')
def links(subpath=None):
    try:
        # Essayer de lire le fichier links.html
        possible_paths = [
            'client/html/links.html',
            '../client/html/links.html',
            './client/html/links.html'
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    return f.read()
        
        return f"""
        <h1>Links Page</h1>
        <p>Links template not found, but route is working!</p>
        <p>Subpath: {subpath if subpath else 'None'}</p>
        <p><a href="/">← Back to Home</a></p>
        """
    except Exception as e:
        return f"Error loading links: {str(e)}"

@app.route('/chat')
@app.route('/chat/')
@app.route('/chat/<conversation_id>')
def chat(conversation_id=None):
    try:
        # Essayer de lire le fichier index.html pour le chat
        possible_paths = [
            'client/html/index.html',
            '../client/html/index.html',
            './client/html/index.html'
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Remplacer le placeholder chat_id si nécessaire
                    if conversation_id:
                        content = content.replace('{{chat_id}}', conversation_id)
                    else:
                        # Générer un ID de conversation aléatoire
                        import time
                        from os import urandom
                        chat_id = f'{urandom(4).hex()}-{urandom(2).hex()}-{urandom(2).hex()}-{urandom(2).hex()}-{hex(int(time.time() * 1000))[2:]}'
                        content = content.replace('{{chat_id}}', chat_id)
                    return content
        
        return f"""
        <h1>Chat Page</h1>
        <p>Chat template not found, but route is working!</p>
        <p>Conversation ID: {conversation_id if conversation_id else 'None'}</p>
        <p><a href="/">← Back to Home</a></p>
        """
    except Exception as e:
        return f"Error loading chat: {str(e)}"

# ROUTE CRITIQUE: API Backend pour le chatbot
@app.route('/backend-api/v2/conversation', methods=['POST'])
def conversation():
    try:
        # Extraire la question de la requête
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        # Extraire le contenu de la question
        prompt = data.get('meta', {}).get('content', {}).get('parts', [{}])[0]
        question_text = prompt.get('content', '') if isinstance(prompt, dict) else str(prompt)
        
        if not question_text:
            return jsonify({"error": "No question provided"}), 400
        
        # Préparer le payload pour l'API externe
        payload = {
            "question": question_text.replace("?", "").replace("\n", "")
        }

        # URL de l'API externe
        api_url = "https://legal-chatbot.eastus.cloudapp.azure.com:443/v1/assist/stream/"
        api_headers = {
            "Content-Type": "application/json", 
            'cache-control': 'no-cache', 
            'Connection': 'keep-alive'
        }

        def generate():
            try:
                with requests.post(api_url, headers=api_headers, json=payload, stream=True, timeout=30) as r:
                    if r.status_code >= 400:
                        yield f"data: {{\"error\": \"API returned status code {r.status_code}\"}}\n\n"
                        yield f"data: [DONE]\n\n"
                        return
                    
                    for line in r.iter_lines():
                        if line:
                            decoded_line = line.decode('utf-8')
                            yield f"{decoded_line}\n\n"
                            
            except requests.exceptions.Timeout:
                yield f"data: {{\"error\": \"Request timeout\"}}\n\n"
                yield f"data: [DONE]\n\n"
            except requests.exceptions.ConnectionError:
                yield f"data: {{\"error\": \"Connection error to external API\"}}\n\n"
                yield f"data: [DONE]\n\n"
            except Exception as e:
                yield f"data: {{\"error\": \"Unexpected error: {str(e)}\"}}\n\n"
                yield f"data: [DONE]\n\n"

        return Response(
            stream_with_context(generate()),
            mimetype="text/event-stream",
            headers={
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        )

    except Exception as e:
        print(f"Error in conversation endpoint: {e}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# Route pour gérer les requêtes OPTIONS (CORS preflight)
@app.route('/backend-api/v2/conversation', methods=['OPTIONS'])
def conversation_options():
    return '', 200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }

@app.route('/backend-api/<path:endpoint>')
def backend_api_fallback(endpoint):
    return jsonify({
        "message": f"API endpoint: {endpoint}",
        "status": "working",
        "method": request.method,
        "timestamp": "2025-06-29",
        "note": "This is a fallback endpoint. Main chat API is at /backend-api/v2/conversation"
    })

# CORRECTION CRITIQUE: Routes pour les fichiers statiques avec gestion d'erreurs améliorée
@app.route('/assets/css/<path:filename>')
def serve_css(filename):
    try:
        # Chercher le fichier CSS dans différents emplacements
        possible_paths = [
            f'client/css/{filename}',
            f'../client/css/{filename}',
            f'./client/css/{filename}'
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                return content, 200, {'Content-Type': 'text/css'}
        
        return f"CSS file not found: {filename}", 404
    except Exception as e:
        return f"Error serving CSS {filename}: {str(e)}", 500

@app.route('/assets/js/<path:filename>')
def serve_js(filename):
    try:
        # Chercher le fichier JS dans différents emplacements
        possible_paths = [
            f'client/js/{filename}',
            f'../client/js/{filename}',
            f'./client/js/{filename}'
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                return content, 200, {'Content-Type': 'application/javascript'}
        
        return f"JS file not found: {filename}", 404
    except Exception as e:
        return f"Error serving JS {filename}: {str(e)}", 500

@app.route('/assets/img/<path:filename>')
def serve_img(filename):
    try:
        # Chercher le fichier image dans différents emplacements
        possible_paths = [
            f'client/img/{filename}',
            f'../client/img/{filename}',
            f'./client/img/{filename}'
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                # Déterminer le type MIME basé sur l'extension
                if filename.lower().endswith('.png'):
                    mimetype = 'image/png'
                elif filename.lower().endswith('.jpg') or filename.lower().endswith('.jpeg'):
                    mimetype = 'image/jpeg'
                elif filename.lower().endswith('.gif'):
                    mimetype = 'image/gif'
                elif filename.lower().endswith('.svg'):
                    mimetype = 'image/svg+xml'
                elif filename.lower().endswith('.webp'):
                    mimetype = 'image/webp'
                elif filename.lower().endswith('.ico'):
                    mimetype = 'image/x-icon'
                elif filename.lower().endswith('.webmanifest'):
                    mimetype = 'application/manifest+json'
                else:
                    mimetype = 'application/octet-stream'
                
                # Pour les fichiers texte comme webmanifest
                if filename.lower().endswith('.webmanifest'):
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    return content, 200, {'Content-Type': mimetype}
                else:
                    # Pour les fichiers binaires
                    with open(path, 'rb') as f:
                        content = f.read()
                    return content, 200, {'Content-Type': mimetype}
        
        return f"Image file not found: {filename}", 404
    except Exception as e:
        return f"Error serving image {filename}: {str(e)}", 500

# Route générique pour les assets (fallback)
@app.route('/assets/<folder>/<file>')
def assets_fallback(folder: str, file: str):
    try:
        possible_paths = [
            f'client/{folder}/{file}',
            f'../client/{folder}/{file}',
            f'./client/{folder}/{file}'
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                # Déterminer le type de contenu
                if folder == 'css':
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    return content, 200, {'Content-Type': 'text/css'}
                elif folder == 'js':
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    return content, 200, {'Content-Type': 'application/javascript'}
                else:
                    # Pour les autres types de fichiers
                    with open(path, 'rb') as f:
                        content = f.read()
                    return content, 200, {'Content-Type': 'application/octet-stream'}
        
        return f"Asset not found: {folder}/{file}", 404
    except Exception as e:
        return f"Error serving asset {folder}/{file}: {str(e)}", 500

# Point d'entrée pour Vercel - CORRECTION CRITIQUE
# Vercel attend une variable nommée 'app' au niveau du module
# Pas besoin de fonction handler