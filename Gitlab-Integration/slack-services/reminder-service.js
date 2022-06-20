const cron = require("node-cron");
const merge_request = require("./reminder-service/merge-request");
const { callback_func_with_auth, check_jira_status, send_message} = require("./utils");
const note = require("./reminder-service/note");

const start_mrs = async function (api) {
  cron.schedule(process.env.REMINDER_SCHEDULE, async () => {
    let prev_date = (new Date(new Date().getTime() - process.env.REMINDER_THRESHOLD*1000*3600)).toISOString();
    let mr_list = await callback_func_with_auth(`https://gitlab.com/api/v4/merge_requests?updated_before=${prev_date}&state=opened`, process.env.GITLAB_TOKEN);
    let text = `PENDING MERGE REQUEST:`;
    if(mr_list.length > 0){
    let message = {
      text: text,
      blocks: [],
      channels: []
    };
    let count = 0;
    for(let i=0; i<mr_list.length; i++){
        let mr = mr_list[i];
        let mr_id = mr.iid;
        let proj_id = mr.project_id;
        let proj_path = await callback_func_with_auth(`https://gitlab.com/api/v4/projects/${proj_id}`, process.env.GITLAB_TOKEN).path_with_namespace;
        let status = await get_full_status({project_id: proj_id, iid: mr_id, path: proj_path}, api);
        if(merge_request.is_valid(status)){
            count++;
            let item = await merge_request.build_message(proj_id, mr_id, mr, count, status);
            message.blocks = item.blocks;
            message.send_to = item.channels;
            await send_message(message, api);
          }
        }
    console.log("Reminders Sent");}
  });
};

const start_comments = async function (api) {
  cron.schedule(process.env.REMINDER_SCHEDULE, async () => {
    let prev_date = (new Date(new Date().getTime() - time)).toISOString();
    let mr_list = await callback_func_with_auth(`https://gitlab.com/api/v4/merge_requests?updated_before=${prev_date}&state=opened`, process.env.GITLAB_TOKEN);
    let text = `PENDING UNRESOLVED COMMENT:`;
    let message = {
      text: text,
      blocks: [],
      channels: channel
    };
    let count = 0;
    if(mr_list.length>0){
    for(let i=0; i<mr_list.length; i++){
        let mr = mr_list[i];
        let page = 1;
        let mr_id = mr.iid;
        let proj_id = mr.project_id;
        let proj_path = await callback_func_with_auth(`https://gitlab.com/api/v4/projects/${proj_id}`, process.env.GITLAB_TOKEN).path_with_namespace;
        let status = await get_full_status({project_id: proj_id, iid: mr_id, path: proj_path}, api);
        if(merge_request.is_valid(status)){
            while(true){
              let comments_in_mr = await callback_func_with_auth(`https://gitlab.com/api/v4/projects/${proj_id}/merge_requests/${mr_id}/discussions?page=${page}`, process.env.GITLAB_TOKEN);
              page++;
              if(comments_in_mr.length == 0)
                break;
              for(let j=0; j<comments_in_mr.length; j++){
                let comment = comments_in_mr[j].notes[0];
                if(comment.resolvable && !comment.resolved){
                  count++;
                  let item = await note.build_message(proj_id, mr_id, comment, count, mr, status);
                  message.blocks = item.blocks;
                  message.send_to = item.channels;
                  await send_message(message,api);
            }
          }
        }
      }
    }
  console.log('Comment Reminder Sent');}
  });
};

module.exports = { start_mrs, start_comments };