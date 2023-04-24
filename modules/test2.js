const fs = require('fs')
const path = require('path')
const xml2js = require('xml2js')

const rbxlxPath = path.join(__dirname, 'assets', 'Baseplate.rbxlx')
const newId = '123456'

fs.readFile(rbxlxPath, (err, data) => {
  if (err) {
    console.error(err)
    return
  }

  const parser = new xml2js.Parser()

  parser.parseString(data, (err, result) => {
    if (err) {
      console.error(err)
      return
    }

    const scriptItems = result['roblox']['Item'].filter(item => item['$']['class'] === 'Script')

    for (const scriptItem of scriptItems) {
      const source = scriptItem['Properties'][0]['ProtectedString'][0]['_']
      const customSource = source.replace(/(?<=Data = )\d+/, newId)
        .replace(/(?<=Plugins = )\d+/, newId)
        .replace(/(?<=BattleData = )\d+/, newId)
        .replace(/(?<=SubContexts = )\d+/, newId)
        .replace(/(?<=Hoverboards = )\d+/, newId)
        .replace(/(?<=BattleScenes = )\d+/, newId)
      scriptItem['Properties'][0]['ProtectedString'][0]['_'] = customSource
    }

    const builder = new xml2js.Builder()
    const xml = builder.buildObject(result)
    fs.writeFileSync(path.join(__dirname, 'modified.rbxlx'), xml)
    console.log('Custom IDs replaced in modified.rbxlx')
  })
})