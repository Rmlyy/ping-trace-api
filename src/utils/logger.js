import fs from 'fs'

export default function (msg) {
  if (process.env.LOGS_ENABLED != 'true') return

  const date = new Date().toLocaleString()

  fs.appendFileSync('./logs.log', `[${date}] ${msg}\n`, 'utf-8')
}
