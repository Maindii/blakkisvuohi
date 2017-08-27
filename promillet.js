'use strict';

const cmd = require('./cmd.js');
const utils = require('./utils.js');
const users = require('./users.js');
const when = require('when');
const alcomath = require('./alcomath.js');

const DRINK_RESPONSES = ['Bäää.', 'Uuteen nousuun.', 'Aamu alkaa A:lla.', 'Juo viinaa, viina on hyvää.', 'Meno on meno.', 'Lörs lärä, viinaa!'];

function getRandomResponse(){
  return DRINK_RESPONSES[Math.floor(Math.random()*DRINK_RESPONSES.length)];
}

cmd.register('/luotunnus', cmd.TYPE_PRIVATE, function(msg, words){
  let deferred = when.defer();
  users.new(msg.from.id, msg.from.username || msg.from.first_name + ' ' + msg.from.last_name, words[1], words[2])
  .then(function(user){
    deferred.resolve(cmd.privateResponse('Moikka ' + user.nick + '! Tunnuksesi luotiin onnistuneesti. Muista, että antamani luvut alkoholista ovat vain arvioita, eikä niihin voi täysin luottaa. Ja eikun juomaan!'));
  }, function(err){
    console.log(err);
    deferred.reject('Isompi ongelma, ota yhteyttä adminiin.');
  });
  return deferred.promise;
}, '/luotunnus <paino> <mies/nainen>. Esim. /luotunnus 90 mies');

cmd.registerUserCommand('/whoami', cmd.TYPE_PRIVATE, function(msg, words, user){
  let deferred = when.defer();
  deferred.resolve(cmd.privateResponse('Käyttäjä ' + user.nick + ', id: ' + user.userId + ', paino: ' + user.weight + ', sukupuoli: ' + user.gender));
  return deferred.promise;
}, '/whoami - tulosta omat tietosi.');

function getPermillesTextForGroup(groupId){
  let deferred = when.defer();
  when.all([
    users.getBoozeForGroup(groupId),
    users.getDrinkSumFor12hForGroup(groupId),
    users.getDrinkSumFor24hForGroup(groupId)
  ]).spread(function(drinksByUser, drinkSumsByUser12h, drinkSumsByUser24h){
      try {
        let permilles = [];
        for(var userId in drinksByUser){
          let details = drinksByUser[userId];
          let user = users.create(details.userid, details.nick, details.weight, details.gender);
          let userPermilles = alcomath.getPermillesFromDrinks(user, details.drinks);
          if(userPermilles > 0){
            let sum12h = drinkSumsByUser12h[details.userid] && drinkSumsByUser12h[details.userid].sum || 0;
            let sum24h = drinkSumsByUser24h[details.userid] && drinkSumsByUser24h[details.userid].sum || 0;
            permilles.push([user.nick, userPermilles, sum12h / alcomath.KALJA033, sum24h / alcomath.KALJA033]);
          }
        }
        permilles = permilles.sort(function(a,b){return b[1]-a[1];});
        permilles = permilles.map(user => user[0] + '... ' + user[1].toFixed(2) + '‰ ('+user[2].toFixed(1)+'/'+user[3].toFixed(1)+')');
        deferred.resolve('Käyttäjä...‰ (annoksia 12h/24h)\n\n' + permilles.join('\n'));
      } catch (err) {
        console.error(err);
        deferred.reject('Isompi ongelma, ota yhteyttä adminiin.');
      }
  }, function(err) {
    console.error(err);
    deferred.reject('Isompi ongelma, ota yhteyttä adminiin.');
  });
  return deferred.promise;
}

function drinkBoozeReturnPermilles(user, amount, description, msg){
  let deferred = when.defer();
  when.all([
    users.drinkBooze(user, amount, description),
    users.getDrinkCountsByGroupsForUser(user)
  ]).spread(function(amount, drinkCountsByGroups){
      users.getBooze(user)
      .then(function(drinks){
        let permilles = alcomath.getPermillesFromDrinks(user, drinks);
        deferred.resolve(permilles);
      }, function(err) {
        console.log(err);
        deferred.reject(err);
      });
      // do announcements based on drink counts
      for(var i in drinkCountsByGroups){
        let drinkCount = drinkCountsByGroups[i];
        if(drinkCount.count % 100 === 0){
          getPermillesTextForGroup(drinkCount.groupid)
            .then(function(text){
              msg.sendMsgTo(drinkCount.groupid, user.nick + ' joi juuri ryhmän ' + drinkCount.count + '. juoman!\n\nRippiä:\n'+text)
                .then(function(){}, function(err){
                  console.error(err);
                });
            }, function(err){
              console.error(err);
            });
        }
      }
    }, function(err){
      console.error(err);
      deferred.reject('Isompi ongelma, ota yhteyttä adminiin.');
    });
  return deferred.promise;
}

