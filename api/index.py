from flask import Flask, render_template, send_file, redirect, request, Response, stream_with_context
from time import time
from os import urandom
import requests
from json import loads
import os

# Create Flask app - fix template path for Vercel
app = Flask(__name__, template_folder='client/html')

# Add debug route to check template loading
@app.route('/debug')
def debug():
    import os
    template_path_abs = os.path.abspath(app.template_folder)
    files = []
    exists = os.path.exists(template_path_abs)
    try:
        if exists:
            files = os.listdir(template_path_abs)
    except Exception as e:
        files = [f"Error: {str(e)}"]
    
    current_dir = os.getcwd()
    all_dirs = []
    try:
        all_dirs = os.listdir('.')
    except:
        pass
        
    return f"""
    <h2>Debug Info:</h2>
    <p><strong>Current directory:</strong> {current_dir}</p>
    <p><strong>Template folder:</strong> {template_path_abs}</p>
    <p><strong>Template folder exists:</strong> {exists}</p>
    <p><strong>Files in template folder:</strong> {files}</p>
    <p><strong>All directories in current:</strong> {all_dirs}</p>
    """

# Website routes
class Website:
    def __init__(self, app) -> None:
        self.app = app
        self.routes = {
            '/': {
                'function': lambda: redirect('/chat'),
                'methods': ['GET', 'POST']
            },
            '/chat/': {
                'function': self._index,
                'methods': ['GET', 'POST']
            },
            '/chat/<conversation_id>': {
                'function': self._chat,
                'methods': ['GET', 'POST']
            },
            '/assets/<folder>/<file>': {
                'function': self._assets,
                'methods': ['GET', 'POST']
            },
            '/onboarding/': {
                'function': self._onboarding,
                'methods': ['GET']
            },
            '/links/<conversation_id>/<scrolly>/<video_ids_concat>/<titles_concat>': {
                'function': self._links,
                'methods': ['GET']
            },
        }

    def _chat(self, conversation_id):
        if not '-' in conversation_id:
            return redirect(f'/chat')

        try:
            return render_template('index.html', chat_id=conversation_id)
        except Exception as e:
            return f"Template error: {str(e)}<br><a href='/debug'>Debug info</a>", 500

    def _index(self):
        try:
            return render_template('index.html', chat_id=f'{urandom(4).hex()}-{urandom(2).hex()}-{urandom(2).hex()}-{urandom(2).hex()}-{hex(int(time() * 1000))[2:]}')
        except Exception as e:
            return f"Template error: {str(e)}<br><a href='/debug'>Debug info</a>", 500

    def _assets(self, folder: str, file: str):
        try:
            return send_file(f"client/{folder}/{file}", as_attachment=False)
        except:
            return "File not found", 404

    def _onboarding(self):
        try:
            return render_template('onboarding.html')
        except Exception as e:
            return f"Template error: {str(e)}<br><a href='/debug'>Debug info</a>", 500
    
    def _links(self, 
               conversation_id, 
               scrolly,
               video_ids_concat,
               titles_concat
               ):
        try:
            return render_template('links.html',
                                   chat_id=conversation_id,
                                   scrolly=scrolly,
                                   video_ids_concat=video_ids_concat,
                                   titles_concat=titles_concat
                                   )
        except Exception as e:
            return f"Template error: {str(e)}<br><a href='/debug'>Debug info</a>", 500

# Backend API routes
class BackendApi:
    def __init__(self, app) -> None:
        self.app = app
        self.routes = {
            '/backend-api/v2/conversation': {
                'function': self._conversation,
                'methods': ['POST']
            }
        }

    def _conversation(self):
        try:
            # Check if request has JSON data
            if not request.json:
                return Response("No JSON data provided", status=400)
            
            # Safely extract the prompt
            meta = request.json.get('meta', {})
            content = meta.get('content', {})
            parts = content.get('parts', [])
            
            if not parts:
                return Response("No parts in content", status=400)
                
            prompt = parts[0]
            question_text = prompt.get('content', '') if isinstance(prompt, dict) else str(prompt)
            
            if not question_text:
                return Response("No question text provided", status=400)
            
            payload = {
                "question": question_text.replace("?", "").replace("\n", "")
            }

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
                            yield f"data: Error: Received status code {r.status_code} from API\n\n"
                            return
                        for line in r.iter_lines():
                            if line:
                                yield f"{line.decode('utf-8')}\n\n"
                except Exception as e:
                    yield f"data: Stream error: {str(e)}\n\n"

            return Response(
                stream_with_context(generate()),
                mimetype="text/event-stream",
                headers={
                    'Cache-Control': 'no-cache',
                    'X-Accel-Buffering': 'no'  
                }
            )

        except Exception as e:
            print(f"Error in _conversation: {e}")
            return Response(f"An error occurred: {str(e)}", status=500)

# Initialize routes with error handling
try:
    site = Website(app)
    for route in site.routes:
        app.add_url_rule(
            route,
            view_func=site.routes[route]['function'],
            methods=site.routes[route]['methods'],
        )

    backend_api = BackendApi(app)
    for route in backend_api.routes:
        app.add_url_rule(
            route,
            view_func=backend_api.routes[route]['function'],
            methods=backend_api.routes[route]['methods'],
        )
except Exception as e:
    print(f"Error initializing routes: {e}")

# For Vercel deployment - Flask app is automatically detected
# No handler function needed

# For local development
if __name__ == '__main__':
    app.run(debug=True)
