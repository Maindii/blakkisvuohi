/*
    Bläkkisvuohi, a Telegram bot to help track estimated blood alcohol concentration.
    Copyright (C) 2017  Joonas Ulmanen

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
    utils.js
    Commonly used functions.
*/

'use strict';

const when = require('when');
const log = require('loglevel').getLogger('system');
let utils = module.exports = {};

utils.getDateMinusHours = function(hours) {
    const hourInMillis = 3600 * 1000;
    const hoursAgo = new Date(Date.now() - hours * hourInMillis);
    return hoursAgo;
};

function createSendPrivateMsgFunction(msg, bot) {
    return function(text) {
        let deferred = when.defer();
        bot.sendMessage(msg.from.id, text)
            .then(() => {
                log.debug('sent ' + text + ' to ' + msg.from.username);
                deferred.resolve();
            }, (err) => {
                log.error('couldn\'t send private msg! Err: ' + err);
                log.debug(err.stack);
                deferred.reject(err);
            });
        return deferred.promise;
    };
}

function createSendChatMsgFunction(msg, bot) {
    return function(text) {
        let deferred = when.defer();
        bot.sendMessage(msg.chat.id, text)
            .then(() => {
                log.debug('sent ' + text + ' to chat ' + msg.chat.title);
                deferred.resolve();
            }, (err) => {
                log.error('couldn\'t send chat msg! Err: ' + err);
                log.debug(err.stack);
                deferred.reject(err);
            });
        return deferred.promise;
    };
}

function createSendMsgToFunction(msg, bot) {
    return function(chatId, text, options) {
        let deferred = when.defer();
        bot.sendMessage(chatId, text, options)
            .then(() => {
                log.debug('sent ' + text + ' to chat ' + chatId);
                deferred.resolve();
            }, (err) => {
                log.error('couldn\'t send msg! Err: ' + err);
                log.debug(err.stack);
                deferred.reject(err);
            });
        return deferred.promise;
    };
}

function createSendPhotoFunction(msg, bot) {
    return function(chatId, stream, options) {
        let deferred = when.defer();
        bot.sendPhoto(chatId, stream, options)
            .then(() => {
                log.debug('sent photo to chat ' + chatId);
                deferred.resolve();
            }, (err) => {
                log.error('couldn\'t send photo! Err: ' + err);
                log.debug(err.stack);
                deferred.reject(err);
            });
        return deferred.promise;
    };
}

function createUserToStringFunction(msg) {
    return function() {
        return 'user: {id: ' + msg.from.id + ', name: ' + msg.from.first_name + ' ' + msg.from.last_name + ', username: ' + msg.from.username + '}';
    };
}

utils.hookNewRelic = function(url, func) {
    if (global.newrelic && global.newrelic.startWebTransaction) {
        global.newrelic.startWebTransaction(url, function() {
            func();
            global.newrelic.getTransaction().end();
        });
    } else {
        func();
    }
};

utils.attachMethods = function attachMethods(msg, bot) {
    msg.sendPrivateMessage = createSendPrivateMsgFunction(msg, bot);
    msg.sendChatMessage = createSendChatMsgFunction(msg, bot);
    msg.sendMessage = createSendMsgToFunction(msg, bot);
    msg.userToString = createUserToStringFunction(msg, bot);
    msg.sendPhoto = createSendPhotoFunction(msg, bot);
};

utils.getRandom = function(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
};

utils.isValidInt = function(num) {
    return !!parseInt(num, 10);
};

utils.isValidFloat = function(num) {
    return !!parseFloat(num);
};