import NodeCache from 'node-cache'

const caches = {
  ping: new NodeCache({ stdTTL: 5 }),
  traceroute: new NodeCache({ stdTTL: 5 }),
}

export default caches
