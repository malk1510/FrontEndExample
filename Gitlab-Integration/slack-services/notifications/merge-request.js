const utils = require("../utils");

const is_notification_needed = function (data) {
  if (data.action == "update" && data.reviewer_slack_ids.length == 0 && (utils.isDraft(data.merge_request_name) || utils.check_jira_status(data.project_path,data.merge_request_iid))) {
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

  message.text = "Merge Request Event on GitLab";

  message.blocks.push({
    type: "divider",
  });

  let text = "";
  switch (data.action) {
    case "open":
      text =
        `New merge request <${data.merge_request_url}|${data.merge_request_name}> ` +
        `in <${data.repository_url}|${data.repository_name}>`;
      message.send_to = data.reviewer_slack_ids;
      break;
    case "reopen":
      text =
        `Merge request <${data.merge_request_url}|${data.merge_request_name}> ` +
        `in <${data.repository_url}|${data.repository_name}> has been reopened`;
      message.send_to = data.reviewer_slack_ids;
      break;
    case "update":
      message.send_to = data.reviewer_slack_ids;
      break;
    case "close":
      text =
        `Merge request <${data.merge_request_url}|${data.merge_request_name}> ` +
        `in <${data.repository_url}|${data.repository_name}> has been closed`;
      message.send_to.push(data.author_slack_id);
      break;
    case "approved":
      text =
        `Merge request <${data.merge_request_url}|${data.merge_request_name}> ` +
        `in <${data.repository_url}|${data.repository_name}> has been approved`;
      message.send_to.push(data.author_slack_id);
      break;
    case "unapproved":
      text =
        `Merge request <${data.merge_request_url}|${data.merge_request_name}> ` +
        `in <${data.repository_url}|${data.repository_name}> has been unapproved`;
      message.send_to.push(data.author_slack_id);
      break;
    case "merge":
      text =
        `Merge request <${data.merge_request_url}|${data.merge_request_name}> ` +
        `in <${data.repository_url}|${data.repository_name}> has been merged`;
      message.send_to.push(data.author_slack_id);
      break;
  }

  if (text.length) {
    message.blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: text,
      },
    });
  }

  if (data.action == "open") {
    message.blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `${data.author_name} requested to merge ` +
          `<${data.source_url}|${data.source_branch}> into ` +
          `<${data.target_url}|${data.target_branch}>`,
      },
    });
  } else if (data.action == "update" && data.marked_ready) {
    message.blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `Merge request <${data.merge_request_url}|${data.merge_request_name}> ` +
          `in <${data.repository_url}|${data.repository_name}> has been marked as ready`,
      },
    });
  } else if (data.action == "update") {
    message.blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `Merge request <${data.merge_request_url}|${data.merge_request_name}> ` +
          `in <${data.repository_url}|${data.repository_name}> has been updated`,
      },
    });
  }

  if (
    (data.action == "open" || data.action == "update") &&
    data.commits.length
  ) {
    const attachment_blocks = [];
    const commits = data.commits.slice(0, 3);
    for (let commit of commits) {
      attachment_blocks.push({
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `<${commit.url}|${commit.id}>:  ${commit.title}`,
          },
          {
            type: "mrkdwn",
            text: ` - ${commit.author_name}`,
          },
        ],
      });
    }
    message.attachments.push({
      color: "#36a64f",
      blocks: attachment_blocks,
    });
  }

  message.blocks.push(utils.get_buttons(data));

  return message;
};

module.exports = {
  is_notification_needed,
  build_message,
};