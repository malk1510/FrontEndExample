const cron = require("node-cron");
const { callback_func_with_auth, send_message } = require("./utils");

const start = function (api) {
  cron.schedule(process.env.SUMMARY_SCHEDULE, async () => {
    let open_date = new Date(new Date().getTime() - 24*60*60*1000);
    let temp = await callback_func_with_auth(`https://gitlab.com/api/v4/merge_requests?state=opened`, process.env.GITLAB_TOKEN);
    let temp2 = await callback_func_with_auth(`https://gitlab.com/api/v4/merge_requests?created_after=${open_date.toISOString()}`, process.env.GITLAB_TOKEN);
    let text = `SUMMARY:\n PENDING MERGE REQUESTS: ${temp.length}\n MERGE REQUESTS OPENED TODAY: ${temp2.length}`;
    console.log('Summary Sent');
    message = {
      text:text,
      send_to: ['Project']
    };
    await send_message(message, api);
  });
};

module.exports = { start };
