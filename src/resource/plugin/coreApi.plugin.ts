import WebSocket from 'websocket'
import CryptoJS from 'crypto-js'

export default class {
    private _client: WebSocket.client
    private _connection: WebSocket.connection
    private _status: 'PREPARE' | 'READY' = 'PREPARE'

    constructor () {
        this._client = new WebSocket.client()
        this._client.on('connect', (_connection: WebSocket.connection) => {
            this._status = 'READY'
            this._connection = _connection
        })
        this._client.connect(process.env.CORE_API_WEB_SOCKET_URI, undefined, undefined, { authorization: `Bearer ${ CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(process.env.CORE_API_SECRET_KEY)) }` })
    }

    
}