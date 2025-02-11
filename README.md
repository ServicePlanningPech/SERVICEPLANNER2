# Service Planner2

A Google Apps Script web application for planning and managing church services. This application helps worship leaders and church staff efficiently organize service elements, manage presentations, and share service plans with team members. The Planner helps to construct a service presentation in the form of a google slide presentation, combining song lyrics, sermon notes, scriptures and any other required slides. The 'published' presentation can be projected in a number of ways. A very basic solution would be to use a "Chromecast" device connected to a projector and linked with a smartphone, to display the slides directly from Google Drive. At our church we synchronise the published plans with a PC running  'vMix' video production and streaming software.  

## Features

### Service Plan Management
- Create and manage service plans for different types of services
- Drag-and-drop interface for organizing service elements
- Auto-saving of changes
- Support for draft and published states
- Deletion and archiving of old plans

### Content Management
- Song/hymn database integration
- AI Searching for songs by Bible Reference or theme
- PowerPoint and image file upload capabilities
- Google Slides integration
- Slide template system
- Blank slide insertion
- Slide thumbnails preview gallery
- Support for notices and other service elements

### Publishing & Sharing
- Automatic compilation of all service elements into a single presentation
- Email distribution to team members
- Configurable sharing permissions
  

### User Interface
- Responsive design for desktop and tablets
- Intuitive drag-and-drop interface
- Real-time preview of slides in a slide gallery
- Context menus for quick isertion of service items
- "How-to" help system
- Progress indicators for long operations

## Prerequisites

1. Google Workspace (formerly G Suite) account or standard Google account
2. Permissions to create and execute Google Apps Script projects
3. Google Drive storage space for service plans and presentations
4. Access to Google Slides and Google Drive API's. This will require setting up the app as a project in Google Cloud Platform.

## Installation

1. Create a new Google Apps Script project at [script.google.com](https://script.google.com)
2. Copy and paste each file from this repository into your project:
   - `Code.js` (main server-side code)
   - `appsscript.json` (project configuration)
   - `main.html` (main UI template)
   - `Script.html` (client-side JavaScript)
   - `Script2.html` (additional client-side JavaScript)
   - `ServerCalls.html` (server communication functions)
   - `HowTo.html` (help system)

3. In the Apps SCript Editor Enable required Google Services:
   - Drive 
   - Slides

4. Set up the project in Google CLoud Console
* Sign in to Google Cloud Console (https://console.cloud.google.com)
* Create a new project or select an existing one
* Note down the Project ID - you'll need this later
* In Cloud Console, go to "APIs & Services" > "Library"
* Search for and enable these APIs:
  * Google Drive API
  * Google Slides API

**OAuth Consent Screen Setup**
* Go to "APIs & Services" > "OAuth consent screen" > Data Access > Add or Remove Scopes
* Add these scopes:
  *  ...auth/presentations.readonly
  *  ...auth/userinfo.email
  
**Create OAuth 2.0 Credentials**
* Go to "APIs & Services" > "Credentials"
* Click "Create Credentials" > "OAuth client ID"
* Choose "Web application" as application type
* Set name for OAuth 2.0 client ID
* Add authorized redirect URIs:
  * Add your Apps Script deployment URL

## Apps Script Project Configuration
* Open your Apps Script project
* Click "Project Settings" (gear icon)
* Under "Google Cloud Platform (GCP) Project":
  * Link to the project you created using Project Number
  * 
5. Deploy as a web application:
   - Click "Deploy" > "New deployment"
   - Choose "Web app"
   - Set execution to "Run as user accessing the web app"
   - Set access to "Anyone with Google Account"
   - Click "Deploy"
   - 
### Initial Setup

1. Set up required folders in Google Drive:
   - SERVICE PLANS (created automatically)
   - Song Database folder. Add your song lyrics as google slide files
   - Templates folder
   - Published Plans folder
   - Notices folder

2. Create a settings spreadsheet named "ServicePlanner2Settings" with these key settings:
   - Title: Title you want to show
   - SongDatabaseId: Folder ID containing song presentations
   - SlideTemplateId: Folder ID containing slide templates
   - BlankTemplateId: File ID of blank template
   - PublishId: Folder ID for published presentations
   - EmailDistId: Spreadsheet ID for email distribution list
   - NoticesId: Folder ID for notices. Notices get saved in this folder, which should be a sub-folder of the PublishId
   - Debug: Debug logging setting (on/off)
   - SharePlans: Auto-share setting (yes/no). Set to yes to allow email recipients to click song hyperlinks
   - AdminEmail: Administrator email address
   - HoToId: Id of a google help text file with How-To content from "ServicePlannerHowTo.txt" in this repo
   - Licence: A Licence string showing your CCL or other licence, if you are showing copyright lyrics
   - apiKey: Your OpenAI Api key for advanced song search, if required. The search uses gpt-4o-mini. Note, it only returns results of songs that are in your song database.
   - ContextMenu: The service items you want to appear in the right-click dropdown menu. For example Welcome,Notices,Sing,Hymn,Reading,Prayer,Sermon,Message,Lord's Supper,Communion

3. Create email distribution list spreadsheet with columns:
   - Name
   - Email
   - Distribution Checkbox. These are your ministry team members who need to know your service plan
   - Authorization Checkbox. These are people who are allowed to create service plans.

### Security Configuration

1. Access Control:
   - Only authorized users (checked in email distribution list) can access
   - Users must be logged into correct Google account
   - Optional: Set up Chrome profile for dedicated access

2. Sharing Settings:
   - Configure folder sharing permissions
   - Set default visibility for published plans
   - Manage team access levels

## Usage

### Basic Operation

1. Launch the application
2. Create a new service plan:
   - Select date
   - Choose service type
   - Add service elements

3. Add content:
   - Select songs from database
   - Upload presentations
   - Create new slides
   - Add notices

4. Organize service:
   - Drag items to reorder
   - Add blank slides
   - Preview content
   - Add notes

5. Publish and share:
   - Click "Publish & Share" to compile and distribute
   - Or use "Publish Only" for compilation without sharing

### Best Practices

1. File Management:
   - Use consistent naming conventions
   - Regularly clean up old plans
   - Maintain organized song database

2. Team Collaboration:
   - Keep email distribution list updated
   - Use service notes for team communication
   - Regularly update templates

3. Performance:
   - Optimize uploaded files
   - Regular cleanup of unused content
   - Monitor Drive storage usage

## Troubleshooting

Common issues and solutions:

1. Access Denied:
   - Verify correct Google account
   - Check authorization in distribution list
   - Confirm sharing permissions

2. Upload Failures:
   - Check file size limits
   - Verify file format compatibility
   - Ensure sufficient Drive storage

3. Publishing Issues:
   - Verify folder permissions
   - Check presentation links
   - Confirm email settings

## Acknowledgments

- Built with Google Apps Script
- Uses Bootstrap for UI
- Implements multiple Google Workspace APIs# SERVICEPLANNER2
Service Planner Version 2
