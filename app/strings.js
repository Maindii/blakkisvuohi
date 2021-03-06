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
    strings.js
    Contains all printable strings of the app
*/

'use strict';

module.exports = {
    'drink_responses': [
        'Bäää.', 'Uuteen nousuun.', 'Muista juoda vettä!', 'Aamu alkaa A:lla.',
        'Muista juoda vettä!', 'Juo viinaa, viina on hyvää.', 'Meno on meno.',
        'Lörs lärä, viinaa!', 'Muista juoda vettä!'
    ], 
    'help_text': 'BläkkisVuohi auttaa sinua ja ystäviäsi seuraamaan rippauksesi (lue: promillejesi) tasoa. Luo ensimmäiseksi tunnus komennolla /luotunnus. Tunnuksen luomisen jälkeen voit alkaa kellottamaan juomia sisään komennolla /juoma. Annan sinulle arvioita rippauksesta komennolla /promillet. Minut voi myös lisätä ryhmään, jolloin kerron /promillet-komennolla kaikkien ryhmässä olevien rippitasot. Jokaisen ryhmäläisen täytyy kuitenkin sanoa ryhmässä /moro, jotta he pääsevät rippilistaukseen mukaan.',

    /* jalkikellotus -strings */
    'jalkikellotus': {
        'start': 'Kuinka pitkältä aikaväliltä haluat syöttää unohtuneita juomia? Syötä aikaväli tunneissa. \n\nEsimerkiksi kaksi ja puoli tuntia: 2.5 \nYksi tunti ja 15 minuuttia: 1.25.', 
        'hours_error': 'Tunnit väärin. Mahdolliset arvot välillä 0-24. Älä käytä pilkkua.',
        'input_drinks_start': 'Kirjoita juomia seuraavassa muodossa: \nJuomannimi Senttilitrat Tilavuusprosentti. \nEsimerkiksi: kalja 33 4.7. \n\nErota eri juomat joko rivinvaihdolla tai kirjoita useampi viesti. Lopeta kirjoittamalla stop.',
        'input_drinks_error': 'Kirjoititko varmasti ohjeiden mukaisesti? Käytä pistettä, älä pilkkua.',
        'cmd_text': '/jalkikellotus - Kellota unohtuneet juomat mukaan tilastoihin'
    }
};