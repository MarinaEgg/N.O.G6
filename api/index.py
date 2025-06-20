from flask import Flask, render_template, send_file, redirect, request, Response, stream_with_context
from time import time
from os import urandom
import requests
from json import loads
import os

# Create Flask app
app = Flask(__name__, template_folder='./../client/html')

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

        return render_template('index.html', chat_id=conversation_id)

    def _index(self):
        return render_template('index.html', chat_id=f'{urandom(4).hex()}-{urandom(2).hex()}-{urandom(2).hex()}-{urandom(2).hex()}-{hex(int(time() * 1000))[2:]}')

    def _assets(self, folder: str, file: str):
        try:
            return send_file(f"./../client/{folder}/{file}", as_attachment=False)
        except:
            return "File not found", 404

    def _onboarding(self):
        return render_template('onboarding.html')
    
    def _links(self, 
               conversation_id, 
               scrolly,
               video_ids_concat,
               titles_concat
               ):
        return render_template('links.html',
                               chat_id=conversation_id,
                               scrolly=scrolly,
                               video_ids_concat=video_ids_concat,
                               titles_concat=titles_concat
                               )

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
            
            prompt = request.json['meta']['content']['parts'][0]
            question_text = prompt['content'] if isinstance(prompt, dict) else prompt
            
            payload = {
                "question": question_text.replace("?", "").replace("\n", "")
            }

            
            api_url = "https://legal-chatbot.eastus.cloudapp.azure.com:443/v1/assist/stream/"
            api_headers = {"Content-Type": "application/json", 'cache-control': 'no-cache', 'Connection': 'keep-alive'}

            def generate():
                with requests.post(api_url, headers=api_headers, json=payload, stream=True) as r:
                    
                    if r.status_code >= 400:
                        yield f"data: Error: Received status code {r.status_code} from API\n\n"
                        return
                    for line in r.iter_lines():
                        if line:
                            yield f"{line.decode('utf-8')}\n\n"
                            # print(f"Received: {line.decode('utf-8')}")

            return Response(
                stream_with_context(generate()),
                mimetype="text/event-stream",
                headers={
                    'Cache-Control': 'no-cache',
                    'X-Accel-Buffering': 'no'  
                }
            )

        except Exception as e:
            print(f"Error: {e}")
            return Response(f"An error occurred: {str(e)}", status=500)

# Initialize routes
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

# Vercel serverless function handler
def handler(request, context):
    return app(request, context)

# For local development
if __name__ == '__main__':
    app.run(debug=True) 