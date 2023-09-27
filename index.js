import { EOL } from 'os'

import build from 'pino-abstract-transport'

const SEVERITY = {
  10: 'DEBUG',
  20: 'DEBUG',
  30: 'INFO',
  40: 'WARNING',
  50: 'ERROR',
  60: 'CRITICAL',
}

export default async function (opts) {
  return build(async function (source) {
    for await (const obj of source) {
      try {
        const { level, time, msg, err, req, res, responseTime } = obj

        delete obj.pid
        delete obj.hostname

        delete obj.level
        obj.severity = SEVERITY[level]

        delete obj.time
        if (time) obj.timestamp = new Date(time).toISOString()

        delete obj.msg
        if (msg) obj.message = msg

        // https://cloud.google.com/error-reporting/docs/formatting-error-messages#json_representation
        if (err) {
          delete obj.err
          obj.stack_trace = err.stack
        }

        // Support pino-http logging.
        if (req || res) {
          delete obj.req
          delete obj.res
          delete obj.responseTime

          obj.httpRequest = {}
          obj.httpRequest.requestMethod = req.method
          obj.httpRequest.requestUrl = req.url
          obj.httpRequest.requestSize = req.headers['content-length']
          obj.httpRequest.userAgent = req.headers['user-agent']
          obj.httpRequest.remoteIp = req.remoteAddress
          obj.httpRequest.status = res.statusCode
          obj.httpRequest.responseSize = res.headers['content-length']
          obj.httpRequest.latency = `${responseTime / 1000.0}s`
        }
      } catch (err) {
        console.error(err, 'logging transport failed')
      } finally {
        process.stdout.write(JSON.stringify(obj) + EOL)
      }
    }
  })
}
