const utils = require("./utils");

const note_notification = require("./notifications/note");
const merger_notification = require("./notifications/merger");
const conflict_notification = require("./notifications/conflict");
const pipeline_notification = require("./notifications/pipeline");
const merge_request_notification = require("./notifications/merge-request");

const notifications = {
  note: note_notification,
  merger: merger_notification,
  conflict: conflict_notification,
  pipeline: pipeline_notification,
  merge_request: merge_request_notification,
};

const notify = async function (data_list, api) {
  for (let data of data_list) {
    const event_type = data.event_type;
    const notification = notifications[event_type];
    if (!data.draft) {
      if (notification.is_notification_needed(data)) {
        const notification_message = notification.build_message(data);
        const response = await utils.send_message(notification_message, api);
        console.log("Notified on Slack");
      } else {
        console.log("Notification not needed");
      }
    } else {
      console.log("Notification Muted for this MR");
    }
  }
};

module.exports = { notify };