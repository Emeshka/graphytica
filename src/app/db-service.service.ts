import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Injectable({
  providedIn: 'root'
})
export class DbServiceService {

  constructor(
    private _electronService: ElectronService) { }

  private OrientDB = this._electronService.remote.require("orientjs");
  private OClient = this.OrientDB.OrientDBClient;
  private ODatabase = this.OrientDB.ODatabase;

  port = -1;
  db = null;
  client = null;
  pool = null; //также индикатор наличия открытого соединения
  server = null;

  getConnectionPromise = function(receiveMessage) {
    return new Promise((resolve, reject) => {
      receiveMessage('Подключение к серверу...');
      //console.log(`Connecting localhost:${this.port}...`)
      this.OClient.connect({
        host: 'localhost',
        port: this.port
      }).then((client) => {
        this.client = client;
        receiveMessage('Проверка существования рабочего пространства...');
        let onDbExists = () => {
            //console.log('onDbExists(): this =', this);
            receiveMessage('Подключение API сервера...');
            //console.log('server')
            this.server = this.OrientDB({
              host: 'localhost',
              port: this.port,
              username: 'root',
              password: 'root',
              useToken: true
            });
            /*this.server.list().then(
              function(list){
                console.log('Databases on Server:', list.length);
              }
            );*/
            receiveMessage('Подключение API базы данных...');
            //console.log('db')
            this.db = this.server.use({
              name: 'tempdb',
              username: 'root',
              password: 'root'
            });
            receiveMessage('Открытие сессий...');
            client.sessions({ name: 'tempdb', username: 'root', password: 'root', pool: {max: 10} }).then(pool => {
              this.pool = pool;
              receiveMessage('');
              resolve();
            }).catch(e => reject(e));
          //мы могли бы возвращать что-нибудь, но не будем - смысл этого промиса просто в ожидании готовности подключения,
          //а дальше пусть подключаются через свойства класса
          /**/
        }

        client.existsDatabase({
          name: 'tempdb',
          username: 'root',
          password: 'root'
        }).then(exists => {
          //console.log('Exists tempdb:', exists);
          if (exists) {
            console.log('TODO on start_view ask user to continue interrupted work if tempdb was not dropped at last time')
            //console.log('ignoring existance of tempdb')
            onDbExists();
          } else {
            receiveMessage('Создание рабочего пространства...');
            //console.log('Creating temp DB...')
            client.createDatabase({
              name: 'tempdb',
              username: 'root',
              password: 'root'
            }).then(() => {
              onDbExists();
            }).catch(e => reject(e));
          }
        })
      }).catch(e => reject(e));
    })
  }

  odbRecordToCytoscapeElement = (type) => {
    const serviceProperties = ['@version', '@type'];
    if (type == 'node') {
      return v => {
        let plainObject = JSON.parse(JSON.stringify(v));
        plainObject.id = plainObject['@rid'];
        delete plainObject['@rid'];
        serviceProperties.forEach((p) => {
          delete plainObject[p]
        })
        delete plainObject[''];
        return {data: plainObject};
      }
    } else if (type == 'edge') {
      return e => {
        let plainObject = JSON.parse(JSON.stringify(e));
        plainObject.id = plainObject['@rid'];
        delete plainObject['@rid'];
        plainObject.target = plainObject['in'];
        delete plainObject['in'];
        plainObject.source = plainObject['out'];
        delete plainObject['out'];
        serviceProperties.forEach((p) => {
          delete plainObject[p]
        })
        delete plainObject[''];
        return {data: plainObject};
      }
    }
  }
}