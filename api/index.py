from flask import Flask, render_template, send_from_directory, jsonify
import os

app = Flask(__name__, 
           static_folder='../client',
           template_folder='../client/html')

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
    except Exception as e:
        files = [f"Error listing files: {str(e)}"]
        api_files = []
        client_files = []
    
    return f"""
    <h2>Vercel Debug Info:</h2>
    <p><strong>Current directory:</strong> {current_dir}</p>
    <p><strong>Root files:</strong> {files}</p>
    <p><strong>API files:</strong> {api_files}</p>
    <p><strong>Client files:</strong> {client_files}</p>
    <p><strong>Python version:</strong> {os.sys.version}</p>
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

# Point d'entrée pour Vercel
def handler(request):
    return app(request.environ, start_response)

# Pour les tests locaux
if __name__ == '__main__':
    app.run(debug=True)
