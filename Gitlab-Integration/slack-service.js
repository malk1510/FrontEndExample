const { Gitlab } = require("@gitbeaker/node");
const { WebClient } = require("@slack/web-api");

const dailySummary = require("./slack-services/daily-summary");
const reminderService = require("./slack-services/reminder-service");

const asyncReminderService = require("./slack-services/async-reminder-service");

const eventHandler = require("./slack-services/event-handler");
const notificationService = require("./slack-services/notification-service");
const jira_event_manager = require("./slack-services/jira_event_manager");

const api = {
  slack: new WebClient(process.env.SLACK_TOKEN),
  gitlab: new Gitlab({
    token: process.env.GITLAB_TOKEN,
  }),
};

const start = async function () {

  reminderService.start_mrs(api);
  reminderService.start_comments(api);
  console.log("Reminder Service started");

  dailySummary.start(api);
  console.log("Daily Summaries started");

  asyncReminderService.start_mrs(api);
  asyncReminderService.start_comments(api);
  console.log("Async Reminders Started")

  jira_event_manager.hourly_sync();
  console.log("Jira Hourly Update");
};

const process_event = async function (event_data) {

  if (eventHandler.valid_event(event_data)) {
    const data = await eventHandler.get_data(event_data, api);
    await notificationService.notify(data, api);
    
    if (eventHandler.is_merge_ready_event(event_data)) {
      const data = await eventHandler.get_merger_data(event_data, api);
      await notificationService.notify(data, api);
    }  
  }
  else if(jira_event_manager.valid_jira_event(event_data)){
    await jira_event_manager.status_update(event_data, api);
  }
  else{
    console.log('No Necessary Notification');
  }
};

const process_interaction = async function (interaction_data) {
  const channel = interaction_data.channel.id;
  const message_ts = interaction_data.message.ts;
  const action_id = interaction_data.actions[0].action_id;
  if (action_id == "delete-message") {
    await api.slack.chat.delete({
      channel: channel,
      ts: message_ts,
    });
  }
};

module.exports = {
  start,
  process_event,
  process_interaction
};
