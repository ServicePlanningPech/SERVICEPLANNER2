function showMarkdownEditorDialog() {
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
          input, textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
          }
          textarea {
            height: 200px;
            font-family: monospace;
            resize: vertical;
          }
          .button-group {
            display: flex;
            gap: 10px;
            margin-top: 15px;
          }
          button {
            flex: 1;
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
          button:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
          }
          button.secondary {
            background-color: #617d98;
          }
          button.secondary:hover {
            background-color: #4f677f;
          }
          #status {
            margin-top: 10px;
            text-align: center;
          }
          .error { color: red; }
          .success { color: green; }
          .progress { color: #666; }
          .help-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
          }
          .help-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 80%;
            max-height: 80%;
            overflow-y: auto;
          }
          .help-content h3 {
            margin-top: 0;
          }
          .close-help {
            position: absolute;
            top: 10px;
            right: 10px;
            cursor: pointer;
            font-size: 20px;
          }
          code {
            background: #f5f5f5;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <form id="markdownForm">
            <div class="form-group">
              <label for="slideNumber">Insert at Position:</label>
              <input type="number" 
                     id="slideNumber" 
                     value="${lastSlideIndex}"
                     min="1" 
                     max="${lastSlideIndex}">
            </div>
            <div class="form-group">
              <label for="markdownInput">Markdown Text:</label>
              <textarea id="markdownInput" placeholder="Enter your markdown text here..."></textarea>
            </div>
            <div class="button-group">
              <button type="button" onclick="createSlide()" class="primary">Create Slide</button>
              <button type="button" onclick="showHelp()" class="secondary">Help</button>
            </div>
            <div id="status"></div>
          </form>
        </div>

        <div id="helpModal" class="help-modal">
          <div class="help-content">
            <span class="close-help" onclick="hideHelp()">&times;</span>
            <h3>Markdown Reference</h3>
            <p><strong>Headings:</strong></p>
            <code># Heading 1</code><br>
            <code>## Heading 2</code><br>
            <code>### Heading 3</code>
            
            <p><strong>Text Styling:</strong></p>
            <code>**Bold text**</code><br>
            <code>*Italic text*</code><br>
            <code>__Underlined text__</code>
            
            <p><strong>Lists:</strong></p>
            <p>Bulleted list:</p>
            <code>* Item 1</code><br>
            <code>* Item 2</code><br>
            <code>  * Subitem 2.1</code>
            
            <p>Numbered list (decimal):</p>
            <code>1. First item</code><br>
            <code>2. Second item</code><br>
            <code>   1. Subitem</code>
            
            <p>Numbered list (roman):</p>
            <code>I. First item</code><br>
            <code>II. Second item</code><br>
            <code>   i. Subitem</code>
            
            <p><strong>Example:</strong></p>
            <pre>
# Slide Title
## Subtitle

**Important Points:**
* First point
* Second point
  * Subpoint A
  * Subpoint B

1. Numbered item
2. Another item
   i. Roman subitem
   ii. Another subitem</pre>
          </div>
        </div>

        <script>
          function createSlide() {
            const markdownText = document.getElementById('markdownInput').value;
            const slideNumber = document.getElementById('slideNumber').value;
            const statusDiv = document.getElementById('status');
            const submitButton = document.querySelector('button.primary');
            
            if (!markdownText.trim()) {
              statusDiv.innerHTML = '<span class="error">Please enter some markdown text</span>';
              return;
            }
            
            statusDiv.innerHTML = '<span class="progress">Creating slide...</span>';
            submitButton.disabled = true;
            
            google.script.run
              .withSuccessHandler(function(result) {
                if (result.success) {
                  statusDiv.innerHTML = '<span class="success">Slide created successfully!</span>';
                  setTimeout(function() {
                    google.script.host.close();
                  }, 1000);
                } else {
                  statusDiv.innerHTML = '<span class="error">Error: ' + (result.error || 'Unknown error') + '</span>';
                  submitButton.disabled = false;
                }
              })
              .withFailureHandler(function(error) {
                statusDiv.innerHTML = '<span class="error">Error: ' + (error.message || error) + '</span>';
                submitButton.disabled = false;
              })
              .processMarkdown({
                markdown: markdownText,
                insertIndex: parseInt(slideNumber) - 1
              });
          }
          
          function showHelp() {
            document.getElementById('helpModal').style.display = 'block';
          }
          
          function hideHelp() {
            document.getElementById('helpModal').style.display = 'none';
          }
          
          // Close help modal when clicking outside
          window.onclick = function(event) {
            const modal = document.getElementById('helpModal');
            if (event.target === modal) {
              modal.style.display = 'none';
            }
          }
        </script>
      </body>
    </html>
  `)
    .setWidth(500)
    .setHeight(450);
  
  ui.showModalDialog(html, 'Markdown Editor');
}

function processMarkdown(data) {
  try {
    const presentation = SlidesApp.getActivePresentation();
    const slide = presentation.insertSlide(data.insertIndex);
    const pageWidth = presentation.getPageWidth();
    const pageHeight = presentation.getPageHeight();
    
    const lines = data.markdown.split('\n');
    let currentY = 20;
    let listLevel = 0;
    let listCounter = 1;
    let romanCounter = 1;
    
    const TAB_WIDTH = 40;
    const BLANK_LINE_HEIGHT = 32;

    function processStyles(text, textRange) {
      // Create a map to store style information
      const styleMap = new Map();
      let processedText = text;
      
      // Process bold text (**text**)
      processedText = processedText.replace(/\*\*(.+?)\*\*/g, (match, content, offset) => {
        styleMap.set(offset, { length: content.length, type: 'bold', content });
        return content;
      });
      
      // Process italic text (*text*)
      processedText = processedText.replace(/\*([^*]+?)\*/g, (match, content, offset) => {
        styleMap.set(offset, { length: content.length, type: 'italic', content });
        return content;
      });
      
      // Process underlined text (__text__)
      processedText = processedText.replace(/__(.+?)__/g, (match, content, offset) => {
        styleMap.set(offset, { length: content.length, type: 'underline', content });
        return content;
      });
      
      // Apply styles
      for (const [offset, style] of styleMap.entries()) {
        const range = textRange.getRange(offset, offset + style.length);
        switch (style.type) {
          case 'bold':
            range.getTextStyle().setBold(true);
            break;
          case 'italic':
            range.getTextStyle().setItalic(true);
            break;
          case 'underline':
            range.getTextStyle().setUnderline(true);
            break;
        }
      }
      
      return processedText;
    }

    // Helper function to determine if a line is a bullet point
    function parseBulletPoint(line) {
      const trimmedLine = line.trim();
      // Check for bullet point markers at the start of the line
      const bulletMatch = trimmedLine.match(/^([*-]|(\d+\.)|([IVXivx]+\.))\s+(.+)$/);
      
      if (bulletMatch) {
        const [, marker, , , content] = bulletMatch;
        return {
          isBullet: true,
          marker,
          content: content.trim(),
          indent: line.search(/\S/)
        };
      }
      
      return { isBullet: false };
    }
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        currentY += BLANK_LINE_HEIGHT;
        return;
      }
      
      if (trimmedLine.startsWith('#')) {
        // Handle headings
        const level = trimmedLine.match(/^#+/)[0].length;
        const text = trimmedLine.replace(/^#+\s*/, '');
        const fontSize = [40, 32, 24][Math.min(level - 1, 2)];
        
        const textBox = slide.insertTextBox(text, 40, currentY, pageWidth - 80, fontSize * 1.5);
        const textRange = textBox.getText();
        
        const processedText = processStyles(text, textRange);
        if (processedText !== text) {
          textBox.getText().setText(processedText);
        }
        
        textRange.getTextStyle()
          .setFontSize(fontSize)
          .setFontFamily('Arial')
          .setBold(true);
        
        textRange.getParagraphStyle()
          .setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER)
          .setLineSpacing(100);
        
        currentY += fontSize * 1.5;
        listLevel = 0;
        
      } else {
        // Check if this is a bullet point
        const bulletInfo = parseBulletPoint(line);
        
        if (bulletInfo.isBullet) {
          // Handle bullet points
          const newLevel = Math.floor(bulletInfo.indent / 2);
          let bulletText;
          
          if (bulletInfo.marker === '*' || bulletInfo.marker === '-') {
            bulletText = '•';
          } else if (bulletInfo.marker.match(/^\d+\./)) {
            bulletText = `${listCounter}.`;
            listCounter++;
          } else {
            bulletText = bulletInfo.marker;
            romanCounter++;
          }
          
          const baseIndent = 40 + (newLevel * TAB_WIDTH);
          const textHeight = Math.ceil(bulletInfo.content.length / ((pageWidth - baseIndent - 80) / 20)) * 35;
          
          const textBox = slide.insertTextBox(
            `${bulletText}\t${bulletInfo.content}`,
            baseIndent,
            currentY,
            pageWidth - baseIndent - 40,
            Math.max(50, textHeight)
          );
          
          const textRange = textBox.getText();
          const processedText = processStyles(bulletInfo.content, textRange);
          if (processedText !== bulletInfo.content) {
            textBox.getText().setText(`${bulletText}\t${processedText}`);
          }
          
          textRange.getTextStyle()
            .setFontSize(32)
            .setFontFamily('Arial');
          
          textRange.getParagraphStyle()
            .setIndentStart(TAB_WIDTH)
            .setLineSpacing(100);
          
          currentY += Math.max(50, textHeight);
          
        } else {
          // Handle regular text
          const textHeight = Math.ceil(trimmedLine.length / ((pageWidth - 120) / 20)) * 35;
          
          const textBox = slide.insertTextBox(
            trimmedLine,
            40,
            currentY,
            pageWidth - 80,
            Math.max(50, textHeight)
          );
          
          const textRange = textBox.getText();
          const processedText = processStyles(trimmedLine, textRange);
          if (processedText !== trimmedLine) {
            textBox.getText().setText(processedText);
          }
          
          textRange.getTextStyle()
            .setFontSize(32)
            .setFontFamily('Arial');
          
          textRange.getParagraphStyle()
            .setLineSpacing(100);
          
          currentY += Math.max(50, textHeight);
        }
      }
    });
    
    return { success: true };
    
  } catch (error) {
    Logger.log("Markdown processing error: " + error.message);
    return { 
      success: false, 
      error: error.message 
    };
  }
}
