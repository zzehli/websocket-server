import { createServer } from 'http';
import crypto from 'crypto'
const PORT = 8080;
const MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
const SEVEN_BITS_PAYLOAD_LEN = 125
const SIXTEEN_BITS_PAYLOAD_LEN = 126
const SIXTYFOUR_BITS_PAYLOAD_LEN = 127

//Bytes have 8 places, so the left-most place is 27 (or 128)
const FIRST_BIT = 128

const server = createServer((request, response) => {
    response.writeHead(200);
    response.end('hey there');
})
    .listen(8080, () => console.log('server listening to', PORT));

server.on('upgrade', onSocketUpgrade);

//establish handshake
//refers to 4.2.1. Reading the Client's Opening Handshake
function onSocketUpgrade(req, socket, head) {
    const { 'sec-websocket-key': webClientSocketKey } = req.headers
    console.log(`${webClientSocketKey} connected`);
    const headers = createHandShakeHeader(webClientSocketKey);
    socket.write(headers);
    socket.on('readable', () => onSocketReadable(socket) )
}

function onSocketReadable(socket) {
    //consume optcode (first byte)
    socket.read(1);

    //check payload len, starting after the MASK bit
    const [markerPayloadLen] = socket.read(1)
    const PayloadLen = markerPayloadLen - FIRST_BIT

    let messageLength = 0


}

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

function createSocketAccept(id) {
    const hash = crypto.createHash('sha1')
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