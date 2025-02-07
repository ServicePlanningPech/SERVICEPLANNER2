/*


BASEAPIPhase1 Basic API functions working. Not setting correct file link on return. Still searching on key entry. NOt radio buttons

when we select Bible Ref or Theme search we should disable the event listener on the search input box

BASEAPIPhase2 stopped filtering song list on API searches. But it is now overlaying the loading indicator on th search/

The "Choose Song" button action works correctly when we just select a song in the "name" song list. But the new functions to search by API call injects a new Div element into the songSelectList, and this uses different a different variable name for the selected song. I need the "Choose Song" action to be the same for the new API-found song list as for the original song list stucture.

When doing an api search I can't see the loading indicator because it is covered by the song list modal

The "Name Search, "Bible Reference" and "Theme Search" buttons are appearing as square buttons. I want them to be radio buttons

BASEAPIPhase3
the max results element should show on the same line as the search radio buttons, and have a label of  "Max Results", and the default should be 6

max results element should be hidden until bible refs search or theme search radio buttons are clicked

BASEAPIPhase4
enable song select by double click in addition to using the "Choose Song" button

BASEAPIPhase5
change the Service Notes text box to a rich text editor with buttons for Bold, Italic,Underlined, Font Size and Hyperlink

BASEAPIPhase6
I want to add an information line on the Plan List section, to show the amount of free storage space in the user's google drive. Create a backend function that uses the google Drive API to get the free and used storage space. Create a call to this function from the client side to display as an information line just above the plan list table.

BASEAPIPhase7

Moved storage div to below plan list. Added margin-top: 20px; 

BASEAPIPhase8


BASEAPIPhase9 Reverted to here to back off nav bar which is not working well
Changed styling to left-justify tables with 20px padding

BASEAPIPHASE10

change plan Title to have left margin of 20px and to be a much smaller font size.

move the "Publish" "Share" and "Back to Plans" buttons on to the same line as the Plan Title. Remove background colouring from buttons so just the text is seen. Right-justify buttons with a right margin of 30px.
I want title "Church Service Planner" to change. I want to get the title from a "title" key in the Settings Google sheet. 
Remove "Reload Songs" button
Adjust other plan list buttons like the Plan edit button. Add help button

enable double-click action in the item type column. Action should be same as the right-click action, ie show the Context Menu

change text style of context menu items to bold
Added ?usp=sharing to edit. Found it works perfectly in Safari browser when google slides app not installed.

Added 'Hymn' to valid song types
I want a function to change the Context Menu for item types. If the settings google sheet has a key value "ContextMenu", use the comma-separated values in the sheet as new button dropdown items in the Context Menu. Always keep the first hard-coded item, which is 'New Line', but replace all the other hard-coded ones with the ones from the settings sheet.

BASEAPIPHASE13
the Bold, Italic, and Underline buttons in the service info container are not showing correctly when they are toggled on and off

When the insert link button in the service info container is clicked I want to show a box with input fields for text to be shown, and the url to be associated with the text field when it is clicked

BASEAPIPHASE14
In the Song Selection modal, when doing a Bible Refs search or a theme search, change the Search button style to be a large magnifying glass on a white background

In the Song Selection modal, when doing a Bible Refs search or a theme search, launch the search when the return key is pressed in the input field

In the Song Selection modal, when displaying or re-displaying the modal, always set the search type radio buttons back to name search

In the Song Selection modal, change the row "Preview" button to an appropriate graphic signifying "Preview"

BASEAPIPHASE15

When returning to plan list from plan edit the delete button and edit buttons are enabled. They should be disabled until a plan is selected

I now want to add the functionality for the 'Publish & Share' button and the 'publish' button. When either of these buttons are pressed do the following:
	1.  First get the ID of the publish folder from the Google sheet settings. The key for the setting is 'PublishId'. 
	2. Look in the publish folder for an existing plan of the same name. The plan file name format is 'ServicePlan-PUBLISHED-DD-MMM-YYYY-TYPE', where DD-MMM-YYYY is the plan date and TYPE is the plan type. If there is an existing plan in the folder delete it. 
	3. To create the new published plan first create the file in the publish folder using the name previously specified . Add a single blank slide to the start of the file.
	4. Set up a progress bar (Bootstrap progress-bar style) to display publish progress. Length is total nuumber of slides.
  5. On the client side go through the service items table to find all entries that have a presentation file linked. Call a backend function to Open each found file and append the slides to the published plan file. If either the 'blank before' or 'blank after' check boxes are checked, add a blank in the publish file at the appropriate place. Update the progress bar on successful return
	6.  At end close the published file and show an end confirmation message.
  7. Change the plan status in the service order json file to "Published".
	8. I will specify the 'Share' processing later.


BASEAPIPHASE16

Whenever a service item gets a hyperlink to a slides presentation, the "Add blank slide before" and "Add blank slide after" checkbox columns should be enabled and made visible.

When publishing a presentation, first find the last service item that has an attached file link, and check the "Add blank slide after" checkbox

BASEAPIPHASE17

I now want to add the functionality for the "Share" part of the "Publish & Share" processing. Sharing is simply sending emails out to everyone on a distribution list. Here are the details.
1. The distribution list is a google sheet. The Id of the sheets is set in the settings sheet with key value "EmailDistId". If this is not set just show an alert error message.
2. The distribution list has a user name in column 1, an email address in column 2, and a checkbox in column 3. Only send out emails to users who are checked in column 3.
3. Also send emails to email addresses that have been entered into the "Enter additional emails" text box in the service info container. Emails in the box should be separated by space or comma.
4. The email subject is the Title from "settings.Title" followed by the date and type.
5. The email to be constructed in Html form.
6. First, show any notes that were entered into the "Enter any notes for the service" text box in the Service Info container.
7. Then, list all items that were entered in the service items table. List item number, item type and item detail.
8. For songs only (Those items with type Song,Sing,Hymn) list item with the hyperlink to the song. Show the hyperlink in the item detail.

BASEAPIPHASE18

In the hyperlink function in the Service info container, change the colour of hyperlinked text to blue

Also in the service info container, remove the Bold rich text button, and the font size selection box


we are losing the current service status = "Draft" or "Published" when we save the service order

in the createEmailContent function, add a line of text to be placed immediately on top of the service items table. The text should be bold, 18 point, and say "Order of Service". Also, change the table borders to eliminate the vertical line between the item type and the item detail.

BASEAPIPHASE19
When the google slides presentation is created in the publishServicePlan function, a blank slide is automatically created. This should be deleted right after the file is created

When the service info container is moved below the servie items table on smaller devices like iPad, I want the service info container to stretch to be same width as service items table

BASEAPIPHASE20

I want to change the server-side getServicePlansFolder function, as follows. (1) Drop the code that gets the service plan fold Id from the settings google sheet. Just search the user's drive for a folder called "SERVICE PLANS". (2) The folder must be in the user's google drive storage, not a folder shared from another user. (3) If the folder does not exist, create it. (4) After creating, change the sharing options of the folder to allow anyone with the link to view the folder and any files it contains.

Removed AI API prompts from settings and hard-coded them

BASEAPIPHASE21
I want to introduce a help facility for the app, like this: (1) Add a button with text "How To" after the "Plan List" button in the Service Items Table section, and after the "Delete Plan" button in the Plan List section. (2) When either button is pressed, call a function which will display help data in a modal display.(3) The help data will be stored in Markdown format in a google drive text file. The file Id of the Markdown text file will be stored in the settings google sheet. If no setting, use the showToast() function to show a toast message to say "How To helps not available." (4) Read the Markdown text file and use the Marked.js markdown parser to display the help text in collapsible accordion elements. (5) Include a <Script> src entry to link to the CDN scripts for Marked.js. (6) All new scripts to be kept in a new html file called HowTo.html. This will require an "<?!= include('HowTo'); ?>" to be added to main.html


BASEAPIPHASE22
Add a search box to the How To modal, to help search for answers.

BASEAPIPHASE24
That fixed it. However, I would like to change the confirm deletion modal into a general Message and confirm modal that I can call from other places in the code. This will involve making the title, message, and button text into variables, and changing the event handlers to call the particular service I want. Make changes to the modal and to the function that displays it for confirming deletion.

BASEAPIPHASE25

I want to speed up the listing of service plans by removing the need to load and parse the json service plan file in the getServicePlans() Function. Here is what I want to do. (1) in createNewPlan change the prefix of the folder name we create to "ServicePlan-Draft-". (2) in getServicePlans change the prefix of folders we search for to "ServicePlan". (3) in getServicePlans remove the lines to get the json file as a blob and to parse the json content. (4) in the plans.push statement, change the "status" key value to set from the text string in the folder name  following "ServicePlan-" and up to the next "-". This will be set to either "Draft" or Published". (5) Remove the "status" key from the json file, and where we use to set this to Published, change this to rename the folder from "ServicePlan-Draft-"... to "ServicePlan-Published"...

BASEAPIPHASE26
In the Upload File modal the message "Uploading file" is shown when the upload button is pressed. But this message is still showing when starting the next upload. It should be cleared after an upload.

I want to improve the searching for the settings file at initialisation. We will uses the google apps script Properties Service to improve the logic, like this: (1) At initialisation, in the findSettingsSpreadsheet function, try to load user property "Planner2Settings". (2) If this is found it will contain the file Id of the Service Planner settings file, and we can just return it to the caller, but we need to check that the file with that id still exists. If it does not exist, a new one must have been created so we need to go on and search for it by name (3) If the user property is not found, or its file Id value no longer points to an existing file, we must search for the settings file as at present. (4) If found, set the file Id in User Property "Planner2Settings", and return to caller. (5) If it is still not found, remove the logic that creates it, as we now always need a configured sheet. Show an error message to say we can't continue. 

I want to change the debugLog function, so that it only produces log messages if a key "Debug" in the settings sheet is set to "true". For any calls to debugLog before the settings sheet has been loaded, just do a console.log command. 

In the service items table the column width of the "Blank before checked" column should be the same as the "Blank after checked" column

When clicking "Plan List" button, we should save the service plan before going back to the plan list


OpenAI API Calls remodelled manually


BASEAPIPHASE28
When publishing the pesentation, also create a text file in the publish folder, containing a list of the order of service. Have a a title "Order of Service for DD-MMM-YYYY" plus the service type. Name the file the same as the published slides presentation file, but with the prefix "ServiceOrder-" instaed of "ServicePlan-" and with a file type of "txt'."

BASEAPIPHASE29
Improve publish by showing progress box at the start

BASEAPIPHASE30
change the confirm statement in the setupUploadHandlers function to use the common message confirm modal

BASEAPIPHASE31
When the service order text file is written to the publish folder we should first check to see if there is an old copy in the folder, and if so, delete it.

Change format of date in emails

BASEAPIPHASE32
Another change to service plan emails: For the email that goes to the creator of the plan only, add a line with hyperlinks to a preview version and an edit version of the published presentation. Use a sentence like this: Preview presentation here, edit presentation here. The words "here" are the hyperlinks

Changes to the sendServicePlanEmails function; (1) Only send the one special email to the creator, don't include it in the "All Recipients" email list. (2) We will have a new "Admin" email, set in the settings sheet with the key "AdminEmail". Send the special email with the links to the presentation to this email, along with the creator. Also ensure this email is not sent again if it is in the "All Recipients" list. (3) Include a "try - catch" around the "Session.getActiveUser().getEmail();" statement.

BASEAPIPHASE34

I want to introduce code to help sharing of the Notices slides. Make the following changes:
1. Introduce a new settings key "NoticesId" in the settings sheet. This will be the google drive folder Id of a folder to save notice slides in. If the key is not set, skip the following actions.
2. When user selects the File Upload button on a line that specifies Item "Notices", check that the NoticesId key is set. If it is, check the NoticesId folder to see if a "ServicePlan-Notices-" file exists for the date of my plan. If it does, show a box that says "Notices for today have already been set up. Do you want to load them?". If user replies yes, set up a file link to the found file. If not just proceed with the normal file upload dialog.
3. If the NoticesId key is set but no "ServicePlan-Notices-" file exists for the date of my plan, create the new notices file in the "NoticesId" folder, with the "ServicePlan-Notices-" format name.
4.  Any server-side calls that need to look at settings keys must call the "getSettings" function.
5.  Include comprehensive logging with debugLog calls, for debugging.
6. Ensure server-side calls use the existing calling method, which involves adding an intermediate function to the "ServerCalls" file, and using the code format of the following example to make the call to that function and get the result.
await callServerFunction(params)
    .then(result => {
      myResult = result;
      })
    .catch(error => {
        alert('Error:' + error);
       });
Show me complete code for all new and changed functions. Pause after each one so that I can verify before asking you to proceed.

BASEAPIPHASE35



I will upload a new code base for my google apps script church service planning app. Then I will specify some changes.











*/