cmd.registerUserCommand('/kalja033', cmd.TYPE_PRIVATE, function(msg, words, user){
  let deferred = when.defer();
  drinkBoozeReturnPermilles(user, alcomath.KALJA033, '/kalja033', msg)
    .then(function(permilles){
      deferred.resolve(cmd.privateResponse(getRandomResponse() + ' ' + permilles.toFixed(2) + '‰'));
    }, function(err){
      console.error(err);
      deferred.reject('Isompi ongelma, ota yhteyttä adminiin.');
    });
  return deferred.promise;
}, '/kalja033 - juo yksi 0.33l');

cmd.registerUserCommand('/kalja05', cmd.TYPE_PRIVATE, function(msg, words, user){
  let deferred = when.defer();
  drinkBoozeReturnPermilles(user, alcomath.KALJA05, '/kalja05', msg)
    .then(function(permilles){
      deferred.resolve(cmd.privateResponse(getRandomResponse() + ' ' + permilles.toFixed(2) + '‰'));
    }, function(err){
      console.error(err);
      deferred.reject('Isompi ongelma, ota yhteyttä adminiin.');
    });
  return deferred.promise;
}, '/kalja05 - juo yksi 0.5l');

cmd.registerUserCommand('/shotti40', cmd.TYPE_PRIVATE, function(msg, words, user){
  let deferred = when.defer();
  drinkBoozeReturnPermilles(user, alcomath.SHOTTI40, '/shotti40', msg)
    .then(function(permilles){
      deferred.resolve(cmd.privateResponse(getRandomResponse() + ' ' + permilles.toFixed(2) + '‰'));
    }, function(err){
      console.error(err);
      deferred.reject('Isompi ongelma, ota yhteyttä adminiin.');
    });
  return deferred.promise;
}, '/shotti40 - juo yksi shotti 40% viinaa');

cmd.registerUserCommand('/nelonen', cmd.TYPE_PRIVATE, function(msg, words, user){
  let deferred = when.defer();
  drinkBoozeReturnPermilles(user, alcomath.NELONEN, '/nelonen', msg)
    .then(function(permilles){
      deferred.resolve(cmd.privateResponse(getRandomResponse() + ' ' + permilles.toFixed(2) + '‰'));
    }, function(err){
      console.error(err);
      deferred.reject('Isompi ongelma, ota yhteyttä adminiin.');
    });
  return deferred.promise;
}, '/nelonen - juo yksi 0.33l tölkki nelosta (5.5% lonkero tai olut tai siideri tai joku prkl)');

cmd.registerUserCommand('/viina', cmd.TYPE_PRIVATE, function(msg, words, user){
  let deferred = when.defer();
  if(words.length < 3){
    deferred.reject('Puuttuu prosentit ja tai määrä!');
    return deferred.promise;
  }

  let percent = parseFloat(words[1])/100;
  let amount = parseFloat(words[2]);
  if(percent === 'NaN' || amount === 'NaN' || percent > 1 || percent < 0 || amount > 10 || amount < 0){
    deferred.reject('Prosentti tai määrä on virheellinen!');
    return deferred.promise;
  }

  let alcoholInMG = alcomath.calcAlcoholMilliGrams(percent, amount);
  drinkBoozeReturnPermilles(user, alcoholInMG, words.join(' '), msg)
    .then(function(permilles){
      deferred.resolve(cmd.privateResponse(getRandomResponse() + ' ' + permilles.toFixed(2) + '‰'));
    }, function(err){
      console.error(err);
      deferred.reject('Isompi ongelma, ota yhteyttä adminiin.');
    });

  return deferred.promise;
}, '/viina (prosentti) (määrä litroissa). Esim. /viina 38 0.5. Käytä erottimena pistettä.');

