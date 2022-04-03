/*
搞鸡玩家-秒秒币
Last Modified time: 2022-1-21
活动入口：京东 首页秒杀
更新地址：jd_ms.js
已支持IOS双京东账号, Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, 小火箭，JSBox, Node.js
============Quantumultx===============
[task_local]
#搞鸡玩家-秒秒币
20 7 * * * jd_ms.js, tag=搞鸡玩家-秒秒币, img-url=, enabled=true

================Loon==============
[Script]
cron "20 7 * * *" script-path=jd_ms.js, tag=搞鸡玩家-秒秒币

===============Surge=================
搞鸡玩家-秒秒币 = type=cron,cronexp="20 7 * * *",wake-system=1,timeout=3600,script-path=jd_ms.js

============小火箭=========
搞鸡玩家-秒秒币 = type=cron,script-path=jd_ms.js, cronexpr="20 7 * * *", timeout=3600, enable=true
 */
const $ = new Env('搞鸡玩家-秒秒币');

const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
var timestamp = Math.round(new Date().getTime()).toString();
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message;
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {
  };
  if(JSON.stringify(process.env).indexOf('GITHUB')>-1) process.exit(0)
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/client.action';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
    return;
  }
  for (let i = 0; i < 15; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1])
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      message = '';
      // await TotalBean();
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/`, {"open-url": "https://bean.m.jd.com/"});

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue
      }
      await tttsign()
      await jdMs()
    }
  }
})()
    .catch((e) => {
      $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
      $.done();
    })

async function jdMs() {
  $.score = 0
  await getActInfo()
  await getUserInfo()
  await getActInfo()
  $.cur = $.score
  if ($.encryptProjectId) {
    console.log(`领红包签到`)
    await readpacksign()
    await getTaskList()
  }
  await getUserInfo(false)

  await showMsg()
}

function getActInfo() {
  return new Promise(resolve => {
    $.post(taskPostUrl('assignmentList', {}, 'appid=jwsp'), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err},${jsonParse(resp.body)['message']}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            if (data.code === 200) {
              $.encryptProjectId = data.result.assignmentResult.encryptProjectId
              console.log(`活动名称：${data.result.assignmentResult.projectName}`)
              sourceCode = data.result.sourceCode
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
function getUserInfo(info=true) {
  return new Promise(resolve => {
    $.post(taskPostUrl('homePageV2', {"random":"58706661","log": `${Date.now()}~1ywimbm`}, 'appid=SecKill2020'), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err},${jsonParse(resp.body)['message']}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            if (data.code === 2041) {
              $.score = data.result.assignment.assignmentPoints || 0
               console.log(`当前秒秒币${$.score}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function getTaskList() {
  let body = {"encryptProjectId": $.encryptProjectId, "sourceCode": "wh5"}
  return new Promise(resolve => {
    $.post(taskPostUrl('queryInteractiveInfo', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err},${jsonParse(resp.body)['message']}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            $.risk = false
            if (data.code === '0') {
              for (let vo of data.assignmentList) {
                if($.risk) break
                if (vo['completionCnt'] < vo['assignmentTimesLimit']) {
                  if (vo['assignmentType'] === 1) {
                    if(vo['ext'][vo['ext']['extraType']].length === 0) continue;
                    for (let i = vo['completionCnt']; i < vo['assignmentTimesLimit']; ++i) {
                      console.log(`去做${vo['assignmentName']}任务：${i + 1}/${vo['assignmentTimesLimit']}`)
                      let body = {
                        "encryptAssignmentId": vo['encryptAssignmentId'],
                        "itemId": vo['ext'][vo['ext']['extraType']][i]['itemId'],
                        "actionType": 1,
                        "completionFlag": ""
                      }
                      await doTask(body)
                      await $.wait(vo['ext']['waitDuration'] * 1000 + 500)
                      body['actionType'] = 0
                      await doTask(body)
                    }
                  } else if (vo['assignmentType'] === 0) {
                    for (let i = vo['completionCnt']; i < vo['assignmentTimesLimit']; ++i) {
                      console.log(`去做${vo['assignmentName']}任务：${i + 1}/${vo['assignmentTimesLimit']}`)
                      let body = {
                        "encryptAssignmentId": vo['encryptAssignmentId'],
                        "itemId": "",
                        "actionType": "0",
                        "completionFlag": true
                      }
                      await doTask(body)
                      await $.wait(1000)
                    }
                  } else if (vo['assignmentType'] === 3) {
                    for (let i = vo['completionCnt']; i < vo['assignmentTimesLimit']; ++i) {
                      console.log(`去做${vo['assignmentName']}任务：${i + 1}/${vo['assignmentTimesLimit']}`)
                      let body = {
                        "encryptAssignmentId": vo['encryptAssignmentId'],
                        "itemId": vo['ext'][vo['ext']['extraType']][i]['itemId'],
                        "actionType": 0,
                        "completionFlag": ""
                      }
                      await doTask(body)
                      await $.wait(1000)
                    }
                  }
                }
              }
            } else {
              console.log(data)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function doTask(body) {
  body = {...body, "encryptProjectId": $.encryptProjectId, "sourceCode": sourceCode,  "ext": {},"extParam":{"businessData":{"random":56020835},"signStr":"1648970152982~1eLfh6VJqunMDF5bWhIbTAxMQ==.SFtccFROXVl8WUlYXzYoD15bBSNIXywLE0hBXmRaVVwWehNIEw0gVRUrGisCTx8aFyEwHC0CIwMdHj0sBw==.307e7ce3~7,1~D6AA2E890396507B233F490FB4706CDFD6E6DAFD~0g8obcy~C~SRJHWREKY2wcEUJcXRAKbxBUBh0Kbx94eBxjfx9RFEUSHxRWBx8JYx54eRxgeR9RHkQRGBFUCRwJaxp6eh5lDB5FH0QRZR8SVUJdFgkEFBNDQBQIEgMGAAoJBAACDQMFAQcABgsGGh0SRFNWEggSQEZER0RVTVUSHhJEUVISAhNWVUJGREZFVRAcEUBXVhEKaQgfBQAFCx0GHwEeAR4FaR4SWVoRAgAcEFNAFgkSAAZUAlUHVVYAVgUBVwEADQUDAVUDUQMJDwhTUgJRBFASGBBeQxIJGlpgWl9dUREcGkUSCQcEBAoJAwIBBgIKAAEcEFpYFgkSCwYACg4LA1NUDVEFC1IEWlUEVwQEBQIEC1MEVQAKBAoCVwQIAAdVDBEcEFZDVhEKGlRYC1p0QlFfAkBCbHx6SXZ6fEpDQkZxGh0SXUAQChBxREJcVhBwV15AR0RWRh8QcV9THRQeElxRQhAKEQEFDwoGChIfFkBTShMKaA8ABh4EBgptHxJBVxEKaRJaZFtfVlQBABoGEh4SXX1jERwRCQceABIfFgIAFgUeAxQeEgMGAwsGCxIfGgAHAgkLDQBRXAhTBg5QB1BWAFcEBAECDABSBlYFDAcIClIGCwUFVgYSGBBREW0fGlpfUxIJFlVWXldWVUJGEh4SVVgSCRJGGh8SUVkRDhFHCx8EHQQQHBBTUm1GEQoRCAISHhJRUBEKGkNRXVJdXQ8FAgICAwgADREcEF1ZFglrCR0AHwZvHBBSWF1XEQoRCQUECgkEBAIECwgAA0gDZVoIUlVpRlIBdH50dH9kYwJ4bktxS3hzDQ8eUgAJaVYBDQdSA1wBbmtYTGdkX0N1cwZyd0pAAXNhCUt7ZlgCcgFEAWhdVGJRY14ffkV1ZnVnV2ZyWwAYdVl9XXwDXGZTV3N/fkhfWXZyYQFWSkdcV3BmDHdjUFx7V1l+bHFxdlZZeX5UdkdSd0sAQHNxWEFiWWN5d3MEa3RUAAF3c2F9dVR9F3hyaV96ZwJoUlhqBndUfUN+WgQAeEl5QXhyB2Z6WXNad2AJQmBJX1t6Wwhad3d9W3lXalp6RwZHdVxTVnRaV317SHZSUkp1V3hyWEdicmtAf2FlRFZJeX5zSGl2d1QEC2FIXE5lY0Vlc2ZhQHkBeRhzA1tbbXFiSWZKYVtWWXNYcXZbR1FiX395AQVFZXJhdnlYdlVzWGAIeQNXdXdyCEt3en1jUlt1DnB0WEEcBVQABwcFAFFNQR8BTE5Ndk1jUH9iZGR3e3d2eXB4RH1ncEt6YHVUX2BnanxUdnADdHdXR2Z1cUdhanFxeXVyfXpxaXxje154YWRdDXp1RFdgeUR1ZnhhdnB1aV5hdl4GZGV1eWBzW3FxcERxc3FicWJ4endidkFBYXdbAA9OA0cCDwJXBBIfFl5DXxMKERRP~1jr2al1","sceneid":"MShPageh5"} }
  return new Promise(async resolve => {
    await $.wait(480 * 1000)
    $.post(taskPostUrl('doInteractiveAssignment', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err},${jsonParse(resp.body)['message']}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            console.log(data.msg)
            if(data.msg==='风险等级未通过') $.risk =1
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

function tttsign() {
  return new Promise(resolve => {
    body = 'appid=babelh5&body=%7B%22encryptProjectId%22%3A%224NzhoLbAJtBXbyRj5zGwprtf6GDv%22%2C%22encryptAssignmentId%22%3A%223yRMFkp3SN8nXpX49xAdCWsdy5XP%22%2C%22completionFlag%22%3Atrue%2C%22itemId%22%3A%221%22%2C%22sourceCode%22%3A%22aceaceqingzhan%22%7D&sign=11&t=1642929553660'
    $.post(ttt(body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err},${jsonParse(resp.body)['message']}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            if (data.code === 0) {
              rewardsInfo = data.rewardsInfo.failRewards[0].msg
              console.log(`${rewardsInfo}`)
            }else console.log(data.msg)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
function readpacksign() {
  return new Promise(resolve => {
    body = 'uuid=88888&clientVersion=10.3.4&client=wh5&osVersion=&area=4_48201_54794_0&networkType=unknown&functionId=signRedPackage&body={"random":"27934247","log": "1648951181930~1qPjY2EPuRtMDFqaWpkcjAxMQ==.W19eXEtfWFpdQl5QXRpCXTEIAgM8AgseDFtFXEhBRlsUVgxbFwEJA1ItHSxBIRwHHkATDFtUJgYcXSgjFA==.f225ffd8~3,2~658D7B4782BB245DAAFF2A01F3E7B3B90B25BE7D4F4D1847A16DEA5439EDCE24~0a48kfa~C~ThNHWxAPam4aEEFfXhQIbhNXAx8MfR93dRkDB2UeVB1HFB4XVQQbC3kdcnEeBwd3GlMZRREaEFEAHg9+GXB0GgANAh9DHkETbhoQUkNdFAgBHRFFQRcLEQcEAQkKAwMEBgQDAwQABwAAFx0RQVdREwkURkFFR0JUQFcRGhBCVFIUCBdXVUJGQUVGVxAZE0NSXBcLaAEeBAYKGgoZCR8HHgBsHxRYXxMJBR4XUkAUCBcIBFVQDQhRUFNRCVEBBwZVA1cHDFUEVAoBBVEBCwNUURQeF19DFAgXWGNeXVtUERoQQRMJBwQBCQoDAwQJAg8BBR0RXFkXCxEEBwYCUAZUBQAFUwtWAlIHClQGBAcFUVMFVwsHCAAPAwZUAFQHVwUHFB4XV0NUEA8TWFtDDXVEfgF+RF5MAExUAgZmWUQEemMXHRFYRBcLEXdCRV1WFnFaXENDRlBDHxZ7W1IdFB4XX1JAEA8TAgAKBQAHFB4XQlBEEA9qCwIGGQIKBm8ZE0FZEA9qEV9iXV5dUwMGHQEUHhdYfGUQGRMCAhwNHwIUHhcAAxgGGwcRGhAEBwsGAwETHxQAAAIAVQJTAQIAVwxSAFcDDVAEAQMCVVEAUwwDCgULBAJWBVAAUwcCEBkTUhRvGRNaWVMXCxFQVFNXVVBGQRMfFFNfEwkURxcdEVVbFwsRQQEbAx0CEBkTUFBtQxMJFAIEEx8UUFETCRRAVF9XWV8IAwQPAQEDBwEQGRNeXBAPagIaAhkBbhoQV11cURAPEwIABg0IBgcCDQYBBwNLAEliYldaCn58WGF+cnRAUF5SZWJ1ck58dAwOGGoESWdUX3NQa3B8XlN1A1FjYlR3ZEJ4AHkAQWlrcHMDe1tedX1pQ09jWUJpb3FvV3V3a0JwYVUdY3ZqBHAEVn56WHtmY3RRRnhxWXN5XHIPelJCVHNLBVR2d2cCd2IPYXR2C3RxUghhfGZ4Hnl0e3h8Sg5wcANQZ3h0dGt5RVpkeUFGWWhlRUZ+SGJPYnRCZnFlRnliYnthcnVRS3FGYkZ4BFZ5cABjZXV3DwgfBAUDBQRVUApLSR8HTEtPcUhmZ2NrcnBna3VwXXJ2YlJ2c2NlYnRkfGtySmRVdVELcndEQWdzWlhjdE1gd3BFdHlmd1VjeXFgU2BLX3d3QgRydFVkZHRea213dV1ncklYYGp3fFFyYHx5dWdkYnNUc2VhWWFjdHRGZGQCRgxNBlhfQgRHUxcdEVtBUhMJFBBI~1m3b8c6","sceneid":"MShPageh5","ext":{"platform":"1","eid":"","referUrl":-1,"userAgent":-1}}&appid=SecKill2020'
    $.post(readpack(body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err},${jsonParse(resp.body)['message']}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data)
            if (data.code === 200) {
              rewardsInfo = data.result.assignmentResult.msg
              console.log(`${rewardsInfo}`)
            }else console.log("今日签到红包已领")
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
function showMsg() {
  return new Promise(resolve => {
    message += `本次运行获得秒秒币${$.score-$.cur}枚，共${$.score}枚`;
    $.msg($.name, '', `京东账号${$.index}${$.nickName}\n${message}`);
    resolve()
  })
}
function ttt(body) {
  let url = `${JD_API_HOST}client.action?functionId=doInteractiveAssignment`;
  return {
    url,
    body: body,
    headers: {
      "Cookie": cookie,
      "origin": "https://prodev.m.jd.com",
      'Content-Type': 'application/x-www-form-urlencoded',
      "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
    }
  }
}
function readpack(body) {
  let url = `${JD_API_HOST}client.action`;
  return {
    url,
    body: body,
    headers: {
      "Cookie": cookie,
      "origin": "https://h5.m.jd.com",
      'Content-Type': 'application/x-www-form-urlencoded',
      "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
    }
  }
}
function taskPostUrl(function_id, body = {}, extra = '', function_id2) {
  let url = `${JD_API_HOST}`;
  if (function_id2) {
    url += `?functionId=${function_id2}`;
  }
  return {
    url,
    body: `functionId=${function_id}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=1.0.0&${extra}`,
    headers: {
      "Cookie": cookie,
      "origin": "https://h5.m.jd.com",
      "referer": "https://h5.m.jd.com/babelDiy/Zeus/49kqxHMcyh6ZgbodooSPvv6Vt5Qv/index.html",
      'Content-Type': 'application/x-www-form-urlencoded',
      "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
    }
  }
}

function TotalBean() {
  return new Promise(async resolve => {
    const options = {
      "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      "headers": {
        "Accept": "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1")
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === 13) {
              $.isLogin = false; //cookie过期
              return
            }
            if (data['retcode'] === 0) {
              $.nickName = (data['base'] && data['base'].nickname) || $.UserName;
            } else {
              $.nickName = $.UserName
            }
          } else {
            console.log(`京东服务器返回空数据`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function safeGet(data) {
  try {
    if (typeof JSON.parse(data) == "object") {
      return true;
    }
  } catch (e) {
    console.log(e);
    console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
    return false;
  }
}

function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg($.name, '', '不要在BoxJS手动复制粘贴修改cookie')
      return [];
    }
  }
}
// prettier-ignore
function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
