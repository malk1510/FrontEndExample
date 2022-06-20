const utils = require("../utils");

const is_notification_needed = function (data) {
  if (
    data.pipeline_passed &&
    data.comments_resolved &&
    data.conflicts_resolved &&
    data.approved &&
    data.reviewer_slack_ids.length &&
    !data.draft && data.jira_done
  ) {
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

  message.text = "An MR can be merged";

  message.blocks.push({
    type: "divider",
  });

  message.blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text:
        `Merge request <${data.merge_request_url}|${data.merge_request_name}> ` +
        `is ready and can be merged`,
    },
  });

  message.blocks.push(utils.get_buttons(data));

  message.send_to = data.reviewer_slack_ids;

  return message;
};

module.exports = {
  is_notification_needed,
  build_message,
};
