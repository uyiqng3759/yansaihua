const Template = require('../../template');

class Main extends Template {
    constructor() {
        super()
        this.title = "京东热爱奇旅助力"
        // this.cron = "12 0,13 * * *"
        this.help = 'main'
        this.task = 'local'
        this.import = ['jdLog618', 'jdUrl']
        this.verify = 1
    }

    async prepare() {
        this.risk = new this.modules.jdLog618()
        this.funcName = 'promote'
        await this.risk.init({
            type: 3,
            "sceneid": 'RAhomePageh5',
        })
        for (let cookie of this.cookies['help']) {
            var getTaskDetail = await this.curl({
                'url': `https://api.m.jd.com/client.action`,
                'form': `functionId=${this.funcName}_getTaskDetail&client=m&clientVersion=-1&appid=signed_wh5&body=${this.dumps(await this.risk.body({}))}`,
                cookie,
            })
            let ss = await this.curl({
                'url': 'https://api.m.jd.com/client.action',
                'form': 'functionId=getEncryptedPinColor&client=wh5&clientVersion=1.0.0&body={}',
                cookie,
            })
            if (this.haskey(getTaskDetail, 'data.result.inviteId')) {
                this.shareCode.push({mpin: ss.result, 'inviteId': getTaskDetail.data.result.inviteId})
            }
        }
    }

    async main(p) {
        let cookie = p.cookie
        let getHomeData = await this.curl({
                'url': `https://api.m.jd.com/client.action`,
                'form': `functionId=${this.funcName}_getHomeData&client=m&clientVersion=-1&appid=signed_wh5&body={}`,
                cookie,
            }
        )
        let secretp = this.haskey(getHomeData, 'data.result.homeMainInfo.secretp')
        let collect = await this.curl({
                'url': `https://api.m.jd.com/client.action`,
                'form': `functionId=collectFriendRecordColor&client=wh5&clientVersion=1.0.0&body={"mpin":"${p.inviter.mpin}","businessCode":"20136","assistType":"2","shareSource":1}`,
                cookie,
            }
        )
        let s = await this.curl({
            url: `https://api.m.jd.com/client.action`,
            form: `functionId=promote_collectScore&client=m&clientVersion=-1&appid=signed_wh5&body=${
                this.dumps(await this.risk.body({
                    "inviteId": p.inviter.inviteId,
                    secretp,
                    "actionType": "0",
                    // "isCommonDealError": true
                }))}`,
            cookie,
        })
        console.log(s.data);
        if (this.haskey(s, 'data.bizMsg').includes('不需要')) {
            this.finish.push(p.number)
        }
        // console.log("助力:", $.source.data.success)
    }
}

module.exports = Main;
