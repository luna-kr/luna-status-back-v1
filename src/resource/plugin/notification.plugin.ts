import axios from 'axios'
import * as CryptoJS from 'crypto-js'
import libphonenumber from 'libphonenumber-js'
import * as nodemailer from 'nodemailer'

export default {
    pluginName: 'notificationPlugin',

    Notification: {
        SMS: {
            send: async (_target: string, _content: string): Promise<
                { success: true, processedDate: Date }
                | { success: false, error?: Error }
            > => {
                try {
                    if(libphonenumber(_target)?.isValid() !== true) return { success: false, error: new Error('Invalid phone number.') }
                    const _result = await axios.post(
                        `https://sens.apigw.ntruss.com/sms/v2/services/${ process.env.NAVER_CLOUD_PLATFORM_SERVICE_ID }/messages`,
                        {
                            type: 'sms',
                            contentType: 'comm',
                            countryCode: libphonenumber(_target)?.countryCallingCode,
                            from: libphonenumber(process.env.NAVER_CLOUD_PLATFORM_SMS_OUTBOUND)?.format('NATIONAL').replace(/\D/g, ''),
                            content: _content,
                            messages: [
                                { to: libphonenumber(_target).format('NATIONAL').split('-').join(''), content: _content }
                            ]
                        },
                        {
                            headers: {
                                'Contenc-Type': 'application/json; charset=utf-8',
                                'x-ncp-iam-access-key': process.env.NAVER_CLOUD_PLATFORM_ACCESS,
                                'x-ncp-apigw-timestamp': String(new Date().getTime()),
                                'x-ncp-apigw-signature-v2': CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256('POST /sms/v2/services/' + process.env.NAVER_CLOUD_PLATFORM_SERVICE_ID + '/messages\n' + String(new Date().getTime()) + '\n' + process.env.NAVER_CLOUD_PLATFORM_ACCESS, process.env.NAVER_CLOUD_PLATFORM_SECRET))
                            }
                        }
                    )
                    if(_result.status !== 202 || _result.data.statusName !== 'success') return { success: false, error: new Error('Failed to send SMS.') }

                    return { success: true, processedDate: new Date(_result.data.requestTime) }
                } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
            }
        },
        SMTP: {
            send: async (_target: string, _title: string, _content: string): Promise<
                { success: true, processedDate: Date }
                | { success: false, error?: Error }
            > => {
                try {
                    const _mailer = nodemailer.createTransport({
                        host: process.env.NOTIFICATION_SMTP_HOSTNAME,
                        port: Number(process.env.NOTIFICATION_SMTP_PORT),
                        requireTLS: true,
                        auth: {
                            user: process.env.NOTIFICATION_SMTP_USERNAME,
                            pass: process.env.NOTIFICATION_SMTP_PASSWORD
                        }
                    })
                    try {
                        await _mailer.sendMail({ from: process.env.NOTIFICATION_SMTP_OUTBOUND, to: _target, subject: _title, html: _content })
                    } catch(_error) { return { success: false, error: new Error('Failed to send SMTP1.') } }
                    return { success: true, processedDate: new Date() }
                } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
            }
        }
    }
}