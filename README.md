# Zendesk-JSON-To-Salesforce

Javascript to parse a giant JSON export from zendesk and load it into SFDC

# How to use

- Run 'npm install'

- Create a file called "constants.json" in your root directory

- populate the variables that will be used for processing
  example constants.json:
  {
  "startLine": 0,
  "endLine": 200,
  "filePath": "./data/FullExport.json",
  "errorFilePath": "./data/ErrorLog",
  "username": "salesforceUsername@asdf.com",
  "password": "passwordAPPENDEDSECURITYTOKEN"
  }

start & end lines - where the parser will begin and end processing. This will automatically update to the next
