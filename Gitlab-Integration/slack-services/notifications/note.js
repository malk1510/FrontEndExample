const utils = require("../utils");

const is_notification_needed = function (data) {
  if ((data.author_id == data.note_author_id) || (utils.isDraft(data.merge_request_name)) || (utils.check_jira_status(data.project_path,data.merge_request_iid))) {
    return false;
  }
  return true;
};

const build_message = function (data) {
  const message = {
    text: "",
    blocks: [],
    attachments: [],
    send_to: [],
  };

  message.text = "New Comment on GitLab";

  message.blocks.push({
    type: "divider",
  });

  message.blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text:
        `There is a new comment on ` +
        `<${data.merge_request_url}|${data.merge_request_name}> in ` +
        `<${data.repository_url}|${data.repository_name}>`,
    },
  });

  message.blocks.push(utils.get_buttons(data));

  message.attachments.push({
    color: "#36a64f",
    author_name: data.note_author_name,
    text: data.note,
  });

  message.send_to.push(data.author_slack_id);

  return message;
};

module.exports = {
  is_notification_needed,
  build_message,
};