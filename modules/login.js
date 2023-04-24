const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36"

const undici = require("undici")
const funcaptcha = require("funcaptcha")
const fs = require("fs")
const readline = require("readline")


let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

function ask(question) {
    return new Promise((resolve, reject) => {
        rl.question(question, (answer) => {
            resolve(answer)
        })
    })
}


undici.request("https://auth.roblox.com/v2/login", {
    method: "POST",
}).then(async res => {
    const csrf = res.headers["x-csrf-token"]

    const res2 = await undici.request("https://auth.roblox.com/v2/login", {
        method: "POST",
        headers: {
            "x-csrf-token": csrf,
            "content-type": "application/json",
            "user-agent": USER_AGENT
        },
        body: JSON.stringify({
            "ctype": "Username",
            "cvalue": "testaccount232y",
            "password": "5iYcmSbMUebCXTf",
        })
    })
    const body = await res2.body.json()
    setTimeout(async () => {
        const fieldData = JSON.parse(body.errors[0].fieldData)



        const token = await funcaptcha.getToken({
            pkey: "476068BF-9607-4799-B53D-966BE98E2B81",
            surl: "https://roblox-api.arkoselabs.com",
            data: {
                "blob": fieldData.dxBlob,
            },
            headers: {
                "User-Agent": USER_AGENT,
            },
            site: "https://www.roblox.com",
            location: "https://www.roblox.com/login"
        })

        let session = new funcaptcha.Session(token, {
            userAgent: USER_AGENT,
        })
        let challenge = await session.getChallenge()
        console.log(challenge.instruction)
        console.log(challenge.data.game_data.game_variant)
        console.log(challenge.data.game_data.customGUI.api_breaker)
        
        for(let x = 0; x < challenge.data.game_data.waves; x++) {
            fs.writeFileSync(`${x}.gif`, await challenge.getImage())
            console.log(await challenge.answer(parseInt(await ask("Answer: "))))
        }
        const solvedtoken = token.token // captcha Token
        const captchaProvider = "arkoselabs"
        const challengeId = challenge.data.challengeID
        const captchaId = fieldData.unifiedCaptchaId
        const blob = fieldData.dxBlob

        
        if (solvedtoken){
            const res2 = await undici.request("https://auth.roblox.com/v2/login", {
                method: "POST",
                headers: {
                    "x-csrf-token": csrf,
                    "content-type": "application/json",
                    "user-agent": USER_AGENT
                },
                body: JSON.stringify({
                    "ctype": "Username",
                    "cvalue": "testaccount232y",
                    "password": "5iYcmSbMUebCXTf",
                    "captchaId": captchaId,
                    "captchaToken": solvedtoken,
                    "captchaProvider": captchaProvider,
                    "challengeId": challengeId
                })
            })

            const body = await res2.body.json()
            console.log(`logged in as: `)
            console.log(body.user.id, body.user.name)
            console.log(`cookie: `)
            const robloxSecurity = res2.headers['set-cookie']
            .find(cookie => cookie.startsWith('.ROBLOSECURITY'))
            .split('=')[1]
            .split(';')[0];

            console.log(robloxSecurity);
        }
    
    }, 2500);

})
