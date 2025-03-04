function doGet(e) {
  Logger.log("Service Planner Started");
  const authResult = checkUserAuthorization();
  
  if (!authResult.authorized) {
    return HtmlService.createHtmlOutput(`
      <h3>Access Denied</h3>
      <p>${authResult.message}</p>
      <p>Please contact your administrator for access.</p>
    `)
    .setTitle('Service Planner - Access Denied');
  }

  // Clear any existing cache entries
  try {
    const cache = CacheService.getUserCache();
    cache.removeAll(['planner2Settings', 'planner2Debug']);
  } catch (error) {
    Logger.log("Error clearing cache: " + error.message);
  }

  // Get fresh settings and set in cache
  try {
    const settings = getSettings();
    const cache = CacheService.getUserCache();
    
    // Cache the full settings object
    cache.put('planner2Settings', JSON.stringify(settings), 21600); // 6 hours
    
    // Cache the debug setting separately
    const debugValue = settings.Debug || 'no';
    cache.put('planner2Debug', debugValue, 21600);
  } catch (error) {
    Logger.log("Error setting up cache: " + error.message);
    // Ensure debug is off if there's an error
    try {
      const cache = CacheService.getUserCache();
      cache.put('planner2Debug', 'no', 21600);
    } catch (cacheError) {
      Logger.log("Error setting debug cache: " + cacheError.message);
    }
  }
   
  return HtmlService.createTemplateFromFile('main')
    .evaluate()
    .setTitle('Service Planner2')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function checkUserAuthorization() {
  try {
    // Get user's email
    const userEmail = Session.getActiveUser().getEmail();
    if (!userEmail) {
      return {
        authorized: false,
        message: "Could not determine user email"
      };
    
    }
     Logger.log('User: ' + userEmail + ' invoked ServicePlanner2');
    // Get settings to find distribution list
    const settings = getSettings();
    const emailDistId = settings.EmailDistId;
    
    if (!emailDistId) {
      return {
        authorized: false,
        message: "Email distribution list not configured in settings"
      };
    }
    
    // Get distribution list sheet
    const sheet = SpreadsheetApp.openById(emailDistId).getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // Skip header row, look for authorized emails in column 4 (index 3)
    const authorizedEmails = data.slice(1)
      .filter(row => row[3] === true)  // Check authorization checkboxes
      .map(row => row[1].toLowerCase());  // Get email addresses and convert to lowercase
    
    // Check if user's email is authorized
    const isAuthorized = authorizedEmails.includes(userEmail.toLowerCase());
    
    return {
      authorized: isAuthorized,
      message: isAuthorized ? "Authorized" : "You are not authorized to use the Service Planner"
    };
  } catch (error) {
    debugLog("Authorization check error: " + error.message);
    return {
      authorized: false,
      message: "Error checking authorization: " + error.message
    };
  }
}

function include(filename) {
   return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

function getScriptUrl() {
   return ScriptApp.getService().getUrl();
}

function getServicePlansFolder() {
  debugLog(`Getting service plans folder for ${DriveApp.getRootFolder().getName()}`);
  
  // Search for SERVICE PLANS folder in user's root Drive
  const folderName = "SERVICE PLANS";
  const rootFolders = DriveApp.getRootFolder().getFolders();
  let servicePlanFolder = null;
  // Look for existing folder only in root directory
  while (rootFolders.hasNext()) {
    const folder = rootFolders.next();
    if (folder.getName() === folderName) {
       servicePlanFolder = folder;
    }
  }
  
  // If folder not found, create it
  if (!servicePlanFolder) {
    debugLog("Creating new SERVICE PLANS folder");
    servicePlanFolder = DriveApp.createFolder(folderName);
    
    // Set sharing permissions - anyone with link can view
    if (getSettings().SharePlans === "yes") {
      try {
        servicePlanFolder.setSharing(
          DriveApp.Access.ANYONE_WITH_LINK, 
          DriveApp.Permission.VIEW
        );
        
        debugLog("Set sharing permissions for new folder");
      } catch (error) {
        debugLog("Error setting folder permissions: " + error.message);
        throw new Error("Failed to set folder permissions: " + error.message);
      }
    }
  }
  
  return servicePlanFolder;
}

function createNewPlan(date, type) {
  debugLog("Creating new plan for date: " + date + ", type: " + type);
  
  // Create folder structure
  const mainFolder = getServicePlansFolder();
  const folderName = `ServicePlan-Draft-${date}-${type}`; // Changed prefix
  const planFolder = mainFolder.createFolder(folderName);
  
  // Create initial service plan data
  const initialData = {
    orderOfService: [],
    comments: '',
    extraComments: '',
    extraEmails: '',
    date: date,
    type: type
    // Removed status field from JSON
  };

  // Create JSON file
  const jsonFile = planFolder.createFile(
    `ServiceOrder-${date}-${type}.json`,
    JSON.stringify(initialData, null, 2),
    "application/json"
  );
  
  debugLog("Created new plan in folder: " + planFolder.getId());
  return {
    folderId: planFolder.getId()
  };
}

function getServicePlans() {
  const mainFolder = getServicePlansFolder();
  const plans = [];
  
  // Get all subfolders that match our naming pattern
  const folders = mainFolder.getFolders();
  
  while (folders.hasNext()) {
    const folder = folders.next();
    const folderName = folder.getName();
    
    // Only process folders that start with ServicePlan
    if (folderName.startsWith('ServicePlan-')) {
      // Extract status from folder name (between first and second dash)
      const nameParts = folderName.split('-');
      if (nameParts.length >= 4) {
        const status = nameParts[1]; // Draft or Published
        const dateMatch = folderName.match(/(\d{2}-\d{2}-\d{4})/);
        const typeMatch = folderName.match(/-([^-]+)$/);
        
        if (dateMatch && typeMatch) {
          plans.push({
            id: folder.getId(),
            name: folderName,
            date: dateMatch[1],
            type: typeMatch[1],
            status: status,
            lastModified: folder.getLastUpdated().toISOString()
          });
        }
      }
    }
  }
  
  // Sort by date descending
  plans.sort((a, b) => {
    const dateA = new Date(a.date.split('-').reverse().join('-'));
    const dateB = new Date(b.date.split('-').reverse().join('-'));
    return dateB - dateA;
  });
  
  return plans;
}

function deletePlan(folderId) {
  debugLog("Deleting plan folder: " + folderId);
  const folder = DriveApp.getFolderById(folderId);
  folder.setTrashed(true);
  return true;
}

function saveOrder(jsonFileId, serviceOrder) {
 
  try {
    const file = DriveApp.getFileById(jsonFileId);
    if (!file) {
      debugLog("ERROR: Could not find JSON file");
      throw new Error("Could not find service order file");
    }

    // Add date and type from filename
    const fileName = file.getName(); // Format: ServiceOrder-DD-MM-YYYY-Type.json
    const dateMatch = fileName.match(/(\d{2}-\d{2}-\d{4})/);
    const typeMatch = fileName.match(/-([^-]+)\.json$/);
    
     if (serviceOrder.orderOfService) {
      serviceOrder.orderOfService = serviceOrder.orderOfService.map(item => {
        return {
          type: item.type,
          detail: item.detail,
          link: item.link,
          slides: item.slides,
          blankBefore: item.blankBefore,
          blankAfter: item.blankAfter,
          tUrls: item.tUrls || [] // Explicitly include tUrls
        };
      });
    }

    const updatedOrder = {
      ...serviceOrder,
      date: dateMatch ? dateMatch[1] : '',
      type: typeMatch ? typeMatch[1] : ''
    };

    debugLog(`Saving service order with ${serviceOrder.orderOfService?.length || 0} items`);
    file.setContent(JSON.stringify(updatedOrder, null, 2));
    
    return true;
    
  } catch (e) {
    debugLog("ERROR saving service order: " + e.message);
    throw new Error("Failed to save service order: " + e.message);
  }
}

// In Code.js, update loadServiceOrder:
function loadServiceOrder(folderId) {
  const folder = DriveApp.getFolderById(folderId);
  
  // Find the JSON file in the folder
  const files = folder.getFiles();
  let jsonFile = null;
  
  while (files.hasNext()) {
    const file = files.next();
    if (file.getName().startsWith('ServiceOrder-') && file.getName().endsWith('.json')) {
      jsonFile = file;
      break;
    }
  }
  
  if (!jsonFile) {
    debugLog("ERROR: Service order JSON file not found");
    return null;
  }
  
  try {
    const content = jsonFile.getBlob().getDataAsString();
    const serviceOrder = JSON.parse(content);
    
    // Add the JSON file ID to the response
    serviceOrder.jsonFileId = jsonFile.getId();

    // Just ensure tUrls arrays exist (we'll use the stored ones)
    if (serviceOrder.orderOfService && Array.isArray(serviceOrder.orderOfService)) {
      for (let item of serviceOrder.orderOfService) {
        if (!item.tUrls) {
          item.tUrls = [];
        }
        // Log items with thumbnails
        if (item.tUrls && item.tUrls.length > 0) {
          debugLog(`Loaded item ${item.detail} with ${item.tUrls.length} thumbnails`);
        }
      }
    }
    
    return serviceOrder;
    
  } catch (e) {
    debugLog("Error reading service order: " + e.message);
    return null;
  }
}


function fileUploader(fileData, filename, planFolderId, type) {
  debugLog(`Uploading ${type} file to folder: ${planFolderId}`);
  
  try {    
    // Create blob from base64 data if we have fileData
    let blob = null;
    if (fileData && fileData.content) {
      const bytes = Utilities.base64Decode(fileData.content);
      blob = Utilities.newBlob(bytes, fileData.mimeType, fileData.name);
    }
    debugLog('blob created');
    
    switch (type) {
      case 'powerpoint':
        return handlePowerPointUpload(blob, filename, planFolderId);
      case 'image':
        return handleImageUpload(blob, filename, planFolderId);
 
      default:
        throw new Error('Invalid upload type');
    }
  } catch (error) {
    debugLog("Upload error: " + error.message);
    throw error;
  }
}

function handlePowerPointUpload(file, filename, folderId) {
  // Upload PPTX and convert to Google Slides
  const folder = DriveApp.getFolderById(folderId);
  const newFile = folder.createFile(file);
  debugLog('pptx file created from blob');

   Utilities.sleep(2000); // Time delay to ensure file created ok
  
  const slideFile = Drive.Files.copy(
    { title: filename.replace('.pptx', ''), 
    parents: [{ id: folder.getId() }],
    mimeType: 'application/vnd.google-apps.presentation' 
    },
    newFile.getId(),
    { convert: true }
  );
  
  // Clean up original PPTX
  newFile.setTrashed(true);
  debugLog('Slides file created from pptx');

  // Get thumbnails immediately after creating slides
  const thumbnailUrls = getThumbnailUrls(slideFile.id);
  debugLog(`Generated ${thumbnailUrls?.length || 0} thumbnails for new presentation`);
  
  return {
    success: true,
    fileId: slideFile.id,
    url: `https://docs.google.com/presentation/d/${slideFile.id}/preview`,
    thumbnailUrls: thumbnailUrls
  };
}

function handleImageUpload(file, filename, folderId) {
  // Upload image file
  const folder = DriveApp.getFolderById(folderId);
  const imageFile = folder.createFile(file);
  
  // Create new presentation
  const presentation = SlidesApp.create(filename.replace(/\.[^/.]+$/, ''));
  const presentationFile = DriveApp.getFileById(presentation.getId());
  presentationFile.moveTo(folder);
  
  // Add image to slide
  const slide = presentation.getSlides()[0];
  const image = slide.insertImage(imageFile);
  
  // Center and resize image
  const slideWidth = presentation.getPageWidth();
  const slideHeight = presentation.getPageHeight();
  const imageWidth = image.getWidth();
  const imageHeight = image.getHeight();
  
  const scale = Math.min(
    (slideWidth * 0.9) / imageWidth,
    (slideHeight * 0.9) / imageHeight
  );
  
  image.setWidth(imageWidth * scale)
       .setHeight(imageHeight * scale)
       .setLeft((slideWidth - (imageWidth * scale)) / 2)
       .setTop((slideHeight - (imageHeight * scale)) / 2);
  
  presentation.saveAndClose();
  
  // Get thumbnails immediately after creating the presentation
  const thumbnailUrls = getThumbnailUrls(presentation.getId());
  debugLog(`Generated ${thumbnailUrls?.length || 0} thumbnails for new image presentation`);

  return {
    success: true,
    fileId: presentation.getId(),
    url: `https://docs.google.com/presentation/d/${presentation.getId()}/preview`,
    thumbnailUrls: thumbnailUrls
  };
}

// Get available slide templates
function getSlideTemplates() {
  const settings = getSettings();
  const templateFolderId = settings.SlideTemplateId;
  
  if (!templateFolderId) {
    return [];
  }
  
  try {
    const folder = DriveApp.getFolderById(templateFolderId);
    const files = folder.getFiles();
    const templates = [];
    
    while (files.hasNext()) {
      const file = files.next();
      if (file.getMimeType() === MimeType.GOOGLE_SLIDES) {
        templates.push({
          id: file.getId(),
          name: file.getName()
        });
      }
    }
    
    return templates;
  } catch (error) {
    debugLog("Error getting slide templates: " + error.message);
    return [];
  }
}

function createSlidePresentation(name, folderId, templateId = null) {
  debugLog(`Creating slide presentation: name=${name}, folder=${folderId}, template=${templateId}`);
  
  try {
    const folder = DriveApp.getFolderById(folderId);
    const settings = getSettings();
    const blankTemplateId = settings.BlankTemplateId;
    let presentation;
    let presentationFile;
    
    if (templateId) {
      // Use specified template if provided
      debugLog(`Using specified template: ${templateId}`);
      const templateFile = DriveApp.getFileById(templateId);
      presentationFile = templateFile.makeCopy(name);
      presentationFile.moveTo(folder);
      presentation = SlidesApp.openById(presentationFile.getId());
    } else if (blankTemplateId) {
      // Use blank template from settings
      debugLog(`Using blank template from settings: ${blankTemplateId}`);
      try {
        const templateFile = DriveApp.getFileById(blankTemplateId);
        if (!templateFile) {
          debugLog("Blank template file not found, falling back to creating new presentation");
          presentation = SlidesApp.create(name);
          presentationFile = DriveApp.getFileById(presentation.getId());
        } else {
          debugLog("Creating copy of blank template");
          presentationFile = templateFile.makeCopy(name);
          presentation = SlidesApp.openById(presentationFile.getId());
        }
      } catch (error) {
        debugLog(`Error using blank template: ${error.message}, falling back to creating new presentation`);
        presentation = SlidesApp.create(name);
        presentationFile = DriveApp.getFileById(presentation.getId());
      }
    } else {
      // Create new blank presentation
      debugLog("No templates specified, creating new presentation");
      presentation = SlidesApp.create(name);
      presentationFile = DriveApp.getFileById(presentation.getId());
    }
    
    // Move to destination folder if needed
    if (!templateId) { // Skip if using specified template as it's already moved
      debugLog("Moving presentation to destination folder");
      presentationFile.moveTo(folder);
    }

    debugLog(`Created presentation with ID: ${presentation.getId()}`);
    
    return {
      success: true,
      fileId: presentation.getId(),
      editUrl: `https://docs.google.com/presentation/d/${presentation.getId()}/edit`,
      thumbnailUrls: null
    };
    
  } catch (error) {
    debugLog(`Error creating slide presentation: ${error.message}`);
    throw new Error(`Failed to create slide presentation: ${error.message}`);
  }
}

// Modified getSongList to use settings
function getSongList() {
  debugLog("Getting song list from database");
  
  // Get settings
  const settings = getSettings();
  let songDatabaseId = settings.SongDatabaseId;
    
  if (!songDatabaseId) {
        throw new Error("No Song database Id found in ");
  }
  
  // Get songs from the folder
  const folder = DriveApp.getFolderById(songDatabaseId);
  const songs = [];
  const files = folder.getFiles();
  
  while (files.hasNext()) {
    const file = files.next();
    if (file.getMimeType() === MimeType.GOOGLE_SLIDES) {
      songs.push({
        name: file.getName(),
        id: file.getId()
      });
    }
  }
  
  debugLog("Found " + songs.length + " songs");
  return songs;
}

function debugLog(message) {
  
  try {
    // Check cache for debug setting
    const cache = CacheService.getUserCache();
    const debugSetting = cache.get('planner2Debug');
    
    // Return if no cache entry or debug is not 'yes'
    if (!debugSetting || debugSetting !== 'on') {
      return;
    }
    
    // If we get here, debug is enabled - proceed with logging
    let debugSheet;
    const debugFileName = "Service Planner2 Debug Log";
    let spreadsheet;
    
    const files = DriveApp.getFilesByName(debugFileName);
    if (files.hasNext()) {
      spreadsheet = SpreadsheetApp.open(files.next());
      debugSheet = spreadsheet.getSheets()[0];
    } else {
      spreadsheet = SpreadsheetApp.create(debugFileName);
      debugSheet = spreadsheet.getSheets()[0];
      debugSheet.getRange("A1:B1").setValues([["Time", "Message"]]);
      debugSheet.setFrozenRows(1);
    }
    
    const now = new Date();
    const timeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm:ss");
    
    debugSheet.appendRow([timeStr, message]);
    
  } catch (e) {
    Logger.log("Debug logging failed: " + e.toString());
    Logger.log("Original message: " + message);
  }
}



// Function to merge slides
function getSlideCount(presentationId) {
  const presentation = SlidesApp.openById(presentationId);
  const count = presentation.getSlides().length;
  debugLog(`Source presentation has ${count} slides`);
  return count;
}

function getThumbnailUrls(presentationId) {
  var base64Urls = [];
  const presentation = SlidesApp.openById(presentationId)
  const slides = presentation.getSlides();
  
  for (var i = 0; i < slides.length; i++) {
    var slide = slides[i];
    try {
      // Get the thumbnail URL
      var thumbnailUrl = getThumbnailUrl(presentationId, slide.getObjectId());
      
      // Fetch the image data and convert to base64
      var response = UrlFetchApp.fetch(thumbnailUrl);
      var imageBlob = response.getBlob();
      var base64String = Utilities.base64Encode(imageBlob.getBytes());
      var dataUrl = 'data:image/png;base64,' + base64String;
      
      base64Urls.push(dataUrl);
      } catch (error) {
      debugLog(`Error processing thumbnail ${i + 1}: ${error}`);
      // Push a placeholder for failed thumbnails
      base64Urls.push('');
    }
  }
   
  presentation.saveAndClose();
  return base64Urls;
}

// Helper function to get thumbnail URL from Slides API
function getThumbnailUrl(presentationId, pageId) {
  //Logger.log(`Getting thumbnail URL for slide ${pageId} in presentation ${presentationId}`);
  
  try {
    const response = Slides.Presentations.Pages.getThumbnail(
      presentationId,
      pageId
    );
    
    //Logger.log(`Successfully got thumbnail URL for slide ${pageId}`);
    return response.contentUrl;
  } catch (error) {
    Logger.log(`API Error: ${error.message}`);
    throw error;
  }
}

// Function to reorder slides
function reorderSlides(presentationId, newOrder) {
  debugLog("Reordering slides: " + JSON.stringify(newOrder));
  
  const presentation = SlidesApp.openById(presentationId);
  const slides = presentation.getSlides();
  
  // Check if the new order is valid
  if (newOrder.length !== slides.length) {
    throw new Error("Invalid slide order");
  }
  
  // Reorder slides
  newOrder.forEach((newPosition, currentPosition) => {
    if (newPosition !== currentPosition) {
      slides[currentPosition].move(newPosition);
    }
  });
  
  return true;
}

// Function to create blank slide
function createBlankSlide(presentationId, position) {
  debugLog("Creating blank slide at position: " + position);
  
  const presentation = SlidesApp.openById(presentationId);
  const slides = presentation.getSlides();
  
  let newSlide;
  if (position >= slides.length) {
    newSlide = presentation.appendSlide()
    newSlide.getBackground().setSolidFill('#FFFFFF');
  } else {
    newSlide = slides[Math.max(0, position)].insertSlidesBefore(1)[0];
  }
  
  return true;
}

function duplicateSlide(presentationId, slideIndex) {
  debugLog("Duplicating slide at index: " + slideIndex);
  
  const presentation = SlidesApp.openById(presentationId);
  const slides = presentation.getSlides();
  
  if (slideIndex >= 0 && slideIndex < slides.length) {
    const sourceSlide = slides[slideIndex];
    sourceSlide.duplicate(); // This duplicates the slide in place
    return true;
  }
  
  throw new Error("Invalid slide index");
}

// Function to delete slide
function deleteSlide(presentationId, slideIndex) {
  debugLog("Deleting slide at index: " + slideIndex);
  
  const presentation = SlidesApp.openById(presentationId);
  const slides = presentation.getSlides();
  
  if (slideIndex >= 0 && slideIndex < slides.length) {
    slides[slideIndex].remove();
    return true;
  }
  
  throw new Error("Invalid slide index");
}

// Get Folder File Count
function getFolderFileCount(folderId) {
   try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFiles();
    let count = 0;
    
    while (files.hasNext()) {
      files.next();
      count++;
    }
       
    return count;

  } catch (error) {
    Logger.log(`Error getting folder file count: ${error.message}`);
    throw error;
  }
}

// Settings management functions

// Settings management functions

function findSettingsSpreadsheet() {
  const settingsFileName = "ServicePlanner2Settings";
  const userProps = PropertiesService.getUserProperties();
  const storedSettingsId = userProps.getProperty("Planner2Settings");
  
  // Check if we have a stored settings ID and if that file still exists
  if (storedSettingsId) {
    try {
      const file = DriveApp.getFileById(storedSettingsId);
      if (file) {
        debugLog("Found settings file using stored ID");
        return storedSettingsId;
      }
    } catch (error) {
      debugLog("Stored settings file ID no longer valid");
      // File doesn't exist, continue to search logic
    }
  }
  
  // Search in user's Drive
  let files = DriveApp.getFilesByName(settingsFileName);
  if (files.hasNext()) {
    const settingsFile = files.next();
    const settingsId = settingsFile.getId();
    userProps.setProperty("Planner2Settings", settingsId);
    debugLog("Found settings file in Drive and stored ID");
    return settingsId;
  }
  
  // Search in files shared with user
  const query = `title = '${settingsFileName}' and mimeType = '${MimeType.GOOGLE_SHEETS}'`;
  files = DriveApp.searchFiles(query);
  if (files.hasNext()) {
    const settingsFile = files.next();
    const settingsId = settingsFile.getId();
    userProps.setProperty("Planner2Settings", settingsId);
    debugLog("Found settings file in shared files and stored ID");
    return settingsId;
  }
  
  // If we get here, no settings file was found
  const errorMsg = "Settings file not found. Please ensure the ServicePlanner2Settings spreadsheet exists and is shared with you.";
  debugLog(errorMsg);
  throw new Error(errorMsg);
}

function getSettings() {
  try {
    const cache = CacheService.getUserCache();
    let settings;

    // Try to get settings from cache first
    const cachedSettings = cache.get('planner2Settings');
    if (cachedSettings) {
      try {
        return JSON.parse(cachedSettings);
      } catch (parseError) {
        // If JSON parse fails, continue to fetch from spreadsheet
        Logger.log("Error parsing cached settings: " + parseError.message);
      }
    }

    // If not in cache or parse failed, get from spreadsheet
    const sheetId = findSettingsSpreadsheet();
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheets()[0];
    
    const data = sheet.getDataRange().getValues();
    settings = {};
    
    // Start from row 1 (skipping header)
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) { // Only add if key exists
        settings[data[i][0]] = data[i][1];
      }
    }

    // Store in cache for 6 hours (21600 seconds)
    try {
      cache.put('planner2Settings', JSON.stringify(settings), 21600);
      // Also set debug flag in cache for consistency
      cache.put('planner2Debug', settings.Debug || 'no', 21600);
    } catch (cacheError) {
      Logger.log("Error caching settings: " + cacheError.message);
    }
    
    return settings;
    
  } catch (error) {
    Logger.log("Error getting settings: " + error.message);
    throw new Error("Failed to load settings: " + error.message);
  }
}

