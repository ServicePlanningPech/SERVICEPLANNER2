function onOpen() {
  SlidesApp.getUi()
    .createMenu('Planner Tools')
    .addItem('Add Scripture Slides', 'showScriptureDialog')
    .addItem('Insert Slides from File', 'showFilePickerDialog')
    .addItem('Upload Image', 'showImageUploadDialog')  // New menu item
    .addItem('Markdown Editor', 'showMarkdownEditorDialog')
    .addToUi();
}

// Settings management
function getSettings() {
  try {
    const settingsId = findSettingsSpreadsheet();
    const ss = SpreadsheetApp.openById(settingsId);
    const sheet = ss.getSheets()[0];
    
    const data = sheet.getDataRange().getValues();
    const settings = {};
    
    // Start from row 1 (skipping header)
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) { // Only add if key exists
        settings[data[i][0]] = data[i][1];
      }
    }
    
    return settings;
    
  } catch (error) {
    Logger.log("Error getting settings: " + error.message);
    throw new Error("Failed to load settings: " + error.message);
  }
}

function findSettingsSpreadsheet() {
  const settingsFileName = "ServicePlanner2Settings";
  const userProps = PropertiesService.getUserProperties();
  const storedSettingsId = userProps.getProperty("Planner2Settings");
  
  // Check if we have a stored settings ID and if that file still exists
  if (storedSettingsId) {
    try {
      const file = DriveApp.getFileById(storedSettingsId);
      if (file) {
        Logger.log("Found settings file using stored ID");
        return storedSettingsId;
      }
    } catch (error) {
      Logger.log("Stored settings file ID no longer valid");
    }
  }
  
  // Search in user's Drive
  let files = DriveApp.getFilesByName(settingsFileName);
  if (files.hasNext()) {
    const settingsFile = files.next();
    const settingsId = settingsFile.getId();
    userProps.setProperty("Planner2Settings", settingsId);
    Logger.log("Found settings file in Drive and stored ID");
    return settingsId;
  }
  
  // Search in files shared with user
  const query = `title = '${settingsFileName}' and mimeType = '${MimeType.GOOGLE_SHEETS}'`;
  files = DriveApp.searchFiles(query);
  if (files.hasNext()) {
    const settingsFile = files.next();
    const settingsId = settingsFile.getId();
    userProps.setProperty("Planner2Settings", settingsId);
    Logger.log("Found settings file in shared files and stored ID");
    return settingsId;
  }
  
  throw new Error("Settings file not found. Please ensure the ServicePlanner2Settings spreadsheet exists and is shared with you.");
}

function getSelectedSlideIndex() {
  const presentation = SlidesApp.getActivePresentation();
  const slides = presentation.getSlides();
  
  // Default to last slide if we can't determine a specific slide
  const lastIndex = slides.length - 1;
  
  try {
    const selection = presentation.getSelection();
    const selectionType = selection.getSelectionType();
    
    Logger.log(`Selection type: ${selectionType}`);
    
    // If a slide or page element is selected, try to get the current page
    if (selectionType === SlidesApp.SelectionType.SLIDE || 
        selectionType === SlidesApp.SelectionType.PAGE_ELEMENT) {
      const selectedPage = selection.getCurrentPage();
      
      if (selectedPage) {
        const index = slides.indexOf(selectedPage);
        if (index !== -1) {
          Logger.log(`Found selected slide index: ${index}`);
          return index;
        }
      }
    }
  } catch (e) {
    Logger.log(`Error in slide selection: ${e.toString()}`);
  }
  
  // Fallback to last slide
  Logger.log(`Defaulting to last slide index: ${lastIndex}`);
  return lastIndex;
}

