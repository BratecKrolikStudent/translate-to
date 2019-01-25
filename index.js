const request = require('request');
const cloneDeep = require('lodash.clonedeep');
const fs = require('fs');

const config = require('./config.json');
const dictionary = require('./locale/ru.json');

const PATH_TO_SAVE_DICTIONARIES = './locale';
const DICTIONARY_LANGUAGE = 'ru';
const TRANSLATE_TO = ['be', 'en'];
const DOES_NOT_TRANSLATE = ['url'];

const {
  url,
  key,
} = config;

if (!key) throw new Error('GET YOUR SECRET KEY on https://translate.yandex.com/developers/keys');

function createDictionary() {
  const dictionaryValues = [];
  return function traverse(items) {
    let i;
    for(const k in items) { // eslint-disable-line
      i = items[k];
      if (typeof i === 'object') {
        return traverse(i);
      }
      if (!DOES_NOT_TRANSLATE.includes(k)) {
        dictionaryValues.push(i);
      }
    }
    return dictionaryValues;
  };
}

function setDictinaryValues() {
  const dictinaryClone = cloneDeep(dictionary);
  let valueIndex = 0;
  return function traver(values, items = dictinaryClone) {
    let i;
    for(const k in items) { // eslint-disable-line
      i = items[k];
      if (typeof i === 'object') {
        return traver(values, i);
      }
      if (!DOES_NOT_TRANSLATE.includes(k)) {
        items[k] = values[valueIndex]; // eslint-disable-line no-param-reassign
        valueIndex += 1;
      }
    }
    return dictinaryClone;
  };
}

function requestData(text, language) {
  return new Promise((resolve, reject) => {
    request({
      method: 'GET',
      url,
      qs: {
        text,
        lang: `${DICTIONARY_LANGUAGE}-${language}`,
        key,
      },
    },
    (err, response, body) => {
      if (err) reject(err);
      resolve(body);
    });
  });
}

const dictionaryValues = createDictionary()(dictionary);

TRANSLATE_TO.forEach((lang) => {
  Promise.all(
    dictionaryValues.map(text => requestData(text, lang)),
  )
    .then((values) => {
      try {
        const translatedValues = values.map(value => JSON.parse(value).text[0]);
        const translatedDictionary = setDictinaryValues()(translatedValues);
        fs.writeFile(
          `${PATH_TO_SAVE_DICTIONARIES}/${lang}.json`,
          JSON.stringify(translatedDictionary),
          'utf8',
          (error) => {
            if (error) throw new Error(error);
          },
        );
      } catch (error) {
        console.log(error);
      }
    })
    .catch((error) => {
      console.log(error);
    });
});
