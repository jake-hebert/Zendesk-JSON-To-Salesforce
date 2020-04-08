// get constants from file
const fs = require("fs");
// const readline = require("readline");

const rawConstData = fs.readFileSync("constants.json");
const constants = JSON.parse(rawConstData);

const startLine = constants.startLine;
const endLine = constants.endLine;
const filePath = constants.filePath;
const errorFilePath = constants.errorFilePath;
const username = constants.username;
const password = constants.password;
const readerOptions = {
  encoding: "utf8",
  skipEmpthLines: false,
  start: startLine,
  end: endLine,
};

let errorList = [];
/*
read lines from the source data
*/

i = 0; // tracks what line we are processing
var LineByLineReader = require("line-by-line"),
  lr = new LineByLineReader(filePath, readerOptions);

lr.on("error", function (err) {
  i++;
  // 'err' contains error object
  errorList.push({ line: startLine + i, error: err });
});

lr.on("line", function (line) {
  /*if (startLine + i >= endLine) {
    lr.close();
  } else { */
  console.log(line.substring(0, 100), i);
  let ticket = JSON.parse(line);
  console.log(ticket.url);
  console.log("Startline: ", startLine, "i: ", i, "endline ", endLine);
  i++;
  // 'line' contains the current line without the trailing newline character.
  // }
});

lr.on("end", function () {
  // All lines are read, file is closed now.
  // update constants.json for next run
  // update any errors in error file
  finishJob();
});

function finishJob() {
  const newStart = endLine;
  const newEnd = endLine + (endLine - startLine);
  let newConstObj = { ...constants };
  newConstObj.startLine = newStart;
  newConstObj.endLine = newEnd;

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
    "constants.json",
    JSON.stringify(newConstObj, null, 2),
    (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log("Constants File Updated");
    }
  );
}
