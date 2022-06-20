const { default: axios } = require("axios");
const { jira_status } = require("./jira-status");

const send_message = async function (message, api) {
  for (let user_id of message.send_to) {
    await api.slack.chat.postMessage({
      channel: user_id,
      text: message.text,
      blocks: message.blocks,
      attachments: message.attachments,
    });
  }
};

const get_buttons = function (data) {
  const buttons = {
    type: "actions",
    elements: [
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "View Merge Request",
        },
        action_id: "view-merge-request",
        url: data.merge_request_url,
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "Delete",
        },
        action_id: "delete-message",
      },
    ],
  };
  return buttons;
};

const get_slack_id = async function (gitlab_id, api) {
  let response_data = await api.gitlab.Users.show(gitlab_id);
  email = response_data.public_email;

  response_data = await api.slack.users.lookupByEmail({
    email: email,
  });
  slack_id = response_data.user.id;

  return slack_id;
};

const get_slack_name = async function (gitlab_id, api) {
  let response_data = await api.gitlab.Users.show(gitlab_id);
  email = response_data.public_email;

  response_data = await api.slack.users.lookupByEmail({
    email: email,
  });
  slack_name = response_data.user.real_name;

  return slack_name;
};

const isDraft = function (merge_request_name) {
  let pattern = /^draft:|^\(draft\)|^\[draft\]/i;
  return pattern.test(merge_request_name);
};

const poll_api = async function (merge_request, api) {
  const accepted_params = ["can_be_merged", "cannot_be_merged"];
  let response = await api.gitlab.MergeRequests.show(
    merge_request.project_id,
    merge_request.iid
  );
  while (accepted_params.includes(response.merge_status) == false) {
    response = await api.gitlab.MergeRequests.show(
      merge_request.project_id,
      merge_request.iid
    );
  }
  return response;
};

const has_conflicts = async function (merge_request, api) {
  const response = await poll_api(merge_request, api);
  const merge_status = response.merge_status;
  const conflicts = merge_status == "cannot_be_merged";
  return conflicts;
};


const get_full_status = async function (info, api) {
  const data = {};
  let response = await poll_api(info, api);

  data.merge_request_name = response.title;
  data.merge_request_url = response.web_url;

  data.reviewer_slack_ids = [];
  for (let reviewer of response.reviewers) {
    const reviewer_slack_id = await get_slack_id(reviewer.id, api);
    data.reviewer_slack_ids.push(reviewer_slack_id);
  }

  data.comments_resolved = response.blocking_discussions_resolved;
  data.conflicts_resolved = response.merge_status == "can_be_merged";
  data.pipeline_passed = false;
  if (
    response.head_pipeline != null &&
    response.head_pipeline.status == "passed"
  ) {
    data.pipeline_passed = true;
  }

  response = await api.gitlab.MergeRequestApprovals.approvalState(
    info.project_id,
    info.iid
  );
  data.approved = true;
  if (response.approval_rules_overwritten) {
    for (let rule of response.rules) {
      data.approved = data.approved && rule.approved;}}
  data.draft = isDraft(data.merge_request_name);
  data.jira_done = check_jira_done(info.path, info.iid);
  data.jira_progress = check_jira_status(info.path, info.iid);
  return data;
};

async function get_reviewers(project_id, mr_iid){
    let reviewer_list = [];
    let link = `https://gitlab.com/api/v4/projects/${project_id}/merge_requests/${mr_iid}`;
    let response = await callback_func_with_auth(link, process.env.GITLAB_USERS_TOKEN);

    let reviewers = response.reviewers;
    for(let i=0; i<reviewers.length; i++){
        let name = await get_real_name(reviewers[i].id);
        reviewer_list.push(name);
    }

    return reviewer_list;

}

async function get_assignees_using_mr_request(project_id, mr_iid){
  let assignee_list = [];
  let link = `https://gitlab.com/api/v4/projects/${project_id}/merge_requests/${mr_iid}`;

  let response = await callback_func_with_auth(link, process.env.GITLAB_USERS_TOKEN);

  let assignees = response.assignees;
  for(let i=0; i<assignees.length; i++){
      let name = await get_real_name(assignees[i].id);
      assignee_list.push(name);
  }

  return assignee_list;  
}

async function jira_api_call(link){
    const response = await axios.get(link, {
        headers:{
            'Content-Type':'application/json'
        },
        auth:{
            username: process.env.JIRA_EMAIL_ID,
            password: process.env.JIRA_PASSWORD
        }
    });
    return response.data;
}

async function callback_func_with_auth(link, token){
    const response = await axios.get(link, {
        headers: {
            authorization: `Bearer ${token}`
        }
    });
    return response.data;
}

async function get_email(user_id){
    let temp = await callback_func_with_auth(`https://gitlab.com/api/v4/users/${user_id}`, process.env.GITLAB_USERS_TOKEN);
    return temp.public_email;
}

async function get_real_name_using_email(email){
    let temp = await callback_func_with_auth(`https://slack.com/api/users.lookupByEmail?email=${email}`, process.env.SLACK_TOKEN);
    return temp.user.id;
}

async function get_real_name(user_id){
    let email = await get_email(user_id);
    let real_name = "";
    if(email !== null){
        real_name = await get_real_name_using_email(email);
    }
    return real_name;
}
function check_jira_done(proj_path, mr_id){
  let [namespace, name] = proj_path.split('/');
  let proj_id = `${namespace}%2F${name}`;
  if(jira_status.proj_id != undefined){
    if(jira_status.proj_id.mr_id == 'Done')
      return true;
  }
  return false;
}
function check_jira_status(proj_path, mr_id){
  let [namespace, name] = proj_path.split('/');
  let proj_id = `${namespace}%2F${name}`;
  if(jira_status.proj_id != undefined){
    if(jira_status.proj_id.mr_id != 'To Do')
      return true;
  }
  return false;
}

module.exports = {
  send_message,
  get_buttons,
  get_slack_id,
  get_slack_name,
  isDraft,
  get_assignees_using_mr_request,
  get_reviewers,
  jira_api_call,
  callback_func_with_auth,
  check_jira_status,
  get_real_name,
  get_full_status,
  check_jira_done,
  has_conflicts
};
