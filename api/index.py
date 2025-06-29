from flask import Flask, render_template, send_file, redirect, request, Response
import os

# Create Flask app avec les bons chemins pour Vercel
app = Flask(__name__, 
            template_folder='../client/html',
            static_folder='../client')

@app.route('/')
def home():
    return redirect('/chat')

@app.route('/test')
def test():
    return "Test route is working!"

@app.route('/debug')
def debug():
    current_dir = os.getcwd()
    template_path = os.path.abspath(app.template_folder)
    static_path = os.path.abspath(app.static_folder)
    
    # Vérifier les fichiers
    template_files = []
    static_dirs = []
    
    try:
        if os.path.exists(template_path):
            template_files = os.listdir(template_path)
    except Exception as e:
        template_files = [f"Error: {e}"]
    
    try:
        if os.path.exists(static_path):
            static_dirs = os.listdir(static_path)
    except Exception as e:
        static_dirs = [f"Error: {e}"]
    
    return f"""
    <h2>Debug Info:</h2>
    <p><strong>Current directory:</strong> {current_dir}</p>
    <p><strong>Template path:</strong> {template_path}</p>
    <p><strong>Template files:</strong> {template_files}</p>
    <p><strong>Static path:</strong> {static_path}</p>
    <p><strong>Static directories:</strong> {static_dirs}</p>
    """

@app.route('/chat/')
@app.route('/chat/<conversation_id>')
def chat(conversation_id=None):
    try:
        if conversation_id is None:
            # Générer un ID simple pour le test
            conversation_id = "test-chat-id"
        
        # Vérifier si le template existe
        template_path = os.path.join(app.template_folder, 'index.html')
        if not os.path.exists(template_path):
            return f"Template index.html not found at {template_path}<br><a href='/debug'>Debug info</a>", 404
        
        return render_template('index.html', chat_id=conversation_id)
    except Exception as e:
        return f"Template error: {str(e)}<br><a href='/debug'>Debug info</a>", 500

@app.route('/assets/<folder>/<file>')
def assets(folder, file):
    try:
        asset_path = os.path.join(app.static_folder, folder, file)
        if not os.path.exists(asset_path):
            return f"Asset not found: {asset_path}", 404
        return send_file(asset_path, as_attachment=False)
    except Exception as e:
        return f"Asset error: {str(e)}", 404

@app.route('/onboarding/')
def onboarding():
    try:
        template_path = os.path.join(app.template_folder, 'onboarding.html')
        if not os.path.exists(template_path):
            return f"Template onboarding.html not found at {template_path}<br><a href='/debug'>Debug info</a>", 404
        return render_template('onboarding.html')
    except Exception as e:
        return f"Template error: {str(e)}<br><a href='/debug'>Debug info</a>", 500

@app.route('/links/<conversation_id>/<scrolly>/<video_ids_concat>/<titles_concat>')
def links(conversation_id, scrolly, video_ids_concat, titles_concat):
    try:
        template_path = os.path.join(app.template_folder, 'links.html')
        if not os.path.exists(template_path):
            return f"Template links.html not found at {template_path}<br><a href='/debug'>Debug info</a>", 404
        return render_template('links.html',
                               chat_id=conversation_id,
                               scrolly=scrolly,
                               video_ids_concat=video_ids_concat,
                               titles_concat=titles_concat)
    except Exception as e:
        return f"Template error: {str(e)}<br><a href='/debug'>Debug info</a>", 500

@app.route('/backend-api/v2/conversation', methods=['POST'])
def conversation():
    try:
        if not request.json:
            return Response("No JSON data provided", status=400)
        
        # Pour l'instant, retournons une réponse simple pour tester
        return Response("API endpoint is working - implement your logic here", status=200)
        
    except Exception as e:
        return Response(f"API error: {str(e)}", status=500)

# Pour le développement local
if __name__ == '__main__':
    app.run(debug=True)
