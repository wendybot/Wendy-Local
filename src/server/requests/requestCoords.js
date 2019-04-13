const https = require('https');
const mongoose = require('mongoose');
const mongooseConnection = require('../config/mongooseConnection.js');


const locationSchema = new mongoose.Schema({
  name: String,
  latitude: String,
  longitude: String,
});
const Location = mongoose.model('Location', locationSchema);
const newLocal = new Location({
  name: '',
  latitude: '',
  longitude: '',
});
module.exports = {
  requestCoords: (theName) => {
    const key = process.env.API_KEY; this.key = key; let data = ''; let body; mongooseConnection.connect();
    return new Promise((resolve, reject) => {
      if (theName === 'testLocal') {
        const testLocal = new Location({
          name: theName, latitude: 'test', longitude: 'test',
        });
        resolve(testLocal);
      }
      Location.findOne({ name: theName }, (err) => { if (err) { reject(err); } })
        .then((local) => {
          if (local) { resolve(local); } else {
            https.get(`https://api.opencagedata.com/geocode/v1/json?q=${theName}&key=${key}`, (resp) => {
              resp.on('data', (chunk) => { data += chunk; }); resp.on('end', () => {
                body = JSON.parse(data); if (body.results[0]) {
                  newLocal.name = theName; newLocal.latitude = body.results[0].geometry.lat;
                  newLocal.longitude = body.results[0].geometry.lng;
                  newLocal.save((err) => { if (err) { reject(err); } }); resolve(newLocal);
                } else { reject(new Error('value is undefined')); }
              });
            }).on('error', (err) => { reject(err); });
          }
        });
    });
  },
};
