import os
import json
import shutil
import zipfile
import schedule
import time
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, abort, redirect
from werkzeug.utils import secure_filename
import threading

# Load configuration
with open("config.json") as config_file:
    config = json.load(config_file)

drive_path = config["externalDrivePath"]
backups_path = config["backupsPath"]

# Ensure directories exist
os.makedirs(drive_path, exist_ok=True)
os.makedirs(backups_path, exist_ok=True)

app = Flask(__name__, static_folder='public', static_url_path='/')
app.config['UPLOAD_FOLDER'] = drive_path

@app.route('/')
def index():
    return redirect('/index.html')

@app.route('/files', methods=['GET'])
def list_files():
    try:
        files = os.listdir(drive_path)
        return jsonify(files)
    except Exception as e:
        return str(e), 500

@app.route('/upload', methods=['POST'])
def upload_files():
    if 'file' not in request.files:
        return 'No file part', 400
    files = request.files.getlist('file')
    if not files:
        return 'No files uploaded', 400
    
    uploaded_files = []
    for file in files:
        filename = secure_filename(file.filename)
        file.save(os.path.join(drive_path, filename))
        uploaded_files.append(filename)
    
    return jsonify({"message": "Files uploaded successfully", "files": uploaded_files}), 200

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    if not os.path.exists(os.path.join(drive_path, filename)):
        abort(404, 'File not found')
    return send_from_directory(drive_path, filename, as_attachment=True)

@app.route('/delete/<filename>', methods=['DELETE'])
def delete_file(filename):
    filepath = os.path.join(drive_path, filename)
    if os.path.exists(filepath):
        os.remove(filepath)
        return 'File deleted successfully', 200
    else:
        return 'File not found', 404

def create_backup():
    timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    backup_filename = f'backup-{timestamp}.zip'
    backup_filepath = os.path.join(backups_path, backup_filename)
    
    with zipfile.ZipFile(backup_filepath, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(drive_path):
            for file in files:
                zipf.write(os.path.join(root, file), arcname=file)
    
    print(f'Backup created: {backup_filename}')

# Schedule backup every 12 hours
schedule.every(12).hours.do(create_backup)

def run_scheduler():
    while True:
        schedule.run_pending()
        time.sleep(1)

scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
scheduler_thread.start()

if __name__ == '__main__':
    host = config["host"]
    port = config["port"]
    print(f"Server running at http://{host}:{port}")
    app.run(host=host, port=port, debug=True)
