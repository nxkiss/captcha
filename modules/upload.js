const undici = require('undici')
const fs = require('fs')
const path = require('path')

module.exports = async (cookie, itemOptions) => {
  const directoryPath = path.join(__dirname, 'assets')
  const assetIds = {}

  fs.readdir(directoryPath, async (err, files) => {
    if (err) {
      console.log('Unable to scan directory: ' + err)
      return
    }

    for (const file of files) {
      const data = fs.readFileSync(path.join(directoryPath, file))

      const uploadUrl = `https://data.roblox.com/Data/Upload.ashx?json=1&assetid=0&type=Model&genreTypeId=1&name=${itemOptions.name}&description=${itemOptions.description}&ispublic=${!itemOptions.copyLocked}&allowComments=${itemOptions.allowComments}&groupId=${itemOptions.groupId}`

      const res = await undici.request(uploadUrl, {
        method: 'POST',
        headers: {
          'Cookie': `.ROBLOSECURITY=${cookie}`,
          'Content-Type': 'application/xml'
        },
        body: data
      })

      const csrf = res.headers["x-csrf-token"]

      const res2 = await undici.request(uploadUrl, {
        method: 'POST',
        headers: {
          'Cookie': `.ROBLOSECURITY=${cookie}`,
          'X-CSRF-TOKEN': csrf,
          'Content-Type': 'application/xml'
        },
        body: data
      })

      const body = await res2.body.arrayBuffer()
      const json = JSON.parse(Buffer.from(body).toString())
      assetIds[file] = json.AssetId

      if (res2.statusCode === 200) {
        console.log(`Asset ${file} uploaded successfully. Asset ID: ${json.AssetId}`)
      } else {
        console.log(`Failed to upload asset ${file}.`)
      }
    }

    fs.writeFileSync(path.join(__dirname, 'assets', 'assets.json'), JSON.stringify(assetIds))
    console.log('Asset IDs saved to assetIds.json.')
  })
}
