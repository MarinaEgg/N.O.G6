from flask import Flask, render_template, send_from_directory, jsonify, request
import os
import sys

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
@app.route('/chat/<path:subpath>')
def chat(subpath=None):
    return f"""
    <h1>Chat Page</h1>
    <p>Chat functionality coming soon!</p>
    <p>Subpath: {subpath if subpath else 'None'}</p>
    <p><a href="/">← Back to Home</a></p>
    """

@app.route('/backend-api/<path:endpoint>')
def backend_api(endpoint):
    return jsonify({
        "message": f"API endpoint: {endpoint}",
        "status": "working",
        "method": request.method,
        "timestamp": "2025-06-29"
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