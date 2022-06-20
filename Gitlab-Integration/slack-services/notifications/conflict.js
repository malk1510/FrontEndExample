const utils = require("../utils");

const is_notification_needed = function (data) {
  if (data.merge_conflicts) {
    return true;
  }
  return false;
};

const build_message = function (data) {
  const message = {
    text: "",
    blocks: [],
    attachments: [],
    send_to: [],
  };

  message.text = "Merge Conflict on GitLab";

  message.blocks.push({
    type: "divider",
  });

  message.blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text:
        `There are some merge conflicts ` +
        `in <${data.merge_request_url}|${data.merge_request_name}>`,
    },
  });

  message.blocks.push(utils.get_buttons(data));

  message.send_to.push(data.author_slack_id);

  return message;
};

module.exports = {
  is_notification_needed,
  build_message,
};