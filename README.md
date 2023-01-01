# Websocket Server
This is a barebone websocket server built according to [RFC 6455](https://www.rfc-editor.org/rfc/rfc6455.html). The server has two main components: making the handshake (upgrade from HTTP to WebSocket protocol) and handling data frames (how messages are transmitted through the protocol). The server handles messages up to 16 bits.

[Demo](https://youtu.be/dVPiCg_Tp90)

# References

* Dion Misic: A Beginner's Guide to WebSockets https://www.youtube.com/watch?v=qFoFKLI3O8w
* MDN: Writing Websocket Servers https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers#miscellaneous
* Erick Wendel: Building a websocket app from scratch https://www.youtube.com/watch?v=PjiXkJ6P9pQ
* RFC 6455: The WebSocket Protocol https://www.rfc-editor.org/rfc/rfc6455.html