cmd.registerUserCommand('/annokset', cmd.TYPE_ALL, function(msg, words, user){
  let deferred = when.defer();
  users.getBooze(user)
    .then(function(drinks){
      let grams = alcomath.sumGrams(drinks);
      deferred.resolve(cmd.privateResponse('Olet aikojen saatossa tuhonnut ' + grams.toFixed(2) + ' grammaa alkoholia, joka vastaa ' + (grams / 12.2).toFixed(2) + ' annosta.'));
    }, function(err){
      console.error(err);
      deferred.reject('Isompi ongelma, ota yhteyttä adminiin.');
    });
  return deferred.promise;
}, '/annokset - listaa kaikki annokset.');

cmd.registerUserCommand('/promillet', cmd.TYPE_ALL, function(msg, words, user){
  let deferred = when.defer();
  if(msg.chat.type === 'private'){
    users.getBooze(user)
      .then(function(drinks){
        try {
          let permilles = alcomath.getPermillesFromDrinks(user, drinks);
          let grams = alcomath.sumGramsUnBurned(user, drinks);
          let burnRate = alcomath.getUserBurnRate(user);
          let time = grams / burnRate;
          let hours = Math.floor(time);
          let minutes = ('0' + Math.ceil((time - hours) * 60)).slice(-2);
          deferred.resolve(cmd.privateResponse('Olet '+ permilles.toFixed(2) + '‰ humalassa. Veressäsi on ' + grams.toFixed(2) + ' grammaa alkoholia, joka vastaa ' + (grams / 12.2).toFixed(2) + ' annosta. Olet selvinpäin ' + hours + 'h'+minutes+'min päästä.'));
        } catch (err) {
          console.error(err);
          deferred.reject('Isompi ongelma, ota yhteyttä adminiin.');
        }
      }, function(err){
        console.error(err);
        deferred.reject('Isompi ongelma, ota yhteyttä adminiin.');
      });
  } else {
    getPermillesTextForGroup(msg.chat.id)
      .then(function(text){
        text = msg.chat.title + ' -kavereiden rippitaso:\n' + text;
        deferred.resolve(cmd.chatResponse(text));
      }, function(err){
        deferred.reject(err);
      });
  }
  return deferred.promise;
}, '/promillet - listaa kuinka paljon promilleja sinulla tai chatissa olevilla suunnilleen on.');

function makeDrinksString(drinks) {
  let list = [];
  let day = null;
  for(var i in drinks) {
    let drink = drinks[i];
    let drinkTime = new Date(Date.parse(drink.created));
    let drinkShortDate = drinkTime.getDate() + '.' + (drinkTime.getMonth()+1) + '.';
    if(day !== drinkShortDate) {
      day = drinkShortDate;
      list.push(day);
    }
    list.push(drinkTime.getHours() + ':' + drinkTime.getMinutes() + ' ' + drink.description);
  }
  return list.join('\n');
}

cmd.registerUserCommand('/otinko', cmd.TYPE_PRIVATE, function(msg, words, user){
  let deferred = when.defer();
  users.getBoozeForLast48h(user)
    .then(function(drinks){
      try {
        let drinkList = makeDrinksString(drinks);
        deferred.resolve(cmd.privateResponse(drinkList));
      } catch (err) {
        console.error(err);
        deferred.reject('Isompi ongelma, ota yhteyttä adminiin.');
      }
    }, function(err){
      console.error(err);
      deferred.reject('Isompi ongelma, ota yhteyttä adminiin.');
    });
  return deferred.promise;
}, '/otinko - näyttää otitko ja kuinka monta viime yönä.');

cmd.registerUserCommand('/moro', cmd.TYPE_ALL, function(msg, words, user){
  let deferred = when.defer();
  if(msg.chat.type === 'private'){
    deferred.reject('Käytä tätä komentoa ryhmässä!');
    return deferred.promise;
  }
  users.joinGroup(user, msg)
    .then(function(){
      deferred.resolve(cmd.chatResponse('Rippaa rauhassa kera ' + msg.chat.title + ' -kavereiden.'));
    }, function(err){
      console.error(err);
      deferred.resolve(cmd.chatResponse('Rippaa rauhassa kera ' + msg.chat.title + ' -kavereiden.'));
    });
  return deferred.promise;
}, '/moro - Lisää sinut ryhmään mukaan.');
