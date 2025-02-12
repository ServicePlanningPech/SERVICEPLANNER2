function showFilePickerDialog() {
  const ui = SlidesApp.getUi();
  const presentation = SlidesApp.getActivePresentation();
  const lastSlideIndex = presentation.getSlides().length + 1;
  
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 10px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 20px;
          }
          .form-group { 
            margin-bottom: 15px; 
          }
          label { 
            display: block; 
            margin-bottom: 5px;
            color: #333;
            font-weight: bold;
          }
          input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
          }
          button {
            width: 100%;
            padding: 10px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s ease;
          }
          button:hover {
            background-color: #45a049;
          }
          #uploadStatus {
            margin-top: 10px;
            text-align: center;
          }
          .error { 
            color: red; 
          }
          .success { 
            color: green; 
          }
          .progress {
            color: #666;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <form id="uploadForm">
            <div class="form-group">
              <label for="fileInput">Select PowerPoint File:</label>
              <input type="file" id="fileInput" accept=".pptx">
            </div>
            <div class="form-group">
              <label for="slideNumber">Insert After Slide:</label>
              <input type="number" 
                     id="slideNumber" 
                     value="${lastSlideIndex}"
                     min="1" 
                     max="${lastSlideIndex + 1}">
            </div>
            <button type="button" onclick="uploadFile()">Upload and Insert</button>
            <div id="uploadStatus"></div>
          </form>
        </div>
        
        <script>
          function uploadFile() {
            const fileInput = document.getElementById('fileInput');
            const slideNumber = document.getElementById('slideNumber');
            const statusDiv = document.getElementById('uploadStatus');
            const file = fileInput.files[0];
            
            if (!file) {
              statusDiv.innerHTML = '<span class="error">Please select a file</span>';
              return;
            }
            
            if (!file.name.toLowerCase().endsWith('.pptx')) {
              statusDiv.innerHTML = '<span class="error">Please select a PowerPoint file (PPTX)</span>';
              return;
            }
            
            // Validate slide number
            const slidePos = parseInt(slideNumber.value);
            if (isNaN(slidePos) || slidePos < 1 || slidePos > ${lastSlideIndex + 1}) {
              statusDiv.innerHTML = '<span class="error">Invalid slide number</span>';
              return;
            }
            
            statusDiv.innerHTML = '<span class="progress">Uploading...</span>';
            
            const reader = new FileReader();
            reader.onload = function(e) {
              const content = e.target.result.split(',')[1];
              
              google.script.run
                .withSuccessHandler(function(result) {
                  statusDiv.innerHTML = '<span class="success">Upload successful!</span>';
                  setTimeout(function() {
                    google.script.host.close();
                  }, 1000);
                })
                .withFailureHandler(function(error) {
                  statusDiv.innerHTML = '<span class="error">Error: ' + error.message + '</span>';
                })
                .processFileUpload({
                  content: content,
                  name: file.name,
                  mimeType: file.type,
                  insertIndex: slidePos - 1  // Convert to 0-based index
                });
            };
            
            reader.onerror = function(error) {
              statusDiv.innerHTML = '<span class="error">Error reading file</span>';
            };
            
            reader.readAsDataURL(file);
          }
        </script>
      </body>
    </html>
  `)
    .setWidth(400)
    .setHeight(250);
  
  ui.showModalDialog(html, 'Upload Presentation');
}

function processFileUpload(fileData) {
  try {
    const blob = Utilities.newBlob(
      Utilities.base64Decode(fileData.content), 
      fileData.mimeType, 
      fileData.name
    );
    
    const targetPresentation = SlidesApp.getActivePresentation();
    const insertIndex = fileData.insertIndex;
    Logger.log(`Inserting slides after index ${insertIndex}`);
    
    // Create temporary file and convert to Google Slides
    const tempFile = DriveApp.createFile(blob);
    const newSlides = Drive.Files.copy(
      { 
        title: fileData.name.replace('.pptx', ''),
        mimeType: 'application/vnd.google-apps.presentation'
      },
      tempFile.getId(),
      { convert: true }
    );
    
    // Clean up temporary file
    tempFile.setTrashed(true);
    
    // Get the converted presentation
    const sourcePresentation = SlidesApp.openById(newSlides.id);
    const sourceSlides = sourcePresentation.getSlides();
    
    // Insert each slide after the selected slide
    let currentIndex = insertIndex;
    sourceSlides.forEach(sourceSlide => {
      Logger.log(`Inserting slide at index ${currentIndex}`);
      targetPresentation.insertSlide(currentIndex, sourceSlide);
      currentIndex++;
    });
    
    // Clean up the converted presentation
    DriveApp.getFileById(newSlides.id).setTrashed(true);
    
    return { success: true };
    
  } catch (error) {
    Logger.log("Upload error: " + error.message);
    throw new Error("Failed to process upload: " + error.message);
  }
}