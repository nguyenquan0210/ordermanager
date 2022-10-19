import * as admin from "firebase-admin";
import { Injectable } from '@nestjs/common';
import fs from "fs";
import { GOOGLE_APPLICATION_CREDENTIALS, NODE_ENV } from 'src/commons/constants/envConstanst';
import { MyLogService } from "src/loggers/winston.logger";
import _ from "lodash";

@Injectable()
export class FcmService {
    private dry_run = NODE_ENV == "production" || NODE_ENV == "staging" ? false : true;
    // private dry_run = false ;

    constructor(
        private logger: MyLogService,
    ) {
        this.init();
    }

    private async getCredentialFiles() {
        try {
            if (fs.existsSync(GOOGLE_APPLICATION_CREDENTIALS)) {
                return require(GOOGLE_APPLICATION_CREDENTIALS);
            }

        } catch (error) {
            console.error(error);
        }
    }

    async init() {
        let account = await this.getCredentialFiles();
        if (account) {
            admin.initializeApp({
                credential: admin.credential.cert(account),
            })
        } else {
            this.logger.error('Firebase can not get service account');
        }
    }

    sendMessage(notification: admin.messaging.Notification,
        data: any,
        tokenList: string[],
        callback?: (error, result?: {
            singleToken?: string;
            chunks?: string[][];
            response?: admin.messaging.BatchResponse[]
        }) => void
    ) {
        if (tokenList.length == 0) return;

        let mess: any = {
            notification: notification,
            data: data,
        };

        if(data.image){
            mess = {
                ...mess,
                android: {
                    notification: {
                      imageUrl: data.image,
                    }
                }
            };
        }

        let single = false;
        if (tokenList.length == 1) {
            mess.token = tokenList[0];
            single = true;
        } else {

            single = false;
        }

        let emptyTokens = 0;
        tokenList.forEach(tk => {
            if (!tk || tk.length == 0) emptyTokens++;
        })

        this.logger.log(`>>>FCM Send message: ${JSON.stringify(notification)
            } - list token: ${tokenList.length
            } - empty token: ${emptyTokens}`);

        tokenList = tokenList.filter(tk => tk && tk.length);
        if (tokenList.length == 0) return;

        if (single) {

            admin.messaging().send(mess, this.dry_run)
                .then(respone => {
                    // response is a message ID string
                    this.logger.log(`FCM message ${respone} send ok to device`);
                    if (callback)
                        callback(null, {
                            singleToken: mess.token,
                            response: [{
                                responses: [
                                    {
                                        success: true,
                                        messageId: respone,
                                    }
                                ],
                                successCount: 1,
                                failureCount: 0,
                            }]
                        });
                })
                .catch(error => {
                    this.logger.error('FCM error: ' + error.message);
                    if (callback)
                        callback(null, {
                            singleToken: mess.token,
                            response: [{
                                responses: [
                                    {
                                        success: false,
                                    }
                                ],
                                successCount: 0,
                                failureCount: 1,
                            }]
                        });
                });
        } else {
            // https://firebase.google.com/docs/cloud-messaging/send-message#send-messages-to-multiple-devices
            const chunks = _.chunk(tokenList, 500);
            let promises: Promise<admin.messaging.BatchResponse>[] = chunks.map(ch => {
                let msg: any = { notification: notification, tokens: ch, data: { ...data } };
                return admin.messaging().sendMulticast(msg, this.dry_run);
            });
            Promise.all(promises)
                .then(responses => {
                    // responses.forEach(response => {
                    //     console.log(`send multi success ${response.successCount}, failed ${response.failureCount}, len ${response.responses.length}`);
                    // })
                    if (callback)
                        callback(null, { chunks, response: responses });
                })
                .catch(error => {
                    this.logger.error('FCM error totally: ' + error.message);
                    if (callback)
                        callback(error);
                });
        }
    }
}
