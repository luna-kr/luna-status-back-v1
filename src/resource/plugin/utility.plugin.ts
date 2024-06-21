import jsonwebtoken from 'jsonwebtoken'

export default {
    getRandomStrings: (_length: number, _chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890'): string => {
        let _string = ''
        for (let i=0; i<_length; i++) {
            _string += _chars.charAt(Math.floor(Math.random() * _chars.length))
        }
        return _string    
    },
    isBase64: (_string: string): boolean => {
        return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/.test(_string)
    },
    tokenParser: (_string: string): { token: string, tokenType: 'Basic' | 'Bearer' } => {
        if(_string.split(' ').length !== 2) throw 'Not match the Token Format.'
        const _tokenType = _string.split(' ')[0].toLowerCase() == 'basic' ? 'Basic' : 'Bearer'
        if(_tokenType == 'Bearer') { if(_string.split(' ')[0].toLowerCase() !== 'bearer') { throw new Error('Wrong token format.') } }
        return { token: _string.split(' ')[1], tokenType: _tokenType }    
    },
    JWT: {
        encode: (_object: Object, _expiresDate: Date): string => {
            return jsonwebtoken.sign({
                ... _object,
                iss: 'Luna co.',
                iat: new Date().getTime() / 1000,
                exp: _expiresDate.getTime() / 1000
            }, process.env.PRIVATE_KEY, { algorithm: (process.env.ALGORITHM == 'ES256K' ? 'ES256' : process.env.ALGORITHM ) as jsonwebtoken.Algorithm })
        },
        verify: (_token: string): boolean => {
            try {
                jsonwebtoken.verify(_token, process.env.PUBLIC_KEY)
                return true
            } catch(_error) { return false }
        },
        decode: (_token: string): string | jsonwebtoken.JwtPayload => {
            return jsonwebtoken.decode(_token)
        }    
    }
}