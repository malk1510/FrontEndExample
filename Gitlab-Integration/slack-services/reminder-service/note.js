const { get_real_name } = require("../utils");

async function build_message (proj_id, mr_id, comment, count, mr, status) {
    let blocks = [];
    let data = {};
    let channels = [];
    data.author_slack_id = await get_real_name(comment.author.id);
    data.merge_request_name = mr.title;
    data.merge_request_url = mr.url;
    data.body = comment.body;
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `Pending Unresolved Comment on ` +
          `<${data.merge_request_url}|${data.merge_request_name}>`
      },
    });
    blocks.push({
        type: "section",
        text: {
            type: "mrkdwn",
            text: `${data.body}`
        }
    });
    channels.push(data.author_slack_id);
    return {blocks: blocks, channels: channels};
  };

  module.exports = {
    build_message
  };