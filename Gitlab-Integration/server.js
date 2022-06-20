require("dotenv").config();

const express = require("express");
const bodyparser = require("body-parser");
const localtunnel = require("localtunnel");

const slackService = require("./slack-service");

const app = express();
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.post("/", (req, res) => {
  const event_data = req.body;
  const event_type = event_data.webhookEvent;
  console.log("Jira Issue Event:", event_type);
  slackService.process_event(event_data);
  res.sendStatus(200);
});

app.post("/gitlab/webhook-endpoint", (req, res) => {
  const event_data = req.body;
  const event_type = event_data.object_kind;
  console.log("New Event on GitLab:", event_type);
  slackService.process_event(event_data);
  res.sendStatus(200);
});

app.post("/slack/interactive-endpoint", (req, res) => {
  const interaction_data = JSON.parse(req.body.payload);
  console.log("New Interaction on Slack");
  slackService.process_interaction(interaction_data);
  res.sendStatus(200);
});

app.get("*", (req, res) => {
  res.sendStatus(200);
});

app.post("*", (req, res) => {
  res.sendStatus(200);
});

const start_server = async function () {
  const tunnel = await localtunnel({
    port: process.env.PORT,
    subdomain: process.env.TUNNEL_SUBDOMAIN,
  });
  console.log("Local tunnel URL:", tunnel.url);

  await slackService.start();
  console.log("Slack Services Started");

  app.listen(process.env.PORT, () => {
    console.log("Server running on port:", process.env.PORT);
  });
};

start_server();