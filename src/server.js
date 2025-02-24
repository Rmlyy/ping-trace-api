import express from 'express'
import { isIP } from 'range_check'
import parseInput from './utils/parseInput.js'
import genResponse from './utils/genResponse.js'
import runCmd from './utils/runCmd.js'
import caches from './cache.js'
import logger from './utils/logger.js'

const server = express()

server.set('trust proxy', 1)
server.disable('x-powered-by')

const endpoints = ['ping', 'traceroute']

server.get('/*', async (req, res) => {
  const endpoint = req.params[0].replace(/\/+$/, '') // remove trailing slash

  if (!endpoint || !endpoints.includes(endpoint)) {
    const response = genResponse({ err: true, msg: 'Unknown endpoint' })

    return res.status(404).send(response)
  }

  const { target } = req.query

  if (!target) {
    const response = genResponse({ err: true, msg: 'Query param target is required.' })

    return res.status(400).send(response)
  }

  const parsedTarget = isIP(target)
    ? await parseInput({ type: 'ip', input: target })
    : await parseInput({ type: 'hostname', input: target })

  if (!parsedTarget.valid || !parsedTarget?.data?.ip || parsedTarget?.data?.isPrivate) {
    const response = genResponse({ err: true, msg: 'Invalid target.' })

    return res.status(400).send(response)
  }

  const { ip } = parsedTarget.data
  const cache = caches[endpoint]
  const cacheKey = `${ip}:${endpoint}`
  const resData = { cached: false, query: target, endpoint, address: ip, output: null }

  logger(`(${req.ip}): ${endpoint} - ${target === ip ? target : `${ip} (${target})`}`)

  if (cache.has(cacheKey)) {
    resData.cached = true
    resData.output = cache.get(cacheKey)

    return res.send(genResponse({ ...resData }))
  }

  const output = await runCmd(endpoint === 'traceroute' ? 'mtr' : endpoint, ip)

  if (!output) {
    const response = genResponse({ err: true, msg: 'Command returned error or no output' })

    return res.status(500).send(response)
  }

  cache.set(cacheKey, output)
  resData.output = output

  res.send(genResponse({ ...resData }))
})

const { SERVER_ADDR, SERVER_PORT } = process.env
server.listen(SERVER_PORT, SERVER_ADDR, () => {
  console.log(`[*] Server is listening on ${SERVER_ADDR}:${SERVER_PORT}`)
})
