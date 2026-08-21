import http from 'node:http'

const PORT = 3003

const server = http.createServer((req, res) => {
  if (
    (req.method === 'GET' || req.method === 'HEAD') &&
    req.url === '/health'
  ) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      req.method === 'HEAD' ? undefined : JSON.stringify({ status: 'ok' }),
    )
    return
  }
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(PORT, () => {
  console.log('Email Bot ready')
})
