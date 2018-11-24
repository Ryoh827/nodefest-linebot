'use strict';

const express = require('express');
const line = require('@line/bot-sdk');
const kuromoji = require('kuromoji');
const PORT = process.env.PORT || 3000;

const config = {
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
};

const builder = kuromoji.builder({
    // ここで辞書があるパスを指定します。今回は kuromoji.js 標準の辞書があるディレクトリを指定
    dicPath: 'node_modules/kuromoji/dict'
});

const app = express();

app.post('/webhook', line.middleware(config), (req, res) => {
    Promise
      .all(req.body.events.map(handleEvent))
      .then((result) => res.json(result));
});

const client = new line.Client(config);

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }
  let surfaceResult = [];
  let readingResult = [];
  const replyObj = {
    type: 'text',
    text: ''
  };
  await new Promise(
      function(resolve, reject) {
        builder.build(function(err, tokenizer) {
            if(err) { reject(err) }
            const tokens = tokenizer.tokenize(event.message.text);
            for(const token of tokens) {
              if (typeof token['surface_form'] !== 'undefined')
                surfaceResult.push(token['surface_form']); 
              if (typeof token['reading'] !== 'undefined')
                readingResult.push(token['reading']);
            }
            replyObj['text'] = surfaceResult.join('/') + '\n' + readingResult.join('/');
            resolve();
          });
      }
  ).catch((err) => {
    console.error(err);
    replyObj['text'] = '解析に失敗しました';
  });
  return client.replyMessage(event.replyToken, replyObj);
}

app.listen(PORT);
console.log(`running server at ${PORT}`);
