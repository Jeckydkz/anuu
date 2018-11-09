const thrift = require('thrift-http');
const unirest = require('unirest');
const qrcode = require('qrcode-terminal');
const util = require("util");
const mime = require("mime");
const fs = require('fs');
const path = require('path');
const rp = require('request-promise');
const request = require('request');

const LineService = require('../curve-thrift/LineService');
const {
  LoginResultType,
  IdentityProvider,
  ContentType,
  Message,
  LoginRequest
} = require('../curve-thrift/line_types');

const PinVerifier = require('./pinVerifier');
var config = require('./config');
var moment = require('moment');
var reqx = new LoginRequest();
var reqxy = new LoginRequest();

class LineAPI {
  constructor() {
    this.config = config;
    this.setTHttpClient();
    this.axz = false;
    this.axy = false;
    this.gdLine = "http://gd2.line.naver.jp";
    this.gdLine2 = "http://gf.line.naver.jp";
  }

  setTHttpClient(options = {
    protocol: thrift.TCompactProtocol,
    transport: thrift.TBufferedTransport,
    headers: this.config.Headers,
    path: this.config.LINE_HTTP_URL,
    https: true
  }) {
    //options.headers['X-Line-Application'] = 'BIZANDROID 1.7.2 Android OS 8.1.0';
    options.headers['X-Line-Application'] = 'CHROMEOS\t2.1.0\tChrome_OS\t1';
    //options.headers['X-Line-Application'] = 'IOSIPAD 7.14.0 iPhone OS 10.12.0';
    //options.headers['X-Line-Application'] = 'DESKTOPMAC\t5.3.3-YOSEMITE-x64\tMAC\t10.12.0';
    this.options = options;
    this.connection =
      thrift.createHttpConnection(this.config.LINE_DOMAIN_3RD, 443, this.options);
    this.connection.on('error', (err) => {
//      console.log('err',err);
      return err;
    });
    if(this.axz === true){
      this._channel = thrift.createHttpClient(require('../curve-thrift/ChannelService.js'), this.connection);this.axz = false;
    } else if(this.axy === true){
      this._authService = thrift.createHttpClient(require('../curve-thrift/AuthService.js'), this.connection);this.axy = false;
    } else {
        this._client = thrift.createHttpClient(LineService, this.connection);
    }
  }
  
  async _chanConn(){
    this.options.headers['X-Line-Access'] = this.config.tokenn;
    this.options.path = this.config.LINE_CHANNEL_PATH;
    this.axz = true;
    this.setTHttpClient(this.options);
    return Promise.resolve();
  }
  
  async _authConn(){
    this.axy = true;
    this.options.path = this.config.LINE_RS;
      this.setTHttpClient(this.options);
    return Promise.resolve();
  }

  async _tokenLogin(authToken) {
  this.options.path = this.config.LINE_COMMAND_PATH;
    this.config.Headers['X-Line-Access'] = authToken;config.tokenn = authToken;
    this.setTHttpClient(this.options);
    return Promise.resolve({ authToken });
  }

  async _sendMessage(message, txt ,seq = 0) {
    message.text = txt;
    return await this._client.sendMessage(0, message);
  }

  _kickMember(group,memid) {
    return this._client.kickoutFromGroup(0,group,memid);
  }

  _cancel(groupid,member) {
    return this._client.cancelGroupInvitation(0,groupid,member);
  }

  _createRoom(memberids) {
    return this._client.createRoom(0,[memberids]);
  }
  
  _createGroup(groupName,members) {
    return this._client.createGroup(0,groupName,members);
  }
  
  async _getGroups(groupId) {
      return await this._client.getGroups(groupId);
  }
  
  async _findAndAddContactsByMid(mid) {
      return await this._client.findAndAddContactsByMid(0, mid, 0, '')
  }
  
  async _getGroupsJoined() {
    return this._client.getGroupIdsJoined()
  }

  async _findGroupByName(name) {
    let group = [];
    let groupID = await this._getGroupsJoined();
    let groups = await this._getGroups(groupID);
    for (let key in groups) {
        if(groups[key].name === name){
          group.push(groups[key]);
        }
    }
    return group;
  }

  async _findGroupByTicket(ticketID){
    return await this._client.findGroupByTicket(ticketID);
  }
  
  async _acceptGroupInvitationByTicket(gid,ticketID){
    return await this._client.acceptGroupInvitationByTicket(0,gid,ticketID);
  }
  
  async _updateGroup(group) {
    return await this._client.updateGroup(0, group)
  }

  async _getGroup(groupId) {
    return await this._client.getGroup(groupId);
  }

  async _reissueGroupTicket(groupId) {
    return await this._client.reissueGroupTicket(groupId);
  }
  
  _fetchOperations(revision, count = 5) {
    // this.options.path = this.config.LINE_POLL_URL
    return this._client.fetchOperations(revision, count);
  }

  _fetchOps(revision, count = 5) {
    return this._client.fetchOps(revision, count,0,0);
  }

  getJson(path) {
    return new Promise((resolve, reject) => (
      unirest.get(`https://${this.config.LINE_DOMAIN}${path}`)
        .headers(this.config.Headers)
        .timeout(120000)
        .end((res) => (
          res.error ? reject(res.error) : resolve(res.body)
        ))
    ));
  }
}

module.exports = LineAPI;
