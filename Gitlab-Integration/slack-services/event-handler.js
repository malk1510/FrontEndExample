const utils = require("./utils");

const note_event_handler = require("./event-handlers/note");
const push_event_handler = require("./event-handlers/push");
const pipeline_event_handler = require("./event-handlers/pipeline");
const merge_request_event_handler = require("./event-handlers/merge-request");

const handlers = {
  note: note_event_handler,
  push: push_event_handler,
  pipeline: pipeline_event_handler,
  merge_request: merge_request_event_handler,
};

const valid_event = function (event_data) {
  const event_type = event_data.object_kind;
  if (!(event_type in handlers)) {
    return false;
  }
  const handler = handlers[event_type];
  if (!handler.is_relevant(event_data)) {
    return false;
  }
  return true;
};

const get_data = async function (event_data, api) {
  const event_type = event_data.object_kind;
  const handler = handlers[event_type];
  const data = await handler.get_data(event_data, api);
  return data;
};

const is_merge_ready_event = function (event_data) {
  const event_type = event_data.object_kind;
  const handler = handlers[event_type];
  return handler.is_merge_ready_event(event_data);
};

const get_merger_data = async function (event_data, api) {
  const event_type = event_data.object_kind;
  const handler = handlers[event_type];
  const info = handler.get_info(event_data);
  const data = await utils.get_full_status(info, api);
  data.event_type = "merger";
  return [data];
};

module.exports = {
  valid_event,
  get_data,
  is_merge_ready_event,
  get_merger_data,
};