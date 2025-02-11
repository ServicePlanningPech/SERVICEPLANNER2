# Service Planner2

A Google Apps Script web application for planning and managing church services. This application helps worship leaders and church staff efficiently organize service elements, manage presentations, and share service plans with team members.

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
4. Access to Google Slides and Googl Drive API's

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

3. Enable required Google Services:
   - Google Drive API
   - Google Slides API
   - Google Drive Activity API

4. Deploy as a web application:
   - Click "Deploy" > "New deployment"
   - Choose "Web app"
   - Set execution to "Run as user accessing the web app"
   - Set access to "Anyone with Google Account"
   - Click "Deploy"

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

## Support

For issues and support:
1. Check debug logs in "Service Planner2 Debug Log" spreadsheet
2. Review sharing permissions
3. Verify Google Apps Script quotas and limits
4. Contact system administrator

## Contributing

Guidelines for contributing:
1. Fork the repository
2. Create feature branch
3. Submit pull request with detailed description
4. Follow existing code style
5. Include documentation updates

## License

[Your chosen license information here]

## Acknowledgments

- Built with Google Apps Script
- Uses Bootstrap for UI
- Implements multiple Google Workspace APIs# SERVICEPLANNER2
Service Planner Version 2
