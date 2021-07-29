/* eslint no-unused-expressions: "off" */

const { expect } = require('chai');

const { fillQueryTemplate } = require('./../lib/helpers');

describe('Query templates', () => {
  it('should correctly fill a query template with data', async () => {
    const query = 'INSERT INTO testtable (userId, title) VALUES ({userId}, "{title}")';
    const data = {
      userId: '77',
      title: 'SomeTitle',
    };
    const result = fillQueryTemplate(query, data);

    expect(result).to.equal('INSERT INTO testtable (userId, title) VALUES (77, "SomeTitle")');
  });
});
