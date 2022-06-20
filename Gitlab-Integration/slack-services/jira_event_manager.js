const nodeCron = require("node-cron");
const { jira_status } = require("./jira-status");
const { build_message } = require("./reminder-service/merge-request");
const { jira_api_call, callback_func_with_auth, send_message, get_full_status } = require("./utils");

function valid_jira_event(trig){
    if(trig.webhookEvent!==undefined && trig.webhookEvent.substring(0,4) == 'jira'){
        return true;
    }
    return false;
}

async function status_update(event_data, api){
    let proj_link = event_data.issue.self.split("/")[2];
    let link = `https://${proj_link}/rest/dev-status/latest/issue/detail?issueId=${event_data.issue.id}&applicationType=GitLab&dataType=pullrequest`;
    let pr = await jira_api_call(link);
    if(pr.detail != undefined){
        let pr_list = pr.detail[0].pullRequests;
        for(let i=0; i<pr_list.length; i++){
            let [proj_id,mr_id] = pr_list[i].id.split('!');
            proj_id = `${proj_id.split('/')[0]}%2F${proj_id.split('/')[1]}`;
            mr_id = parseInt(mr_id);
            if(jira_status[proj_id] == undefined){
                jira_status.proj_id = {};
            }
            jira_status.proj_id.mr_id = event_data.issue.fields.status.name;
        }
        console.log("Jira Status Updated")
        if(event_data.issue.fields.status.name == 'Done'){
            await send_jira_message(pr_list, api);
        }
    }
}

function hourly_sync(){
    nodeCron.schedule(process.env.JIRA_SCHEDULE, async () => {
        let link = `https://${process.env.JIRA_TEAM}/rest/api/latest/search?maxResults=1000`;
        let issues = await jira_api_call(link);
        for(let i=0; i<issues.length; i++){
            let issue_link = `https://${process.env.JIRA_TEAM}/rest/dev-status/latest/issue/detail?issueId=${issues[i].id}&applicationType=GitLab&dataType=pullrequest`;
            let pr = await jira_api_call(issue_link);
            if(pr.detail !== undefined){
                let pr_list = pr.detail[0].pullRequests;
                for(let j=0; j<pr_list.length; j++){
                    let [proj_id, mr_id] = pr_list[j].id.split('!');
                    proj_id = `${proj_id.split('/')[0]}%2F${proj_id.split('/')[1]}`;
                    mr_id = parseInt(mr_id);
                    if(jira_status[proj_id] == undefined){
                        jira_status.proj_id = {};
                    }
                    jira_status.proj_id.mr_id = issues[i].fields.status.name;
                }
            }
        }
    });
}

async function send_jira_message(mr_list, api){
    let text = `MR Ready for Review:`;
    let message = {
      text: text,
      blocks: []
    };
    let count = 0;
    for(let i=0; i<mr_list.length; i++){
        let [proj_id, mr_id] = mr_list[i].id.split('!');
        proj_id = `${proj_id.split('/')[0]}%2F${proj_id.split('/')[1]}`;
        mr_id = parseInt(mr_id); 
        let mr = await callback_func_with_auth(`https://gitlab.com/api/v4/projects/${proj_id}/merge_requests/${mr_id}`, process.env.GITLAB_USERS_TOKEN);
        let status = await get_full_status({project_id: mr.project_id, iid: mr_id, path:mr_list[i].id}, api);
        count++;
        let item = await build_message(proj_id, mr_id, mr, count, status);
        message.blocks = item.blocks;
        message.send_to = item.channels;
        await send_message(message, api);
    }
    console.log("Ready MRs Notified")
}

module.exports = {valid_jira_event, status_update, hourly_sync};