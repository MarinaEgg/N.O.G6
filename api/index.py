from flask import Flask

# Create Flask app
app = Flask(__name__)

@app.route('/')
def hello():
    return "Hello World - Flask is working!"

@app.route('/test')
def test():
    return "Test route is working!"

@app.route('/debug')
def debug():
    import os
    current_dir = os.getcwd()
    
    # List files
    files = []
    try:
        files = os.listdir('.')
    except:
        files = ["Error listing files"]
    
    return f"Current dir: {current_dir}<br>Files: {files}"

if __name__ == '__main__':
    app.run(debug=True)
