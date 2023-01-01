import { createServer } from 'http';
import crypto from 'crypto'
const PORT = 8080;
const MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
const SEVEN_BITS_PAYLOAD_SWITCH = 125
const SIXTEEN_BITS_PAYLOAD_SWITCH  = 126
const SIXTYFOUR_BITS_PAYLOAD_SWITCH = 127

const MAX_SIXTEEN_BITS_MSG_LEN= 2 ** 16 // 0 to 65536
const MASKING_KEY_LEN_BYTES = 4
//Bytes have 8 places, so the left-most place is 2 to the 7th power (or 128)
const FIRST_BIT = 128

const server = createServer((request, response) => {
    response.writeHead(200);
    response.end('hey there');
})
    .listen(PORT, () => console.log('server listening to', PORT));

server.on('upgrade', onSocketUpgrade);

//establish handshake
//refers to 4.2.1. Reading the Client's Opening Handshake
//upgrade is a http client request: https://nodejs.org/api/http.html#event-upgrade
function onSocketUpgrade(req, socket, head) {
    const { 'sec-websocket-key': webClientSocketKey } = req.headers
    //console.log(`${webClientSocketKey} connected`);
    const headers = createHandShakeHeader(webClientSocketKey);
    socket.write(headers);
    socket.on('readable', () => onSocketReadable(socket))
   
}

//create the handshake header, including the acceptkey according to 1.3 Opening Handshake
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

//read payload length, refer to 5.2. Base Framing Protocol
function onSocketReadable(socket) {
    //consume optcode (first byte)
    socket.read(1);

    //check payload len, starting after the MASK bit
    const [markerPayloadLen] = socket.read(1);
    const payloadIndicator = markerPayloadLen - FIRST_BIT;

    let messageLength = 0;
    if(payloadIndicator <= SEVEN_BITS_PAYLOAD_SWITCH){
        messageLength = payloadIndicator;
    } else if (payloadIndicator == SIXTEEN_BITS_PAYLOAD_SWITCH) {
        messageLength = socket.read(2).readUint16BE(0);
    } else {
        throw new Error('your message is too long!')
    }

    const maskingKey = socket.read(MASKING_KEY_LEN_BYTES);
    //encoded is a buffer, encoded by masking key
    const encoded = socket.read(messageLength);
    let msg = unmask(encoded, maskingKey);
    console.log('received: ' + msg.toString());
    msg = msg + ' uuid: ' + crypto.randomUUID();
    sendMessage(msg, socket);
}

//unmask encoded data from client, refer to 5.3Client-to-Server Masking
function unmask(encodedBuffer, maskingKey) {
    //https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers
    // Create the byte Array of decoded payload
    //alternative: 
    // const final = Uint8Array.from(encodedBuffer, (elt, i) => elt ^ maskingKey[i % 4]); // Perform an XOR on the mask
    // return Buffer.from(final)
    const finalBuffer = Buffer.from(encodedBuffer);
    for (let index = 0; index < encodedBuffer.length; index++) {
        finalBuffer[index] = encodedBuffer[index] ^ maskingKey[index % 4];
    }
    return finalBuffer
}

//send msg from server to frontend
function sendMessage(msg, socket) {
    const data = prepareMessage(msg);
    socket.write(data);
}

//prepare the message according to framing specified in 5.2. Base Framing Protocol
function prepareMessage(message) {
    const msg = Buffer.from(message);
    //payload length
    const messageSize = msg.length

    let dataFrameBuffer;

    //first byte is text data (0x80 is 128 and 0x01 is OPCODE_TEXT)
    const firstByte = 0x80 | 0x01 
    if (messageSize <= SEVEN_BITS_PAYLOAD_SWITCH) {
        const bytes = [firstByte];
        dataFrameBuffer = Buffer.from(bytes.concat(messageSize));
    } else if (messageSize < MAX_SIXTEEN_BITS_MSG_LEN) {
        //allocate four bytes
        const target = Buffer.allocUnsafe(4)
        //OPCODE
        target[0] = firstByte;
        //payload indicator
        target[1] = SIXTEEN_BITS_PAYLOAD_SWITCH;
        //put message size at the next 2 bytes
        target.writeUint16BE(messageSize, 2);
        dataFrameBuffer = target;
    } else {
        throw new Error('message too long');
    }

    const totalLen = dataFrameBuffer.byteLength + messageSize;
    const dataFrameResponse = concatBuffer([dataFrameBuffer, msg], totalLen);
    return dataFrameResponse;
}

function concatBuffer(bufferList, totalLen) {
    const target = Buffer.allocUnsafe(totalLen);
    let offset = 0;
    for(const buffer of bufferList) {
        target.set(buffer, offset);
        offset += buffer.length;
    }

    return target;
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