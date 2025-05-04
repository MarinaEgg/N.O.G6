from flask import request, Response, stream_with_context
import requests  
from json import loads


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
