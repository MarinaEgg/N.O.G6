from flask import render_template, send_file, redirect
from time import time
from os import urandom


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
            '/workspace/': {
                'function': self._workspace,
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
    
    def _workspace(self):
        return render_template('workspace.html', chat_id=f'{urandom(4).hex()}-{urandom(2).hex()}-{urandom(2).hex()}-{urandom(2).hex()}-{hex(int(time() * 1000))[2:]}')
    
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
