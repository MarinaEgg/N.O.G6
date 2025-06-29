from flask import Flask, render_template, send_from_directory, jsonify, request
import os
import sys

app = Flask(__name__, 
           static_folder='../client',
           template_folder='../client/html')

# Configuration pour Flask 3.x
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

@app.route('/')
def home():
    try:
        return render_template('index.html')
    except:
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
        api_files = os.listdir('./api') if os.path.exists('./api') else ["No api folder"]
        client_files = os.listdir('./client') if os.path.exists('./client') else ["No client folder"]
        
        # Vérifier les sous-dossiers du client
        client_subdirs = {}
        if os.path.exists('./client'):
            for subdir in ['html', 'css', 'js', 'img']:
                path = f'./client/{subdir}'
                if os.path.exists(path):
                    try:
                        client_subdirs[subdir] = os.listdir(path)
                    except:
                        client_subdirs[subdir] = ["Error reading"]
                else:
                    client_subdirs[subdir] = ["Folder not found"]
    except Exception as e:
        files = [f"Error listing files: {str(e)}"]
        api_files = []
        client_files = []
        client_subdirs = {}
    
    return f"""
    <h2>Vercel Debug Info:</h2>
    <p><strong>Current directory:</strong> {current_dir}</p>
    <p><strong>Python version:</strong> {sys.version}</p>
    <p><strong>Flask version:</strong> {Flask.__version__}</p>
    <p><strong>Request method:</strong> {request.method}</p>
    <p><strong>Request path:</strong> {request.path}</p>
    <hr>
    <h3>File Structure:</h3>
    <p><strong>Root files:</strong> {files}</p>
    <p><strong>API files:</strong> {api_files}</p>
    <p><strong>Client files:</strong> {client_files}</p>
    <hr>
    <h3>Client Subdirectories:</h3>
    {''.join([f'<p><strong>{k}:</strong> {v}</p>' for k, v in client_subdirs.items()])}
    """

@app.route('/onboarding')
@app.route('/onboarding/')
def onboarding():
    try:
        return render_template('onboarding.html')
    except:
        return "Onboarding page - template not found"

@app.route('/links')
@app.route('/links/')
@app.route('/links/<path:subpath>')
def links(subpath=None):
    try:
        return render_template('links.html')
    except:
        return f"Links page - subpath: {subpath}"

@app.route('/chat')
@app.route('/chat/')
@app.route('/chat/<path:subpath>')
def chat(subpath=None):
    return f"Chat page - subpath: {subpath}"

@app.route('/backend-api/<path:endpoint>')
def backend_api(endpoint):
    return jsonify({
        "message": f"API endpoint: {endpoint}",
        "status": "working"
    })

# Servir les fichiers statiques
@app.route('/css/<path:filename>')
def css_files(filename):
    try:
        return send_from_directory('../client/css', filename)
    except:
        return "CSS file not found", 404

@app.route('/js/<path:filename>')
def js_files(filename):
    try:
        return send_from_directory('../client/js', filename)
    except:
        return "JS file not found", 404

@app.route('/img/<path:filename>')
def img_files(filename):
    try:
        return send_from_directory('../client/img', filename)
    except:
        return "Image file not found", 404

@app.route('/assets/<path:filename>')
def assets(filename):
    # Essayer différents dossiers pour les assets
    folders = ['../client/css', '../client/js', '../client/img']
    for folder in folders:
        try:
            return send_from_directory(folder, filename)
        except:
            continue
    return "Asset not found", 404

# Point d'entrée pour Vercel - Compatible Flask 3.x
app.wsgi_app = app.wsgi_app

# Handler pour Vercel
def handler(event, context):
    return app

# Export de l'app pour Vercel
application = app

# Pour les tests locaux
if __name__ == '__main__':
    app.run(debug=True)
