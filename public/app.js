window.onload = function() {
    fetchFiles();
};

function fetchFiles() {
    fetch('/files')
        .then(response => response.json())
        .then(files => {
            const fileList = document.getElementById('file-list-ul');
            fileList.innerHTML = '';
            files.forEach(file => {
                const tr = document.createElement('tr');
                
                // Select checkbox for individual selection
                const selectCell = document.createElement('td');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = file;
                checkbox.className = 'file-checkbox';
                checkbox.onchange = updateMassActionButtons;
                selectCell.appendChild(checkbox);

                // File name cell
                const nameCell = document.createElement('td');
                nameCell.textContent = file;

                // Action cell with individual download and delete buttons
                const actionCell = document.createElement('td');
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'download-btn';
                downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
                downloadBtn.onclick = () => downloadFile(file); // Individual download button

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
                deleteBtn.onclick = () => deleteFile(file); // Individual delete button

                actionCell.appendChild(downloadBtn);
                actionCell.appendChild(deleteBtn);

                // Append all cells to the row
                tr.appendChild(selectCell);
                tr.appendChild(nameCell);
                tr.appendChild(actionCell);

                // Append row to the table
                fileList.appendChild(tr);
            });
        });
}

// Update the mass action buttons based on selected checkboxes
function updateMassActionButtons() {
    const selectedFiles = document.querySelectorAll('.file-checkbox:checked');
    const massDownloadBtn = document.getElementById('massDownloadBtn');
    const massDeleteBtn = document.getElementById('massDeleteBtn');
    const massSelectBtn = document.getElementById('massSelectBtn');

    // Enable/Disable mass action buttons based on selection
    if (selectedFiles.length > 0) {
        massDownloadBtn.disabled = false;
        massDeleteBtn.disabled = false;
    } else {
        massDownloadBtn.disabled = true;
        massDeleteBtn.disabled = true;
    }

    const allFiles = document.querySelectorAll('.file-checkbox');
    if (allFiles.length > 0) {
        massSelectBtn.disabled = false;
    } else {
        massSelectBtn.disabled = true;
    }
}

// Mass select action
function massSelect() {
    const checkboxes = document.querySelectorAll('.file-checkbox');
    const allChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
    checkboxes.forEach(checkbox => {
        checkbox.checked = !allChecked;
    });
    updateMassActionButtons();
}

// Mass download action
function massDownload() {
    const selectedFiles = document.querySelectorAll('.file-checkbox:checked');
    const fileNames = Array.from(selectedFiles).map(checkbox => checkbox.value);
    fileNames.forEach(fileName => {
        window.location.href = `/download/${fileName}`;
    });
}

// Mass delete action
function massDelete() {
    const selectedFiles = document.querySelectorAll('.file-checkbox:checked');
    const fileNames = Array.from(selectedFiles).map(checkbox => checkbox.value);
    fileNames.forEach(fileName => {
        fetch(`/delete/${fileName}`, { method: 'DELETE' })
            .then(response => {
                alert(`${fileName} deleted successfully`);
                fetchFiles();
            })
            .catch(error => {
                alert(`Error deleting ${fileName}`);
            });
    });
}

// Individual file download
function downloadFile(file) {
    window.location.href = `/download/${file}`;
}

// Individual file delete
function deleteFile(file) {
    fetch(`/delete/${file}`, { method: 'DELETE' })
        .then(response => {
            alert(`${file} deleted successfully`);
            fetchFiles(); // Reload the list of files after deletion
        })
        .catch(error => {
            alert(`Error deleting ${file}`);
        });
}

function showUploadButton() {
    const uploadFilesBtn = document.getElementById('uploadFilesBtn');
    uploadFilesBtn.style.display = 'inline-block';
}

function uploadFiles() {
    const fileInput = document.getElementById('file-input');
    const formData = new FormData();
    Array.from(fileInput.files).forEach(file => formData.append('file', file));
    const progressContainer = document.getElementById('progressContainer');
    progressContainer.style.display = 'block';
    const uploadProgress = document.getElementById('uploadProgressContainer');
    const progressText = document.getElementById('uploadProgressText');
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/upload', true);
    xhr.upload.addEventListener('progress', function(event) {
        if (event.lengthComputable) {
            const percent = (event.loaded / event.total) * 100;
            uploadProgress.style.width = `${percent}%`;
            progressText.textContent = `${Math.round(percent)}%`;
        }
    });
    xhr.onload = function() {
        if (xhr.status === 200) {
            alert('Files uploaded successfully!');
            fetchFiles();
            resetUploadSection();
            progressContainer.style.display = 'none';
        } else {
            alert('Error uploading files');
        }
    };
    xhr.send(formData);
}

function resetUploadSection() {
    document.getElementById('file-input').value = '';
    document.getElementById('uploadFilesBtn').style.display = 'none';
}
