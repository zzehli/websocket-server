import { createServer } from 'http';
const PORT = 8080;
const MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
import crypto from 'crypto'

const server = createServer((request, response) => {
    response.writeHead(200);
    response.end('hey there');
})
    .listen(8080, () => console.log('server listening to', PORT));

server.on('upgrade', onSocketUpgrade);

function onSocketUpgrade(req, socket, head) {
    const {'sec-websocket-key': webClientSocketKey} = req.headers
    console.log( `${webClientSocketKey} connected` );
    const headers = createHandShakeHeader(webClientSocketKey);
    socket.write(headers);
}

// HTTP/1.1 101 Switching Protocols
// Upgrade: websocket
// Connection: Upgrade
// Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=

function createHandShakeHeader(id) {
    const acceptKey = createSocketAccept(id)
    const headers = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptKey}`,
        ''
    ].map(elem => elem.concat('\r\n')).join('');
    return headers;
}

// https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers#miscellaneous
function createSocketAccept(id) {
    const hash =  crypto.createHash('sha1')
    hash.update(id + MAGIC_STRING)
    return hash.digest('base64')
}
//error handling
[
    "uncaughtException",
    "unhandledRejection"
].forEach(element => {
    process.on(element, (err) => {
        console.error(`something bad happended! event: ${element}, msg: ${err.stack || err}`);
    })
});