const utils = require("../utils");

const is_relevant = function (event_data) {
  let relevant = false;
  const action = event_data.object_attributes.action;
  switch (action) {
    case "open":
    case "merge":
    case "close":
    case "reopen":
    case "update":
    case "approved":
    case "unapproved":
      relevant = true;
      break;
  }
  return relevant;
};

const is_merge_ready_event = function (event_data) {
  const action = event_data.object_attributes.action;
  switch (action) {
    case "reopen":
    case "update":
    case "approved":
      return true;
  }
  return false;
};

const get_info = function (event_data) {
  const info = {};
  info.project_id = event_data.project.id;
  info.iid = event_data.object_attributes.iid;
  info.path = event_data.project.path_with_namespace;
  return info;
};

const get_data = async function (event_data, api) {
  const data = {};

  data.event_type = event_data.object_kind;

  data.repository_name = event_data.repository.name;
  data.repository_url = event_data.repository.homepage;

  data.merge_request_name = event_data.object_attributes.title;
  data.merge_request_url = event_data.object_attributes.url;

  const author_id = event_data.object_attributes.author_id;
  data.author_name = await utils.get_slack_name(author_id, api);
  data.author_slack_id = await utils.get_slack_id(author_id, api);

  data.action = event_data.object_attributes.action;
  data.source_branch = event_data.object_attributes.source_branch;
  data.target_branch = event_data.object_attributes.target_branch;
  data.source_url = [
    event_data.object_attributes.source.homepage,
    "tree",
    event_data.object_attributes.source_branch,
  ].join("/");
  data.target_url = [
    event_data.object_attributes.target.homepage,
    "tree",
    event_data.object_attributes.target_branch,
  ].join("/");

  let response = await api.gitlab.MergeRequests.commits(
    event_data.project.id,
    event_data.object_attributes.iid
  );
  data.commits = [];
  for (let commit of response) {
    let commit_data = {
      author_name: commit.author_name,
      id: commit.short_id,
      title: commit.title,
      url: commit.web_url,
    };
    data.commits.push(commit_data);
  }

  response = await api.gitlab.MergeRequests.show(
    event_data.project.id,
    event_data.object_attributes.iid
  );
  data.reviewer_slack_ids = [];
  for (let reviewer of response.reviewers) {
    const reviewer_slack_id = await utils.get_slack_id(reviewer.id, api);
    data.reviewer_slack_ids.push(reviewer_slack_id);
  }

  data.marked_ready = false;
  if (
    event_data.changes.title &&
    utils.isDraft(event_data.changes.title.previous) &&
    !utils.isDraft(event_data.changes.title.current)
  ) {
    data.marked_ready = true;
  }
  data.draft = utils.isDraft(data.merge_request_name);

  const data_list = [data];

  if (data.action == "open") {
    const conflict_data = {};
    conflict_data.event_type = "conflict";
    conflict_data.merge_request_name = data.merge_request_name;
    conflict_data.merge_request_url = data.merge_request_url;
    conflict_data.draft = data.draft;
    conflict_data.author_slack_id = data.author_slack_id;
    conflict_data.merge_conflicts = await utils.has_conflicts(response, api);
    data_list.push(conflict_data);
  }

  return data_list;
};

module.exports = {
  is_relevant,
  is_merge_ready_event,
  get_info,
  get_data,
};
