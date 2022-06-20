const utils = require("../utils");

const is_relevant = function (event_data) {
  return true;
};

const is_merge_ready_event = function (event_data) {
  return false;
};

const get_data = async function (event_data, api) {
  const ref = event_data.ref.split("/");
  const branch = ref[ref.length - 1];
  const project_id = event_data.project.id;

  const merge_request_source = await api.gitlab.MergeRequests.all({
    projectId: project_id,
    targetBranch: branch,
  });
  const merge_request_target = await api.gitlab.MergeRequests.all({
    project_id: project_id,
    sourceBranch: branch,
  });

  const merge_requests = [];
  for (let merge_request of merge_request_source) {
    merge_requests.push(merge_request);
  }
  for (let merge_request of merge_request_target) {
    merge_requests.push(merge_request);
  }

  const data_list = [];
  for (let merge_request of merge_requests) {
    const data = {};

    data.event_type = "conflict";

    data.merge_request_name = merge_request.title;
    data.merge_request_url = merge_request.web_url;

    data.merge_conflicts = await utils.has_conflicts(merge_request, api);

    const author_id = merge_request.author.id;
    data.author_slack_id = await utils.get_slack_id(author_id, api);

    data.draft = utils.isDraft(data.merge_request_name);

    data_list.push(data);
  }

  return data_list;
};

module.exports = {
  is_relevant,
  is_merge_ready_event,
  get_data,
};
