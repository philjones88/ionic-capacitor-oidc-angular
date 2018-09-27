import { Requestor } from '@openid/appauth';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Logger } from 'angularx-logger';

export interface XhrSettings {
    url: string;
    dataType: string;
    method: 'GET' | 'POST';
    data: any;
    headers: any; // {key : string, value: any}
}

@Injectable()
export class AngularRequestor extends Requestor {

    constructor(private logger: Logger,
        private httpClient: HttpClient) {
        super();
    }

    public async xhr<T>(settings: any): Promise<T> { // JQueryAjaxSettings causes reference issues
        this.logger.debug('AngularRequestor => xhr', settings);

        const { url, dataType, method, data } = settings;

        let response: Promise<T>;

        const options = {
            responseType: dataType as any,
            headers: settings.headers
        };

        if (method === 'PUT') {
            response = this.httpClient.put<T>(url, data, options).toPromise();
        } else if (method === 'POST') {
            response = this.httpClient.post<T>(url, data, options).toPromise();
        } else {
            response = this.httpClient.get<T>(url, options).toPromise();
        }

        const result = await response
            .then((resp) => {
                this.logger.debug('AngularRequestor => xhr => result', resp);
                return resp;
            })
            .catch((err) => {
                this.logger.error('AngularRequestor => xhr => error', err);
                return { } as T;
            });

        return result;
    }
}
