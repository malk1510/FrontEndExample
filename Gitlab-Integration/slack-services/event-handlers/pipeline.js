const utils = require("../utils");

const is_relevant = function (event_data) {
  let relevant = false;
  const trigger_source = event_data.object_attributes.source;
  if ("merge_request_event" == trigger_source) {
    relevant = true;
  }
  return relevant;
};

const is_merge_ready_event = function (event_data) {
  const pipeline_status = event_data.object_attributes.status;
  const pipeline_passed = pipeline_status == "passed";
  return pipeline_passed;
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

  data.merge_request_name = event_data.merge_request.title;
  data.merge_request_url = event_data.merge_request.url;

  data.commit_id = event_data.commit.id;
  data.commit_url = event_data.commit.url;

  data.pipeline_status = event_data.object_attributes.status;
  data.pipeline_id = event_data.object_attributes.id;
  data.pipeline_url = [
    event_data.project.web_url,
    "pipelines",
    event_data.object_attributes.id,
  ].join("/");

  let response = await api.gitlab.MergeRequests.show(
    event_data.project.id,
    event_data.merge_request.iid
  );
  data.author_slack_id = await utils.get_slack_id(response.author.id, api);

  data.draft = utils.isDraft(data.merge_request_name);

  return [data];
};

module.exports = {
  is_relevant,
  get_info,
  is_merge_ready_event,
  get_data,
};