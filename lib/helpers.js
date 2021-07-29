

function fillQueryTemplate(template, data) {
  const matches = Array.from(template.matchAll(/[\{](.*?)[\}]/gmu)); // eslint-disable-line no-useless-escape
  const matchesLength = matches.length;

  let query = template;
  for (let i = 0; i < matchesLength; i += 1) {
    const key = matches[i][1].trim();
    if (key in data) {
      query = query.replace(matches[i][0], data[key]);
    } else {
      console.error('Key', key, 'not found!');
    }
  }

  console.log('Filled template:', query);
  return query;
}

function fillQueryIDS(template, data) {
  const matches = Array.from(template.matchAll(/[{](.*?)[}]/gmu)); // eslint-disable-line no-useless-escape
  const matchesLength = matches.length;

  let query = template;
  let constVal=0;
  for (let i = 0; i < matchesLength; i += 1) {
    const key = matches[i][1].trim();
    if (key in data.data) {
      query = query.replace(matches[i][0], data.data[key]);
    } else {
      console.error('Key', key, 'not found!');
    }
    if (key == 'uidIDS'){
      constVal= generateRequestId()
      query = query.replace('{uidIDS}', constVal);
    }
  }

  console.log('Filled template:', query);
  return [query,constVal];
}

function generateRequestId() {
    // NOTE the result should be in the same format as provided by proxy in from of this server (nginx)
    const numbers = [];
    for (let i = 0; i < 32; i++) {
        numbers[i] = Math.floor(Math.random() * 16).toString(16);
    }
    return numbers.join('');
}


module.exports = {
  fillQueryTemplate,
  fillQueryIDS,
};
