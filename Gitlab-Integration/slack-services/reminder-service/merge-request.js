const { get_reviewers, get_real_name } = require("../utils");

function is_valid(status){
  if(status.draft || status.jira_progress){
    return false;
  }
  return true;
}

async function build_message(proj_id, mr_id, mr, count, status) {
    let blocks = [];
    let channels = [];
    blocks.push({
      type: "divider",
    });

    let data = {}
    data.merge_request_url = mr.web_url;
    data.merge_request_name = mr.title;
    data.reviewer_slack_ids = await get_reviewers(proj_id, mr_id);
    data.author_slack_id = await get_real_name(mr.author.id);
  
    let text = `Pending open merge request <${data.merge_request_url}|${data.merge_request_name}>`;
    blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: text,
        },
      });
    
    if((status.jira_done) && (status.comments_resolved) && (status.conflicts_resolved) && (status.pipeline_passed) && (!status.approved)){
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Review and Approval Requested for this MR`,
        },
      });
      channels = data.reviewer_slack_ids;
      return {blocks: blocks, channels: channels};
    }
    else{
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `MR has pending unresolved issues`,
        },
      });
      channels = [data.author_slack_id];
      return {blocks: blocks, channels: channels};
    }
  };
  
  module.exports = {
    build_message,
    is_valid
  };