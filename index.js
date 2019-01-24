const request = require('request');
const fs = require('fs');

const config = require('./config.json');
const dictionary = require('./locale/ru.json');

const PATH_TO_SAVE_DICTIONARIES = './locale';
const DICTIONARY_LANGUAGE = 'ru';
const TRANSLATE_TO = ['be', 'en'];

const dictionaryKeys = [];
const dictionaryValues = [];

Object.entries(dictionary).forEach((item) => {
  const [itemKey, itemValue] = item;
  dictionaryKeys.push(itemKey);
  dictionaryValues.push(itemValue);
});

const {
  url,
  key,
} = config;

if (!key) throw new Error('GET YOUR SECRET KEY on https://translate.yandex.com/developers/keys');

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

TRANSLATE_TO.forEach((lang) => {
  Promise.all(
    dictionaryValues.map(text => requestData(text, lang)),
  )
    .then((values) => {
      const translatedDictionary = {};
      values.forEach((value, index) => {
        try {
          const translatedText = JSON.parse(value).text[0];
          translatedDictionary[dictionaryKeys[index]] = translatedText;
        } catch (error) {
          console.log(error);
        }
      });
      fs.writeFile(
        `${PATH_TO_SAVE_DICTIONARIES}/${lang}.json`,
        JSON.stringify(translatedDictionary),
        'utf8',
        (error) => {
          if (error) throw new Error(error);
        },
      );
    })
    .catch((error) => {
      console.log(error);
    });
});
