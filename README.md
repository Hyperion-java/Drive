# File Upload and Backup Server

This is a Node.js application that allows users to upload, download, and delete files from an external drive. Additionally, the app periodically creates backups of the files on the external drive and stores them in a backup directory. The server can be stopped by typing `#stop` in the terminal.

## Features
- **File Upload**: Upload files to the external drive.
- **File Download**: Download files from the external drive.
- **File Deletion**: Delete files from the external drive.
- **Backup Creation**: Periodically create zip backups of the files on the external drive.
- **Server Shutdown**: Stop the server by typing `#stop` in the terminal.

## Requirements
- Node.js (>= 14.x)
- An external drive or directory to store files (configured in `config.json`)
