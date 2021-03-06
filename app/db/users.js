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
    users.js
    Manages the user models in database.
*/

'use strict';
const query = require('pg-query');
const when = require('when');
const log = require('loglevel').getLogger('db');
const utils = require('../lib/utils.js');
const alcomath = require('../lib/alcomath.js');
query.connectionParameters = process.env.DATABASE_URL;

let users = module.exports = {};

function isValidGender(gender) {
    return gender === 'mies' || gender === 'nainen';
}

function User(userId, username, weight, gender) {
    this.userId = userId;
    this.username = username;
    this.weight = weight;
    this.gender = gender;
}

users.User = User;

users.new = function(userId, nick, weight, gender) {
    let deferred = when.defer();
    let params = [parseInt(userId, 10), nick, parseInt(weight, 10), gender];
    let err = [];
    if (!utils.isValidInt(params[0])) {
        err.push('userid');
    }
    if (err.length > 0) {
        deferred.reject(err);
        return deferred.promise;
    }

    query('insert into users (userId, nick, weight, gender) values ($1, $2, $3, $4)', params)
        .then(() => {
            deferred.resolve(new User(params[0], nick, params[2], gender));
        }, (err) => {
            log.error(err);
            log.debug(err.stack);
            deferred.reject(err);
        });
    return deferred.promise;
};

users.find = function find(userId) {
    let deferred = when.defer();
    query('select userId, nick, weight, gender from users where userId=$1', [userId])
        .then((res) => {
            let rows = res[0];
            let info = res[1];
            if (rows.length > 0 && info.rowCount > 0) {
                try {
                    let found = rows[0];
                    deferred.resolve(new User(found.userid, found.nick, found.weight, found.gender));
                } catch (err) {
                    deferred.reject(err);
                }
            } else {
                deferred.reject('user not found');
            }
        }, (err) => {
            log.error(err);
            log.debug(err.stack);
            deferred.reject(err);
        });
    return deferred.promise;
};

User.prototype.drinkBooze = function(amount, description) {
    let deferred = when.defer();
    query('insert into users_drinks (userId, alcohol, description) values($1, $2, $3)', [this.userId, amount, description])
        .then(() => {
            deferred.resolve(amount);
        }, (err) => {
            log.error(err);
            log.debug(err.stack);
            deferred.reject(err);
        });
    return deferred.promise;
};

User.prototype.getBooze = function() {
    let deferred = when.defer();
    query('select alcohol, description, created from users_drinks where userId = $1 order by created asc', [this.userId])
        .then((res) => {
            deferred.resolve(res[0]);
        }, (err) => {
            log.error(err);
            log.debug(err.stack);
            deferred.reject(err);
        });
    return deferred.promise;
};

User.prototype.getDrinkSumForXHours = function(hours) {
    let deferred = when.defer();
    let hoursAgo = utils.getDateMinusHours(hours);
    query('select sum(alcohol) as sum, min(created) as created from users_drinks where userId = $1 and created > $2 ', [this.userId, hoursAgo])
        .then((res) => {
            deferred.resolve(res[0][0]);
        }, (err) => {
            log.error(err);
            log.debug(err.stack);
            deferred.reject(err);
        });
    return deferred.promise;
};

User.prototype.undoDrink = function() {
    let deferred = when.defer();
    query('delete from users_drinks where created=(select created from users_drinks where userid = $1 order by created desc limit 1)', [this.userId])
        .then((res) => {
            deferred.resolve(res[0]);
        }, (err) => {
            log.error(err);
            log.debug(err.stack);
            deferred.reject(err);
        });
    return deferred.promise;
};

User.prototype.getBoozeForLastHours = function(hours) {
    let deferred = when.defer();
    let hoursAgo = utils.getDateMinusHours(hours);
    query('select alcohol, description, created from users_drinks where userId = $1 and created > $2 order by created desc', [this.userId, hoursAgo.toISOString()])
        .then((res) => {
            deferred.resolve(res[0]);
        }, (err) => {
            log.error(err);
            log.debug(err.stack);
            deferred.reject(err);
        });
    return deferred.promise;
};

User.prototype.joinGroup = function(msg) {
    let deferred = when.defer();
    query('insert into users_in_groups (userId, groupId) values ($1, $2)', [this.userId, msg.chat.id])
        .then((res) => {
            deferred.resolve(res[0]);
        }, (err) => {
            log.error(err);
            log.debug(err.stack);
            deferred.reject('Ota adminiin yhteyttä.');
        });
    return deferred.promise;
};

User.prototype.getDrinkCountsByGroup = function() {
    let deferred = when.defer();
    query('select count(*) as count, groupid from users_drinks join users_in_groups on users_drinks.userid=users_in_groups.userid where groupId IN (select groupId from users_in_groups where userid=$1) group by groupId', [this.userId])
        .then((res) => {
            let rows = res[0];
            deferred.resolve(rows);
        }, (err) => {
            log.error(err);
            log.debug(err.stack);
            deferred.reject('Ota adminiin yhteyttä.');
        });
    return deferred.promise;
};

User.prototype.drinkBoozeReturnPermilles = function(amount, description) {
    let deferred = when.defer();
    let self = this;
    self.drinkBooze(amount, description)
        .then((amount) => {
            self.getBooze()
                .then((drinks) => {
                    let permilles = alcomath.getPermillesFromDrinks(self, drinks);
                    deferred.resolve(permilles);
                }, (err) => {
                    log.error(err);
                    log.debug(err.stack);
                    deferred.reject(err);
                });
        }, (err) => {
            log.error(err);
            log.debug(err.stack);
            deferred.reject('Isompi ongelma, ota yhteyttä adminiin.');
        });
    return deferred.promise;
};

User.prototype.drinkBoozeLate = function(drinks, hours) {
    let deferred = when.defer();
    let self = this;
    log.debug('Drinking late');
    let queries = [];
    for(let i in drinks) {
        log.debug(drinks[i].text, drinks[i].mg);
        let drink = drinks[i];
        let hoursAgo = utils.getDateMinusHours(hours - hours/Math.max(drinks.length-1, 1)*i);
        log.debug(hoursAgo);
        queries.push(query('insert into users_drinks (userId, alcohol, description, created) values($1, $2, $3, $4)', [this.userId, drink.mg, drink.text, hoursAgo]));
    }
    when.all(queries)
        .then(() => {
            self.getBooze()
                .then((drinks) => {
                    let permilles = alcomath.getPermillesFromDrinks(self, drinks);
                    deferred.resolve(permilles);
                }, (err) => {
                    log.error(err);
                    log.debug(err.stack);
                    deferred.reject(err);
                });
        }, (err) => {
            log.error(err);
            log.debug(err.stack);
            deferred.reject('Isompi ongelma, ota yhteyttä adminiin.');
        });
    return deferred.promise;
};

User.prototype.updateInfo = function(username, weight, gender) {
    let deferred = when.defer();
    let self = this;
    query('update users set nick=$1, weight=$2, gender=$3 where userId=$4', [username, weight, gender, self.userId])
    .then(() => {
        deferred.resolve();
    }, (err) => {
        log.error(err);
        log.debug(err.stack);
        deferred.reject(err);
    });

    return deferred.promise;
};