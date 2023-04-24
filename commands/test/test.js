const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path')
const undici = require("undici")
const funcaptcha = require("funcaptcha")

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36"





module.exports = {
    data: new SlashCommandBuilder()
        .setName('login')
        .setDescription('command to login into your account')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('The username')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('password')
                .setDescription('The password')
                .setRequired(true)),
    /**
     * 
     * @param {import('discord.js').CommandInteraction} interaction 
     */
    async execute(interaction) {
        const username = interaction.options.getString('username');
        const password = interaction.options.getString('password');


        const embed = new EmbedBuilder()
            .setTitle('Login')
            .setDescription('Please complete the captcha in order to login.')
            .setColor('#333d47')
            .addFields({ name: 'Instructions', value: 'Enter the number corresponding to the correct image in the field below. Images are labeled from 0 to 5.' });

        await interaction.reply({ embeds: [embed] });




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
                    "cvalue": username,
                    "password": password,
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
                    fs.writeFileSync(path.join(__dirname, 'temp', `${x}.gif`), await challenge.getImage())
                    const attachment = new AttachmentBuilder(path.join(__dirname, 'temp', `${x}.gif`), { name: `${x}.gif` });
                    await interaction.followUp({ content: `Please select the correct image. Challange: ${challenge.instruction}`, files: [attachment] });
                    const filter = (msg) => msg.author.id === interaction.user.id && !isNaN(parseInt(msg.content));
                    const response = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });
                    const answer = parseInt(response.first().content);
                    await challenge.answer(parseInt(answer))
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
                            "cvalue": username,
                            "password": password,
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
                    interaction.channel.send({content: `Logged in as: ${body.user.name} with id ${body.user.id}`})
                }
            
            }, 2500);
        
        })

    }
};
