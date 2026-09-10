const https = require('https');

https.get('https://react.dev/errors/441', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    // simple regex to find the error message
    const match = data.match(/Minified React error #441.*?<p>(.*?)<\/p>/i) || data.match(/Minified React error #441.*?(Cannot.*?)<\//i) || data.match(/"error message":"(.*?)"/i);
    if(match) console.log(match[0]);
    else console.log('Could not parse exactly. Using simple grep: ', data.substring(data.indexOf('441') - 50, data.indexOf('441') + 200));
  });
});
