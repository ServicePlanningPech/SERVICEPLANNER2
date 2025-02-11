// SongReportUpdater.gs

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
  
  // If we get here, no settings file was found
  const errorMsg = "Settings file not found. Please ensure the ServicePlanner2Settings spreadsheet exists and is shared with you.";
  Logger.log(errorMsg);
  throw new Error(errorMsg);
}

function getSettings() {
  try {
    // Get from spreadsheet
    const sheetId = findSettingsSpreadsheet();
    const ss = SpreadsheetApp.openById(sheetId);
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

function updateSongReport() {
  try {
    // Get settings
    const settings = getSettings();
    if (!settings.SongReportId || !settings.PublishId) {
      throw new Error('SongReportId or PublishId not configured in settings');
    }

    // Open the song report spreadsheet
    const reportSheet = SpreadsheetApp.openById(settings.SongReportId).getActiveSheet();
    
    // Get published service orders from the publish folder
    const publishFolder = DriveApp.getFolderById(settings.PublishId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find all published service order text files
    const files = publishFolder.getFiles();
    const serviceOrders = [];
    
    while (files.hasNext()) {
      const file = files.next();
      const fileName = file.getName();
      
      // Only process service order files
      if (!fileName.includes('ServiceOrder-PUBLISHED')) continue;
      
      // Extract date from filename (DD-MMM-YYYY format)
      const dateMatch = fileName.match(/(\d{2})-([A-Za-z]{3})-(\d{4})/);
      if (!dateMatch) continue;
      
      // Parse the service date
      const [_, day, month, year] = dateMatch;
      const monthNum = getMonthNumber(month.toUpperCase());
      const serviceDate = new Date(year, monthNum, parseInt(day));
      
      // Only process files for today or future dates
      if (serviceDate >= today) {
        serviceOrders.push({
          file: file,
          date: serviceDate
        });
      }
    }

    Logger.log(`Found ${serviceOrders.length} service orders to process`);

    // Process each service order
    for (const order of serviceOrders) {
      const content = order.file.getBlob().getDataAsString();
      const lines = content.split('\n');
      
      // Find song lines
      const songLines = lines.filter(line => 
        line.toLowerCase().includes('sing:') || 
        line.toLowerCase().includes('song:') || 
        line.toLowerCase().includes('hymn:')
      );
      
      Logger.log(`Found ${songLines.length} songs in service order dated ${formatDate(order.date)}`);
      
      // Process each song
      for (const line of songLines) {
        const songName = extractSongName(line);
        if (songName) {
          updateSongInReport(reportSheet, songName, order.date);
          Logger.log(`Updated song: ${songName}`);
        }
      }
    }
    
    // Sort sheet by song name, excluding header row
    const numRows = reportSheet.getLastRow();
    if (numRows > 2) { // Only sort if we have data besides header
      // Get range starting from row 2 (after header) to last row
      const rangeToSort = reportSheet.getRange(2, 1, numRows - 1, reportSheet.getLastColumn());
      rangeToSort.sort({column: 1, ascending: true}); // Sort by column 1 (Song Name)
    }
    
    Logger.log("Song report update completed successfully");
    
  } catch (error) {
    Logger.log('Error updating song report: ' + error.message);
    throw error;
  }
}

function extractSongName(line) {
  // Remove line number if present
  line = line.replace(/^\d+\.\s*/, '');
  
  // Find the position after the type indicator (Sing:/Song:/Hymn:)
  const colonPos = line.indexOf(':');
  if (colonPos === -1) return null;
  
  // Extract and clean up the song name
  return line.substring(colonPos + 1).trim();
}

function getMonthNumber(monthStr) {
  const months = {
    'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
    'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
  };
  return months[monthStr.toUpperCase()];
}

function formatDate(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Add this new function for normalizing song names
function normalizeSongName(name) {
  return name
    .toLowerCase() // Convert to lowercase
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing spaces
}

function updateSongInReport(sheet, songName, serviceDate) {
  const data = sheet.getDataRange().getValues();
  const formattedDate = formatDate(serviceDate);
  
  // Normalize the input song name
  const normalizedInputSong = normalizeSongName(songName);
  
  // Look for existing song entry
  let songRow = -1;
  for (let i = 1; i < data.length; i++) { // Start at 1 to skip header
    const normalizedSheetSong = normalizeSongName(data[i][0]);
    if (normalizedSheetSong === normalizedInputSong) {
      songRow = i + 1; // +1 because sheet rows are 1-based
      // Use the existing song name from sheet to maintain original formatting
      songName = data[i][0];
      break;
    }
  }
  
  if (songRow > 0) {
    // Update existing song entry
    const row = sheet.getRange(songRow, 1, 1, sheet.getLastColumn());
    const rowValues = row.getValues()[0];
    
    // Increment play count
    rowValues[1] = (rowValues[1] || 0) + 1;
    
    // Shift previous dates right
    for (let i = rowValues.length - 1; i >= 4; i--) {
      rowValues[i] = rowValues[i - 1];
    }
    
    // Move last played date to history
    rowValues[3] = rowValues[2];
    
    // Update last played date
    rowValues[2] = formattedDate;
    
    // Update the row
    row.setValues([rowValues]);
    Logger.log(`Updated existing song: ${songName}, Count: ${rowValues[1]}`);
    
  } else {
    // Add new song entry
    const newRow = [
      songName,    // Song Name
      1,          // Number of times sung
      formattedDate, // Last sung date
      ''          // First entry in history
    ];
    sheet.appendRow(newRow);
    Logger.log(`Added new song: ${songName}`);
  }
}

// Create a trigger to run every Saturday at 10 PM
function createSongReportTrigger() {
  // Delete any existing triggers first
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'updateSongReport') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger
  ScriptApp.newTrigger('updateSongReport')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SATURDAY)
    .atHour(22)
    .create();
    
  Logger.log("Song report trigger created for Saturday at 10 PM");
}

// Function to manually test the song report update
function testSongReport() {
  try {
    Logger.log("Starting manual test of song report update");
    updateSongReport();
    Logger.log("Test completed successfully");
  } catch (error) {
    Logger.log("Test failed: " + error.message);
    throw error;
  }
}