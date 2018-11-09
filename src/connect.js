const LineAPI  = require('./api');
var config = require('./config');
var moment = require('moment');

class LineConnect extends LineAPI {

  constructor(options) {
    super();

    if (typeof options !== 'undefined') {
      this.authToken = options.authToken;;
      this.config.Headers['X-Line-Access'] = options.authToken;
    }
  }

  async startx () {
    if (typeof this.authToken != 'undefined'){
      await this._tokenLogin(this.authToken);
      let { mid, displayName } = await this._client.getProfile();config.botmid = mid;
      console.info(`[*] Name: ${displayName}`);
      console.info(`[*] MID: ${mid}`);
      console.info(`=======BOT RUNNING======\n`);
	  this._client.removeAllMessages();
      return this.longpoll();
    } 
  }
  
  async fetchOps(rev) {
    return this._fetchOps(rev, 5);
  }

  async fetchOperations(rev) {
    return this._fetchOperations(rev, 5);
    
  }

  longpoll() {
    return new Promise((resolve, reject) => {
      this._fetchOperations(this.revision, 50).then((operations) => {
        if (!operations) {
          console.log('No operations');
          reject('No operations');
          return;
        }
        return operations.map((operation) => {
              if(operation.revision.toString() != -1) {
                let revisionNum = operation.revision.toString();
                resolve({ revisionNum, operation });
              }
        });
      });
    });
  }

}

module.exports = LineConnect;
