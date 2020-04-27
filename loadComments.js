// Literally the laziest possible way to do this... but I'm dying.

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
let token = settings.token;
let instanceUrl = settings.instanceUrl;
let errorList = [];
let zdTicketList = [];
let zdCommentList = [];
/*
read lines from the source data
*/
processComments();

function processComments() {
  i = 0; // tracks what line we are processing
  var LineByLineReader = require("line-by-line"),
    lr = new LineByLineReader(filePath);

  lr.on("error", function (err) {
    i++;
    // 'err' contains error object
    errorList.push({ line: startLine + i, error: err });
  });

  lr.on("line", function (line) {
    if (i < endLine && i >= startLine) {
      //console.log("line: ", i);
      // console.log(line);
      // console.log("Startline: ", startLine, "i: ", i, "endline ", endLine);
      let ticket = JSON.parse(line);
      let comments = ticket.comments;
      comments.forEach((comment) => {
        let zdComment = {
          zdId__c: comment.id,
          zdPlainBody__c: comment.plain_body.substring(0, 31999),
          zdPublic__c: comment.public,
          zdTicketId__c: comment.ticket_id,
          zdType__c: comment.type,
          zdAuthorId__c: comment.author_id,
          zdAuditId__c: comment.audit_id,
          zdChannel__c: comment.via.channel,
          zdFromAddress__c: comment.via.source.from.address,
          zdCreatedAt__c: comment.created_at,
          zdAttachmentInfo__c: JSON.stringify(comment.attachments).substring(
            0,
            31999
          ),
          uploadBatch__c: startLine.toString() + "comments",
        };
        zdCommentList.push(zdComment);
      });
    } else if (i >= endLine) {
      lr.close();
    }
    i++;
  });

  lr.on("end", function () {
    // All lines are read, file is closed now.
    sendToSF();
  });
}

function sendToSF() {
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

    var job = conn.bulk.createJob("ZendeskComment__c", "insert");
    var batch = job.createBatch();
    batch.execute(zdCommentList);
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
    errorFilePath + "_comments_" + startLine,
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