// Add a function to clear settings cache when needed
function clearSettingsCache() {
  try {
    const cache = CacheService.getUserCache();
    cache.remove('planner2Settings');
    cache.remove('planner2Debug');
    return true;
  } catch (error) {
    Logger.log("Error clearing settings cache: " + error.message);
    return false;
  }
}

// Add a function to update a single setting
function updateSetting(key, value) {
  try {
    // Update in spreadsheet first
    const sheetId = findSettingsSpreadsheet();
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        rowIndex = i + 1; // +1 because spreadsheet rows are 1-based
        break;
      }
    }
    
    if (rowIndex === -1) {
      // Key doesn't exist, append new row
      sheet.appendRow([key, value]);
    } else {
      // Update existing row
      sheet.getRange(rowIndex, 2).setValue(value);
    }
    
    // Clear cache to force refresh
    clearSettingsCache();
    
    return true;
  } catch (error) {
    Logger.log("Error updating setting: " + error.message);
    throw new Error("Failed to update setting: " + error.message);
  }
}

function createNewSettingsSheet() {
  debugLog("Creating new settings spreadsheet");
  const ss = SpreadsheetApp.create('ServicePlanner2Settings');
  const sheet = ss.getSheets()[0];
  
  // Set up initial structure
  sheet.getRange('A1:B1').setValues([['Setting', 'Value']]);
  sheet.autoResizeColumns(1, 2);
  
  // Add explanatory note
  sheet.getRange('A2:B2').setValues([['Note:', 'This sheet stores settings for the Service Planner application']]);
  
  return ss.getId();
}

