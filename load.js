const fs = require("fs");

// get settings from file
const rawConstData = fs.readFileSync("settings.json");
const settings = JSON.parse(rawConstData);
const startLine = settings.startLine;
const endLine = settings.endLine;
const filePath = settings.filePath;
const errorFilePath = settings.errorFilePath;
const username = settings.username;
const password = settings.password;
const loginUrl = settings.loginUrl;
var token = settings.token;
var instanceUrl = settings.instanceUrl;
// const readerOptions = {
//   encoding: "utf8",
//   skipEmptyLines: false,
//   start: startLine,
//   end: endLine,
// };

let errorList = [];
let zdTicketList = [];
let zdCommentList = [];
/*
read lines from the source data
*/

i = 0; // tracks what line we are processing
var LineByLineReader = require("line-by-line"),
  lr = new LineByLineReader(filePath);

lr.on("error", function (err) {
  i++;
  // 'err' contains error object
  errorList.push({ line: startLine + i, error: err });
});

lr.on("line", function (line) {
  if (i + startLine < endLine && i >= startLine) {
    //console.log("line: ", i);
    // console.log(line);
    // console.log("Startline: ", startLine, "i: ", i, "endline ", endLine);
    let ticket = JSON.parse(line);
    //console.log(ticket.url);
    let zdTicket = {
      url__c: ticket.url, // str
      zendeskId__c: ticket.id, // str
      via__c: JSON.stringify(ticket.via), // JSON str
      zdCreatedAt__c: ticket.created_at, // datetime
      zdUpdatedAt__c: ticket.updated_at, // datetime
      zdSubject__c: ticket.subject, // str
      zdType__c: ticket.type, // str
      zdPriority__c: ticket.priority, // str
      zdStatus__c: ticket.status, // str
      zdHasIncidents__c: ticket.hasIncidents, // bool
      zdIsPublic__c: ticket.is_public, // bool
      zdTags__c: JSON.stringify(ticket.tags), // JSON str
      zdCustomFields__c: JSON.stringify(ticket.custom_fields),
      zdFields__c: JSON.stringify(ticket.fields),
      zdMetricSet__c: JSON.stringify(ticket.metric_set),
    };
    zdTicketList.push(zdTicket);
  } else {
    lr.close();
  }
  i++;
});

lr.on("end", function () {
  // All lines are read, file is closed now.
  sendToSF();
});

async function sendToSF() {
  var jsforce = require("jsforce");
  var conn = new jsforce.Connection({
    loginUrl: loginUrl,
  });

  if (
    instanceUrl === undefined ||
    instanceUrl === "" ||
    token === undefined ||
    token === ""
  ) {
    console.log("doing initial connection");
    conn = connectToSf(conn);
    console.log(instanceUrl);
    console.log(token);
  } else {
    conn = new jsforce.Connection({
      instanceUrl: instanceUrl,
      accessToken: token,
    });

    var job = conn.bulk.createJob("ZendeskTicketJSON__c", "insert");
    var batch = job.createBatch();
    batch.execute(zdTicketList);
    batch.on("queue", function (batchInfo) {
      // fired when batch request is queued in server.
      console.log("batchInfo:", batchInfo);
      // batchId = batchInfo.id;
      // jobId = batchInfo.jobId;
      // ...
    });

    // update settings.json for next run
    // update any errors in error file
    finishJob();
  }
}

async function connectToSf(conn) {
  conn.login(username, password, function (err, userInfo) {
    if (err) {
      return console.error(err);
    }
    // Now you can get the access token and instance URL information.
    // Save them to establish connection next time.
    console.log(conn.accessToken);
    console.log(conn.instanceUrl);
    token = conn.accessToken;
    instanceUrl = conn.instanceUrl;
    // logged in user property
    console.log("User ID: " + userInfo.id);
    console.log("Org ID: " + userInfo.organizationId);
    // ...
  });
  return conn;
}

function finishJob() {
  const newStart = endLine;
  const newEnd = endLine + (endLine - startLine);
  let newSettingsObj = { ...settings };
  newSettingsObj.startLine = newStart;
  newSettingsObj.endLine = newEnd;
  newSettingsObj.token = token;
  newSettingsObj.instanceUrl = instanceUrl;

  fs.writeFile(
    errorFilePath + "_" + startLine,
    JSON.stringify(errorList, null, 2),
    (err) => {
      if (err) {
        console.error(err);
        return;
      }
    }
  );

  fs.writeFile(
    "settings.json",
    JSON.stringify(newSettingsObj, null, 2),
    (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("settings File Updated");
    }
  );
}
