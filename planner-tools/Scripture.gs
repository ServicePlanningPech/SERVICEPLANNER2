function showScriptureDialog() {
  const ui = SlidesApp.getUi();
  const presentation = SlidesApp.getActivePresentation();
  const lastSlideIndex = presentation.getSlides().length + 1;
  
  // Create HTML dialog with compact styling
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
          input, select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
          }
          .checkbox-group { 
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
          }
          .checkbox-group label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: normal;
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
          #status {
            margin-top: 10px;
            text-align: center;
            color: red;
          }
          .inline-group {
            display: flex;
            gap: 10px;
          }
          .inline-group > * {
            flex: 1;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <form id="scriptureForm">
            <div class="form-group">
              <label for="scriptureRef">Scripture Reference:</label>
              <input type="text" id="scriptureRef" 
                     placeholder="e.g., John 3:16">
            </div>
            <div class="inline-group">
              <div class="form-group">
                <label for="bibleVersion">Version:</label>
                <select id="bibleVersion">
                  <option value="NIV(UK)" selected>NIV(UK)</option>
                   <option value="NIV">NIV</option>
                  <option value="ESV">ESV</option>
                  <option value="KJV">KJV</option>
                  <option value="NKJV">NKJV</option>
                </select>
              </div>
              <div class="form-group">
                <label for="slideNumber">Slide Position:</label>
                <input type="number" id="slideNumber" 
                       value="${lastSlideIndex}" 
                       min="1" 
                       max="${lastSlideIndex + 1}">
              </div>
            </div>
            <div class="checkbox-group">
              <label>
                <input type="checkbox" id="boldText" checked> 
                Bold
              </label>
              <label>
                <input type="checkbox" id="italicText"> 
                Italic
              </label>
            </div>
            <button type="button" onclick="submitForm()">Create Slides</button>
            <div id="status"></div>
          </form>
        </div>
        
        <script>
          function submitForm() {
            const ref = document.getElementById('scriptureRef').value.trim();
            const slideNumber = document.getElementById('slideNumber').value;
            
            if (!ref) {
              document.getElementById('status').textContent = 'Please enter a scripture reference';
              return;
            }
            
            const options = {
              reference: ref,
              slideNumber: parseInt(slideNumber) - 1, // Convert to 0-based index
              version: document.getElementById('bibleVersion').value,
              bold: document.getElementById('boldText').checked,
              italic: document.getElementById('italicText').checked
            };
            
            google.script.run
              .withSuccessHandler(function() {
                google.script.host.close();
              })
              .withFailureHandler(function(error) {
                document.getElementById('status').textContent = error.message;
              })
              .processScriptureRequest(options);
          }
        </script>
      </body>
    </html>
  `)
  .setWidth(400)
  .setHeight(350);
  
  ui.showModalDialog(html, 'Add Scripture Slides');
}

function processScriptureRequest(options) {
  const ui = SlidesApp.getUi();
  
  try {
    const settings = getSettings();
    if (!settings.apiKey) {
      throw new Error('API key not found in settings');
    }
    
    const scriptureText = getScriptureText(options.reference, options.version);
    if (scriptureText) {
      createScriptureSlides(scriptureText, options.reference, 
                          options.version,
                          options.bold, options.italic,
                          options.slideNumber);
      ui.alert('Success', 'Scripture slides created successfully', ui.ButtonSet.OK);
    }
  } catch (error) {
    throw new Error('Failed to create scripture slides: ' + error.message);
  }
}



function getScriptureText(scriptureRef, version) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const settings = getSettings();
  const prompt = `Show ${scriptureRef} from the ${version} Bible version. Show only verse text without verse numbers or any other text.I want you to return only the scripture text, nothing else`;
  
  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7
  };
  
  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + settings.apiKey,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());
  
  if (response.getResponseCode() !== 200) {
    throw new Error('API request failed: ' + json.error?.message || 'Unknown error');
  }
  
  return json.choices[0].message.content.trim();
}

function createScriptureSlides(text, reference, version, bold, italic, insertIndex) {
 const presentation = SlidesApp.getActivePresentation();
 Logger.log(`Starting to create scripture slides at index: ${insertIndex}`);
 
 
 // Get page dimensions
 const pageWidth = presentation.getPageWidth();
 const pageHeight = presentation.getPageHeight();
 
 // Calculate margins
 const horizontalMargin = pageWidth * 0.05;
 const topMargin = pageHeight * 0.05;
 const textBoxWidth = pageWidth - (horizontalMargin * 2);
 const textBoxHeight = pageHeight - (topMargin * 2);
 
 // Split into segments at sentence endings AND semi-colons
 // Matches text followed by .!?; and preserves the punctuation
 const segments = text.match(/[^.!?;]+[.!?;]+/g) || [text];
 
 // Clean up segments and handle quotes
 const cleanSegments = segments.map(segment => {
   let trimmed = segment.trim();
   
   // Count quotes to check if we have an unmatched quote
   const quoteCount = (trimmed.match(/['"]/g) || []).length;
   
   // If segment ends with a quote, include it with next segment
   if (quoteCount % 2 !== 0 && trimmed.endsWith('"') || trimmed.endsWith("'")) {
     trimmed = trimmed.slice(0, -1);
   }
   
   // If segment starts with just a quote, combine with previous segment
   if (/^['"]$/.test(trimmed)) {
     return null;  // We'll filter these out later
   }
   
   return trimmed;
 }).filter(Boolean);  // Remove any null segments
 
 // Calculate words per segment and total words
 const segmentData = cleanSegments.map(segment => ({
   text: segment.trim(),
   wordCount: segment.trim().split(/\s+/).length
 }));
 
 const totalWords = segmentData.reduce((sum, s) => sum + s.wordCount, 0);
 const wordsPerSlide = 45; // target words per slide
 const targetSlides = Math.max(1, Math.ceil(totalWords / wordsPerSlide));
 
 // Group segments into slides
 const slides = [];
 let currentSlide = [];
 let currentWordCount = 0;
 let targetWordsForThisSlide = Math.floor(totalWords / targetSlides);
 let pendingQuote = '';  // Store any pending quote marks
 
 segmentData.forEach((segment, index) => {
   let textToAdd = pendingQuote + segment.text;
   pendingQuote = '';  // Reset pending quote
   
   // Check for unmatched quotes in this segment
   const quoteCount = (textToAdd.match(/['"]/g) || []).length;
   if (quoteCount % 2 !== 0) {
     // If this segment will start a new slide, keep quotes together
     if (currentWordCount + segment.wordCount > targetWordsForThisSlide * 1.5 && 
         currentSlide.length > 0 && 
         slides.length < targetSlides - 1) {
       // Find the last quote mark
       const lastQuoteMatch = textToAdd.match(/['"](?=[^'"]*$)/);
       if (lastQuoteMatch) {
         pendingQuote = textToAdd.slice(lastQuoteMatch.index);
         textToAdd = textToAdd.slice(0, lastQuoteMatch.index);
       }
     }
   }
   
   if (currentWordCount + segment.wordCount > targetWordsForThisSlide * 1.5 && 
       currentSlide.length > 0 && 
       slides.length < targetSlides - 1) {
     slides.push(currentSlide.join(' '));
     currentSlide = [textToAdd];
     currentWordCount = segment.wordCount;
     
     const remainingWords = segmentData.slice(index + 1)
       .reduce((sum, s) => sum + s.wordCount, 0) + segment.wordCount;
     const remainingSlides = targetSlides - slides.length;
     targetWordsForThisSlide = Math.floor(remainingWords / remainingSlides);
   } else {
     currentSlide.push(textToAdd);
     currentWordCount += segment.wordCount;
   }
 });
 
 // Add remaining content as last slide
 if (currentSlide.length > 0) {
   slides.push(currentSlide.join(' ') + pendingQuote);  // Include any pending quote
 }
 
 // Create actual slides
 
 const totalSlides = slides.length;
 Logger.log(`Creating ${totalSlides} slides starting at index ${insertIndex}`);
 
 slides.forEach((slideText, index) => {
   Logger.log(`Creating slide ${index + 1} of ${totalSlides}`);
   const slide = presentation.insertSlide(insertIndex + index);
   
   // Create text box starting from top margin
   const textBox = slide.insertTextBox(
     slideText, 
     horizontalMargin,
     topMargin,
     textBoxWidth,
     textBoxHeight
   );
   
   const textRange = textBox.getText();
   const textStyle = textRange.getTextStyle();
   textStyle.setFontFamily('Calibri')
           .setFontSize(44)
           .setForegroundColor('#000000')
           .setBold(bold)
           .setItalic(italic);
   
   textRange.getParagraphStyle()
           .setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER)
           .setLineSpacing(115);
   
   // Only add reference on last slide
   if (index === totalSlides - 1) {
     const referenceText = `[${reference} ${version}]`;
     const referenceBox = slide.insertTextBox(
       referenceText,
       horizontalMargin,
       pageHeight - topMargin - 40,
       textBoxWidth,
       40
     );
     
     const referenceRange = referenceBox.getText();
     const referenceStyle = referenceRange.getTextStyle();
     referenceStyle.setFontFamily('Calibri')
                  .setFontSize(22)
                  .setForegroundColor('#000000')
                  .setItalic(true)
                  .setBold(false);
     
     referenceRange.getParagraphStyle()
                  .setParagraphAlignment(SlidesApp.ParagraphAlignment.CENTER);
     referenceBox.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE);
   }
 });
}
