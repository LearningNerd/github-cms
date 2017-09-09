// COPIED FROM GLITCH:
// TODO: Set up with pacakge for .env for environment variables for easier local dev

// server.js
// where your node app starts

const owner = 'learningnerd';
const repo = 'github-cms';
const getGitHubApp = require('github-app');
const bodyParser = require('body-parser');
const yaml = require('js-yaml');
const requestPromise = require('request-promise-native');

const githubApp = getGitHubApp({
  // Your app id 
  id: process.env.APP_ID,
  // The private key for your app, which can be downloaded from the 
  // app's settings: https://github.com/settings/apps 
  cert: process.env.PRIVATE_KEY.replace(/\\n/g, '\n')
});

/*
// To find out the installation ID (APP_INSTALLATION)
githubApp.asApp().then(github => {
  console.log("Installations:")
  github.integrations.getInstallations({}).then(console.log);
});
*/

// Set up a GitHub app
var github;
githubApp.asInstallation(process.env.APP_INSTALLATION).then(gh => {
  github = gh;
});

// init project
var express = require('express');
var app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/", createFile);

function createFile (request, response) {
  console.log("got an edit request!");
  
  let fileName = "index.md";
  let owner = "LearningNerd";
  let repo = "github-cms";
  
  const title = request.body.title;
  const body = request.body.body;
  
  
  let branchName = `update-${Math.random().toString(36).substr(2,5)}`;  

  
    let content =
`---
title: ${title}
layout: default
---

${body}
`;
    content = new Buffer(content).toString('base64');    
  
  github.gitdata.getReference({
    owner: owner,
    repo: repo,
    ref: 'heads/master'
  }).then(refResult => {
    console.log("got ref to latest commit!");
    console.log(refResult);
    
    return github.gitdata.createReference({
      owner: owner,
      repo: repo,
      ref: `refs/heads/${branchName}`,
      sha: refResult.data.object.sha
    });
        
  }).then(newBranchResult => {
    console.log("created branch!");
    console.log(newBranchResult); 
    
    return github.repos.getContent({
      owner: owner,
      repo: repo,
      path: fileName,     
      branch: "master",
      ref: "master"
    });
    
  }).then(fileContentsResult => {
    console.log("got content!");
    console.log(fileContentsResult);      
    
    return github.repos.updateFile({
      owner: owner,
      repo: repo,
      path: fileName,      
      branch: branchName,
      sha: fileContentsResult.data.sha,
      content: content,
      message: `Edited page: ${fileName}`    
    });
  }).then(updateFileResult => {
    console.log("updated file!");
    console.log(updateFileResult);
    
    return github.pullRequests.create({
      owner: owner,
      repo: repo,
      title: `Someone edited the page!`,
      head: branchName,
      base: 'master',
      body: `Someone edited the page!`
    });
  }).then(pullRequestResult => {
    console.log("created pull request!");
    console.log(pullRequestResult);
    response.redirect('https://learningnerd.com/github-cms/confirmation.html');
  }).catch(error => {
    console.log(error);
    response.redirect('https://learningnerd.com/github-cms/confirmation.html');
  });
      
}


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
