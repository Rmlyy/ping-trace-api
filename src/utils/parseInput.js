import psl from 'psl'
import dns from 'dns/promises'
import { isIP, isV4, isPrivateIP, inRange } from 'range_check'

async function resolveAddress(hostname) {
  let addr = null

  for (const resolver of [dns.resolve4, dns.resolve6]) {
    try {
      const [address] = await resolver(hostname)

      addr = String(address)
    } finally {
      return addr
    }
  }
}

function isNonRoutableIPv6(ip) {
  const nonRoutableRanges = [
    '::/128', // Unspecified address
    '::1/128', // Loopback address
    'fe80::/10', // Link-local addresses
    'fc00::/7', // Unique Local Addresses (ULA)
    'fec0::/10', // Deprecated site-local addresses
    'ff00::/8', // Multicast addresses
    '::ffff:0:0/96', // IPv4-mapped addresses
    '2001:db8::/32', // Documentation addresses (RFC 3849)
    '3fff::/20', // Additional documentation space (RFC 9637)
    '100::/64', // Discard-only address block (RFC 6666)
    '2001::/23', // IETF protocol assignments (reserved)
    '2001:2::/48', // Benchmarking addresses
    '2001:10::/28', // Deprecated ORCHID addresses
    '2001:20::/28', // ORCHIDv2 addresses
    '2001:30::/28', // Drone Remote ID Protocol, etc.
    '2001:4:112::/48', // AS112‑v6 addresses
    '2620:4f:8000::/48', // Direct Delegation AS112 Service addresses
    '5f00::/16', // Segment Routing (SRv6) SIDs
  ]

  // If the IP is in any of the non‑routable ranges, or is not in 2000::/3 (global unicast),
  // then it’s considered non‑routable.
  return inRange(ip, nonRoutableRanges) || !inRange(ip, '2000::/3')
}

export default async function ({ type, input }) {
  const results = { type: type, input: input, valid: false, data: {} }

  switch (type) {
    case 'ip':
      if (!isIP(input)) {
        results.message = 'Invalid IP address'
        break
      }

      const ipVer = isV4(input) ? 4 : 6
      let isPrivate = ipVer == 4 && input == '0.0.0.0' // special case

      if (ipVer === 4 && !isPrivate) {
        isPrivate = isPrivateIP(input)
      } else if (ipVer === 6) {
        isPrivate = isNonRoutableIPv6(input)
      }

      results.valid = true
      results.data.ip = input
      results.data.version = ipVer
      results.data.isPrivate = isPrivate

      break
    case 'hostname':
      let parsedHostname

      try {
        parsedHostname = psl.parse(input)
      } catch (e) {
        results.message = e.message ?? 'Unknown hostname parsing error'
        break
      }

      if (!parsedHostname.domain || !parsedHostname.listed) {
        results.message = 'Invalid hostname'
        break
      }

      delete parsedHostname.input
      delete parsedHostname.listed
      parsedHostname.ip = await resolveAddress(input)
      results.valid = true
      results.data = parsedHostname

      break
  }

  return results
}
