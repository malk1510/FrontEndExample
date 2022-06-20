const utils = require("../utils");

const is_notification_needed = function (data) {
  return true;
};

const build_message = function (data) {
  const message = {
    text: "",
    blocks: [],
    attachments: [],
    send_to: [],
  };

  message.text = "Pipeline Event on GitLab";

  message.blocks.push({
    type: "divider",
  });

  let text = "";
  switch (data.pipeline_status) {
    case "passed":
      text =
        `Pipeline <${data.pipeline_url}|#${data.pipeline_id}> ` +
        `passed for <${data.commit_url}|${data.commit_id.slice(0, 8)}> ` +
        `in <${data.merge_request_url}|${data.merge_request_name}>`;
      break;
    case "failed":
      text =
        `Pipeline <${data.pipeline_url}|#${data.pipeline_id}> ` +
        `failed for <${data.commit_url}|${data.commit_id.slice(0, 8)}> ` +
        `in <${data.merge_request_url}|${data.merge_request_name}>`;
      break;
  }

  message.blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: text,
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