function copySongToServicePlan(sourceId, planFolderId, songName) {
  debugLog(`Copying song ${songName} to service plan folder`);
  
  try {
    // Get source file and destination folder
    const sourceFile = DriveApp.getFileById(sourceId);
    const destFolder = DriveApp.getFolderById(planFolderId);
    
    // Make a copy in the service plan folder
    const newFile = sourceFile.makeCopy(songName, destFolder);
    debugLog(`Created copy with ID: ${newFile.getId()}`);
    
    // Get thumbnails for the new copy
    const thumbnailUrls = getThumbnailUrls(newFile.getId());
    
    return {
      success: true,
      fileId: newFile.getId(),
      url: `https://docs.google.com/presentation/d/${newFile.getId()}/preview`,
      thumbnailUrls: thumbnailUrls
    };
    
  } catch (error) {
    debugLog("Error copying song: " + error.message);
    throw new Error("Failed to copy song: " + error.message);
  }
}


function getDriveStorageInfo() {
  try {
    const about = Drive.About.get({
      fields: 'storageQuota'
    });
    
    const storage = about.storageQuota.limit;
    const used = about.storageQuota.usage;
    const free = storage - used;
    
    return {
      total: formatBytes(storage),
      used: formatBytes(used),
      free: formatBytes(free),
      percentUsed: Math.round((used / storage) * 100)
    };
  } catch (error) {
    debugLog("Error getting storage info: " + error.message);
    throw new Error("Failed to get storage information");
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Server-side publishing functions for Code.js

// Server-side publishing functions for Code.js

function publishServicePlan(planFolderId) {
  try {
    // Get publish folder ID from settings
    const settings = getSettings();
    const publishFolderId = settings.PublishId;
    const title = settings.Title || 'Service Plan';
    
    if (!publishFolderId) {
      throw new Error('Publish folder not configured in settings');
    }

    // Get plan folder and details
    const planFolder = DriveApp.getFolderById(planFolderId);
    const currentName = planFolder.getName();

    // Get plan details from the service order JSON
    const files = planFolder.getFiles();
    let jsonFile = null;
    while (files.hasNext()) {
      const file = files.next();
      if (file.getName().startsWith('ServiceOrder-') && file.getName().endsWith('.json')) {
        jsonFile = file;
        break;
      }
    }

    if (!jsonFile) {
      throw new Error('Service order file not found');
    }

    // Parse the JSON file to get plan details
    const content = jsonFile.getBlob().getDataAsString();
    const serviceOrder = JSON.parse(content);
    const planDate = serviceOrder.date;
    const planType = serviceOrder.type;

    // Format the date for the filename (DD-MMM-YYYY)
    const [day, month, year] = planDate.split('-');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const formattedDate = `${day}-${monthNames[parseInt(month) - 1]}-${year}`;
    
    // Get publish folder
    const publishFolder = DriveApp.getFolderById(publishFolderId);

    // Construct published file names
    const publishedFileName = `ServicePlan-PUBLISHED-${formattedDate}-${planType}`;
    const textFileName = `ServiceOrder-PUBLISHED-${formattedDate}-${planType}.txt`;
    
    // Check for and delete existing text file with same name
    const existingTextFiles = publishFolder.getFilesByName(textFileName);
    while (existingTextFiles.hasNext()) {
      existingTextFiles.next().setTrashed(true);
    }
    
    // Create text content
    let textContent = `Order of Service for ${day}-${monthNames[parseInt(month) - 1]}-${year}\n`;
    textContent += `${planType} Service\n\n`;
    
    serviceOrder.orderOfService.forEach((item, index) => {
      textContent += `${index + 1}. ${item.type}: ${item.detail}\n`;
    });
    
    // Create text file
    debugLog("START CREATING TEXT FILE");
    publishFolder.createFile(textFileName, textContent);
    debugLog("END CREATING TEXT FILE");

    // Check for and delete existing published presentation file
    const existingFiles = publishFolder.getFilesByName(publishedFileName);
    while (existingFiles.hasNext()) {
      existingFiles.next().setTrashed(true);
    }

    // Create new presentation
    const presentation = SlidesApp.create(publishedFileName);
    const presentationFile = DriveApp.getFileById(presentation.getId());
    presentationFile.moveTo(publishFolder);
    
    // Delete the automatically created blank slide
    const slides = presentation.getSlides();
    if (slides.length > 0) {
      slides[0].remove();
    }
    
    // Rename the plan folder from Draft to Published
    const newFolderName = currentName.replace('ServicePlan-Draft-', 'ServicePlan-Published-');
    planFolder.setName(newFolderName);

    return {
      success: true,
      presentationId: presentation.getId()
    };

  } catch (error) {
    debugLog("Error in publishServicePlan: " + error.message);
    throw error;
  }
}

function appendSlidesToPublication(sourceId, targetId, addBlankBefore, addBlankAfter) {
  try {
    const targetPresentation = SlidesApp.openById(targetId);
    const sourcePresentation = SlidesApp.openById(sourceId);
    
    // Add blank slide before if requested
    if (addBlankBefore) {
      const blankSlide = targetPresentation.appendSlide();
      blankSlide.getBackground().setSolidFill('#FFFFFF');
    }
    
    // Get source slides and append each one to target
    const sourceSlides = sourcePresentation.getSlides();
    sourceSlides.forEach(sourceSlide => {
      targetPresentation.appendSlide(sourceSlide);
    });
    
    // Add blank slide after if requested
    if (addBlankAfter) {
      blankSlide = targetPresentation.appendSlide();
      blankSlide.getBackground().setSolidFill('#FFFFFF');
    }
    
    targetPresentation.saveAndClose();
    return { success: true };
    
  } catch (error) {
    debugLog("Error in appendSlidesToPublication: " + error.message);
    throw error;
  }
}

// Get distribution list from Google Sheet
function getDistributionList() {
  const settings = getSettings();
  const emailDistId = settings.EmailDistId;
  
  if (!emailDistId) {
    throw new Error('Email distribution list ID not configured in settings');
  }
  
  try {
    const sheet = SpreadsheetApp.openById(emailDistId).getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // Skip header row, filter for checked entries
    return data.slice(1)
      .filter(row => row[2] === true || row[3] === true)  // Get rows where either column 3 or 4 is checked
      .map(row => ({
        name: row[0],
        email: row[1]
      }));
  } catch (error) {
    throw new Error('Failed to read distribution list: ' + error.message);
  }
}

// Parse additional email addresses
function parseAdditionalEmails(emailString) {
  if (!emailString) return [];
  
  // Split by commas or spaces
  return emailString.split(/[\s,]+/)
    .map(email => email.trim())
    .filter(email => email.includes('@')); // Basic email validation
}

// Create email HTML content
// Create email HTML content
function createEmailContent(serviceOrder, subject) {
  let html = '<div style="font-family: Arial, sans-serif;">';
  html += `<div style="margin-bottom: 20px; font-weight: bold;">${subject}</div>`;
  
  // Add service notes if they exist
  if (serviceOrder.comments) {
    html += `<div style="margin-bottom: 20px; font-weight: bold;">${serviceOrder.comments}</div>`;
  }
  
  // Add Order of Service header
  html += `<div style="font-size: 18px; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">Order of Service</div>`;

  // Add service items table
  html += `<table style="width: 100%; border-collapse: collapse; margin-top: 10px;"> `;
    
  serviceOrder.orderOfService.forEach((item, index) => {
    const isSong = ['song', 'sing', 'hymn'].includes(item.type.toLowerCase());
    let detail = item.detail;
    
    // Add hyperlink for songs
    if (isSong && item.link) {
      detail = `<a href="https://docs.google.com/presentation/d/${item.link}/edit" 
                  style="color: #0066cc; text-decoration: none;">${item.detail}</a>`;
    }
    
    html += `<tr>
      <td style="padding: 8px; border-top: 1px solid #dee2e6; border-bottom: 1px solid #dee2e6; border-left: 1px solid #dee2e6;">${index + 1}</td>
      <td style="padding: 8px; border-top: 1px solid #dee2e6; border-bottom: 1px solid #dee2e6;">${item.type}</td>
      <td style="padding: 8px; border-top: 1px solid #dee2e6; border-bottom: 1px solid #dee2e6; border-right: 1px solid #dee2e6;">${detail}</td>
    </tr>`;
  });
  
  html += '</table></div>';
  return html;
}

// Main function to send emails
function sendServicePlanEmails(folderId) {
  const serviceOrder = loadServiceOrder(folderId);
  if (!serviceOrder) {
    throw new Error('Could not load service order');
  }
  
  // Get settings for email distribution
  const settings = getSettings();
  const title = settings.Title || 'Service Plan';
  const adminEmail = settings.AdminEmail;

  // Get creator's email (with try-catch)
  let creatorEmail = null;
  try {
    creatorEmail = Session.getActiveUser().getEmail();
  } catch (error) {
    debugLog("Error getting creator email: " + error.message);
  }

  // Get distribution list and additional emails
  const distributionList = getDistributionList();
  const additionalEmails = parseAdditionalEmails(serviceOrder.extraEmails);
  
  // Create all recipients list, excluding creator and admin
  const allRecipients = [
    ...distributionList.map(entry => entry.email),
    ...additionalEmails
  ].filter(email => 
    email !== creatorEmail && 
    email !== adminEmail
  );
  
  if (allRecipients.length === 0 && !creatorEmail && !adminEmail) {
    throw new Error('No recipients found');
  }
  
  // Format date for subject
  const [day, month, year] = serviceOrder.date.split('-');
  const date = new Date(year, month - 1, day);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const monthName = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const formattedDate = `${day}-${monthName}-${year}`;
  const subject = `${title} for ${dayName} ${formattedDate} - ${serviceOrder.type}`;
  
  // Get the published presentation ID
  const publishFolder = DriveApp.getFolderById(settings.PublishId);
  const publishedFileName = `ServicePlan-PUBLISHED-${formattedDate}-${serviceOrder.type}`;
  debugLog(`PUBLISHEDNAME=${publishedFileName}`);
  const files = publishFolder.getFilesByName(publishedFileName);
  let presentationId = null;
  if (files.hasNext()) {
    presentationId = files.next().getId();
  }

  // Send general email to distribution list
  if (allRecipients.length > 0) {
    const generalHtmlContent = createEmailContent(serviceOrder, subject);
    MailApp.sendEmail({
      bcc: allRecipients.join(','),
      subject: subject,
      htmlBody: generalHtmlContent
    });
  }

  // Send special email to creator and admin with edit links
  if (presentationId) {
    const previewUrl = `https://docs.google.com/presentation/d/${presentationId}/preview`;
    const editUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;
    const specialHtmlContent = createEmailContent(serviceOrder, subject, previewUrl, editUrl);
    
    // Create array of special recipients, filtering out nulls and duplicates
    const specialRecipients = [...new Set([creatorEmail, adminEmail].filter(Boolean))];
    
    if (specialRecipients.length > 0) {
      MailApp.sendEmail({
        to: specialRecipients.join(','),
        subject: subject,
        htmlBody: specialHtmlContent
      });
    }
  }
  
  return {
    success: true,
    recipientCount: allRecipients.length + 2
  };
}

function createEmailContent(serviceOrder, subject, previewUrl = null, editUrl = null) {
  let html = '<div style="font-family: Arial, sans-serif;">';
  html += `<div style="margin-bottom: 20px; font-weight: bold;">${subject}</div>`;
  
  // Add service notes if they exist
  if (serviceOrder.comments) {
    html += `<div style="margin-bottom: 20px; font-weight: bold;">${serviceOrder.comments}</div>`;
  }
  
  // Add preview/edit links if provided
  if (previewUrl && editUrl) {
    html += `<div style="margin-bottom: 20px;">Preview presentation <a href="${previewUrl}">here</a>, edit presentation <a href="${editUrl}">here</a>.</div>`;
  }

  // Add Order of Service header
  html += `<div style="font-size: 18px; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">Order of Service</div>`;

  // Add service items table
  html += `<table style="width: 100%; border-collapse: collapse; margin-top: 10px;"> `;
    
  serviceOrder.orderOfService.forEach((item, index) => {
    const isSong = ['song', 'sing', 'hymn'].includes(item.type.toLowerCase());
    let detail = item.detail;
    
    // Add hyperlink for songs
    if (isSong && item.link) {
      detail = `<a href="https://docs.google.com/presentation/d/${item.link}/edit" 
                  style="color: #0066cc; text-decoration: none;">${item.detail}</a>`;
    }
    
    html += `<tr>
      <td style="padding: 8px; border-top: 1px solid #dee2e6; border-bottom: 1px solid #dee2e6; border-left: 1px solid #dee2e6;">${index + 1}</td>
      <td style="padding: 8px; border-top: 1px solid #dee2e6; border-bottom: 1px solid #dee2e6;">${item.type}</td>
      <td style="padding: 8px; border-top: 1px solid #dee2e6; border-bottom: 1px solid #dee2e6; border-right: 1px solid #dee2e6;">${detail}</td>
    </tr>`;
  });
  
  html += '</table></div>';
  return html;
}

// Add this function to Code.js
function getHowToContent(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    if (!file) {
      return null;
    }
    return file.getBlob().getDataAsString();
  } catch (error) {
    debugLog("Error reading how-to content: " + error.message);
    return null;
  }
}

function checkNoticesFile(planDate) {
  debugLog(`Checking for notices file for date: ${planDate}`);
  
  try {
    // Get settings
    const settings = getSettings();
    const noticesId = settings.NoticesId;
    
    if (!noticesId) {
      debugLog("NoticesId not set in settings");
      return { exists: false, reason: "NoticesId not configured" };
    }
    
    // Get notices folder
    const noticesFolder = DriveApp.getFolderById(noticesId);
    if (!noticesFolder) {
      debugLog("Could not find notices folder");
      return { exists: false, reason: "Notices folder not found" };
    }
    
    // Search for notice file with matching date
    const noticeFileName = `ServicePlan-Notices-${planDate}`;
    const files = noticesFolder.getFilesByName(noticeFileName);
    
    if (files.hasNext()) {
      const file = files.next();
      debugLog(`Found existing notices file: ${file.getId()}`);
      return {
        exists: true,
        fileId: file.getId(),
        url: `https://docs.google.com/presentation/d/${file.getId()}/preview`
      };
    }
    
    debugLog("No existing notices file found");
    return { exists: false };
    
  } catch (error) {
    debugLog(`Error checking notices file: ${error.message}`);
    throw new Error(`Failed to check notices file: ${error.message}`);
  }
}

function createNoticesFile(planDate) {
  debugLog(`Creating new notices file for date: ${planDate}`);
  
  try {
    // Get settings
    const settings = getSettings();
    const noticesId = settings.NoticesId;
    const blankTemplateId = settings.BlankTemplateId;
    
    if (!noticesId) {
      debugLog("NoticesId not set in settings");
      throw new Error("Notices folder not configured in settings");
    }
    
    // Get notices folder
    const noticesFolder = DriveApp.getFolderById(noticesId);
    if (!noticesFolder) {
      debugLog("Could not find notices folder");
      throw new Error("Notices folder not found");
    }
    
    // Create new presentation
    const fileName = `ServicePlan-Notices-${planDate}`;
    let presentation;
    let presentationFile;
    
    if (blankTemplateId) {
      debugLog(`Using blank template with ID: ${blankTemplateId}`);
      try {
        // Get template file
        const templateFile = DriveApp.getFileById(blankTemplateId);
        if (!templateFile) {
          debugLog("Template file not found, falling back to creating new presentation");
          presentation = SlidesApp.create(fileName);
          presentationFile = DriveApp.getFileById(presentation.getId());
        } else {
          // Make a copy of the template
          debugLog("Creating copy of template file");
          presentationFile = templateFile.makeCopy(fileName);
          presentation = SlidesApp.openById(presentationFile.getId());
        }
      } catch (error) {
        debugLog(`Error using template: ${error.message}, falling back to creating new presentation`);
        presentation = SlidesApp.create(fileName);
        presentationFile = DriveApp.getFileById(presentation.getId());
      }
    } else {
      debugLog("No blank template specified, creating new presentation");
      presentation = SlidesApp.create(fileName);
      presentationFile = DriveApp.getFileById(presentation.getId());
    }
    
    // Move to notices folder
    debugLog("Moving presentation to notices folder");
    presentationFile.moveTo(noticesFolder);
    
    debugLog(`Created new notices file: ${presentation.getId()}`);
    
    // Get thumbnails
    const thumbnailUrls = getThumbnailUrls(presentation.getId());
    
    return {
      success: true,
      fileId: presentation.getId(),
      url: `https://docs.google.com/presentation/d/${presentation.getId()}/preview`,
      thumbnailUrls: thumbnailUrls
    };
    
  } catch (error) {
    debugLog(`Error creating notices file: ${error.message}`);
    throw new Error(`Failed to create notices file: ${error.message}`);
  }
}

// Add this new function to Code.js

function addNewSongToDatabase(fileData, filename, newName) {
  try {
    debugLog(`Adding new song "${newName}" to database`);
    
    // Get settings for song database
    const settings = getSettings();
    const songDatabaseId = settings.SongDatabaseId;
    
    if (!songDatabaseId) {
      throw new Error("Song database folder not configured in settings");
    }
    
    // Create blob from base64 data
    const bytes = Utilities.base64Decode(fileData.content);
    const blob = Utilities.newBlob(bytes, fileData.mimeType, filename);
    
    // Upload to song database and convert to Google Slides
    const folder = DriveApp.getFolderById(songDatabaseId);
    const newFile = folder.createFile(blob);
    
    Utilities.sleep(2000); // Time delay to ensure file created ok
    
    const slideFile = Drive.Files.copy(
      { 
        title: newName, 
        parents: [{ id: folder.getId() }],
        mimeType: 'application/vnd.google-apps.presentation' 
      },
      newFile.getId(),
      { convert: true }
    );
    
    // Clean up original PPTX
    newFile.setTrashed(true);
    
    // Get thumbnails
    const thumbnailUrls = getThumbnailUrls(slideFile.id);
    
    return {
      success: true,
      fileId: slideFile.id,
      name: newName,
      thumbnailUrls: thumbnailUrls
    };
    
  } catch (error) {
    debugLog("Error adding song to database: " + error.message);
    throw new Error("Failed to add song to database: " + error.message);
  }
}





//END OF CODE.GS