const utils = require("../utils");

const is_relevant = function (event_data) {
  let relevant = false;
  if (event_data.object_attributes.noteable_type == "MergeRequest") {
    relevant = true;
  }
  return relevant;
};

const is_merge_ready_event = function (event_data) {
  return false;
};

const get_info = function (event_data) {
  const info = {};
  info.project_id = event_data.project.id;
  info.iid = event_data.merge_request.iid;
  info.path = event_data.project.path_with_namespace;
  return info;
};

const get_data = async function (event_data, api) {
  const data = {};

  data.event_type = event_data.object_kind;

  data.repository_name = event_data.repository.name;
  data.repository_url = event_data.repository.homepage;

  data.project_path = event_data.project.path_with_namespace;
  data.merge_request_iid = event_data.merge_request.iid;

  data.merge_request_name = event_data.merge_request.title;
  data.merge_request_url = event_data.merge_request.url;

  data.author_id = event_data.merge_request.author_id;
  data.author_slack_id = await utils.get_slack_id(data.author_id, api);

  data.note = event_data.object_attributes.note;
  data.note_url = event_data.object_attributes.url;
  data.note_author_id = event_data.object_attributes.author_id;
  data.note_author_name = await utils.get_slack_name(data.note_author_id, api);

  data.draft = utils.isDraft(data.merge_request_name);

  return [data];
};

module.exports = {
  is_relevant,
  is_merge_ready_event,
  get_data,
  get_info
};