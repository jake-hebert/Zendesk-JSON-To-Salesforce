# Zendesk-JSON-To-Salesforce

Javascript to parse a giant JSON export from zendesk and load it into SFDC

# How to use

- Run 'npm install'

- Create a file called "settings.json" in your root directory

- populate the variables that will be used for processing
  example settings.json:
  {
  "startLine": 0,
  "endLine": 200,
  "filePath": "./data/FullExport.json",
  "errorFilePath": "./data/ErrorLog",
  "username": "salesforceUsername@asdf.com",
  "password": "passwordAPPENDEDSECURITYTOKEN",
  "token": "",
  "instanceUrl" : ""
  }

start & end lines - where the parser will begin and end processing. This will automatically update to the next
