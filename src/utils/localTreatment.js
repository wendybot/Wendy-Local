const math = require('./math');

function searchParameter(parameter, parameterCode, userInput) {
  if (parameter) {
    if (new RegExp((parameter).toLowerCase()).test(userInput)) {
      return 1;
    } if (parameterCode) {
      if (new RegExp(`\\b${(parameterCode).toLowerCase()}\\b`).test(userInput)) {
        return 1;
      }
      return 0;
    }
    return 0;
  }

  return -1;
}

function treatResults(resultsArray, selector, input) {
  let highestIndex;
  let highestScore = -100;
  const results = resultsArray;
  const userInput = input.toLowerCase();
  const parameters = [['country', 'country_code'], ['state', 'state_code'], ['city', 'city_code'],
    ['road', undefined], ['suburb', undefined], ['village', undefined], ['neighbourhood', undefined],
    ['town', undefined]];

  if (selector.length === 1) {
    return selector[0];
  }

  selector.forEach((index) => {
    parameters.forEach((parameter) => {
      switch (searchParameter(results[index].components[parameter[0]],
        results[index].components[parameter[1]], userInput)) {
        case 0:
          results[index].score -= 1;
          break;
        case 1:
          results[index].score += 1;
          break;
        default:
      }
    });

    if (results[index].score > highestScore) {
      highestScore = results[index].score;
      highestIndex = index;
    }
  });

  return highestIndex;
}

function cleanArray(array) {
  const resultsArray = array;

  resultsArray.forEach((value, index) => {
    delete resultsArray[index].annotations;
    delete resultsArray[index].bounds;
    delete resultsArray[index].components;
    delete resultsArray[index].confidence;
    delete resultsArray[index].isChecked;
    delete resultsArray[index].score;
    resultsArray[index].lat = resultsArray[index].geometry.lat;
    resultsArray[index].lng = resultsArray[index].geometry.lng;
    delete resultsArray[index].geometry;
  });

  return resultsArray;
}

module.exports = {
  bodyToLocal: (body, local) => {
    try {
      local.setLongitude(body.results[0].geometry.lng);
      local.setLatitude(body.results[0].geometry.lat);
    } catch (error) {
      local.setLongitude('error');
      local.setLatitude('error');
    }
  },

  bodyToResultsArray: (body, userInput) => {
    try {
      const { results } = body;
      const resultsArray = [];
      const radius = 10;

      results.forEach((value, index) => {
        results[index].isChecked = 0;
        results[index].score = 0;
      });

      results.forEach((value, index) => {
        if (!results[index].isChecked) {
          const selector = [];

          results[index].isChecked = 1;
          selector.push(index);

          results.forEach((value2, index2) => {
            if ((index !== index2) && (!results[index2].isChecked)) {
              const lat = [math.toRadians(results[index].geometry.lat),
                math.toRadians(results[index2].geometry.lat)];
              const lng = [math.toRadians(results[index].geometry.lng),
                math.toRadians(results[index2].geometry.lng)];

              if ((math.haversine(lat, lng) <= radius)
              && ((results[index].components.city === results[index2].components.city)
              || !(results[index].components.city && results[index2].components.city))) {
                selector.push(index2);
                results[index2].isChecked = 1;
              }
            }
          });

          resultsArray.push(results[treatResults(results, selector, userInput)]);
        }
      });

      return cleanArray(resultsArray);
    } catch (err) {
      return JSON.parse('[{"name":"error","lat":"error","lng":"error"}]');
    }
  },
};