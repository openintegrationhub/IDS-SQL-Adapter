
const mssql = require('mssql');

const connectionMaxAge = 100000;
const intervalMs = 300000;

let lastUsed = Date.now();
let connection = false;
let intervalHandle;

async function dbConnect(config) {
  try {
    // new mssql.ConnectionPool
    connection = await mssql.connect(
      {
        user: config.user,
        password: config.password,
        server: config.databaseUrl,
        port: parseInt(config.port, 10),
        database: config.databaseName,
      },
    );
    // await connection.connect();
  } catch (e) {
    console.error(e);
    connection = false;
  }
}

async function connectionMayEnd() {
  if (connection === false) {
    return console.log('Connection already closed - nothing todo');
  }

  const threshold = Date.now() - connectionMaxAge;
  console.log(lastUsed, threshold);
  if (lastUsed < threshold) {
    console.log('Connection is idle for too long --> closing');
    try {
      clearInterval(intervalHandle);
      await connection.close();
      connection = false;
      return true;
    } catch (e) {
      console.error(e);
    }
  }

  return false;
}

intervalHandle = setInterval(connectionMayEnd, intervalMs);

// async function mssqlFetch(config, query, callback, close) {
//   try {
//     if (connection === false) await dbConnect(config);
//     lastUsed = Date.now();
//
//     const results = await connection.query(query);
//     // console.log('Results:', results);
//
//     const resultsLength = results.recordsets.length;
//     // console.log(resultsLength, 'Results');
//     for (let i = 0; i < resultsLength; i += 1) {
//       // console.log(results.recordsets[i]);
//       const last = (i + 1 === resultsLength);
//       callback(results.recordsets[i], last);
//     }
//
//     lastUsed = Date.now();
//     callback(true, true);
//     if (close) {
//       clearInterval(intervalHandle);
//       await connection.close();
//       connection = false;
//     }
//     return true;
//   } catch (e) {
//     console.error(e);
//     return false;
//   }
// }

async function mssqlFetch(config, query, callback, close) {
  try {
    if (connection === false) await dbConnect(config);
    lastUsed = Date.now();

    const currentQuery = new mssql.Request();
    currentQuery.stream = true;
    currentQuery.query(query);

    currentQuery.on('row', (row) => {
      // console.log('Row:', row);
      callback(row, false);
    });

    currentQuery.on('error', (err) => {
      console.error(err);
      return false;
    });

    currentQuery.on('done', async (result) => {
      console.log('Done:', result);
      lastUsed = Date.now();
      callback(true, true);
      if (close) {
        clearInterval(intervalHandle);
        await connection.close();
        connection = false;
      }
    });

    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}


async function mssqlExecute(config, query, callback, close) {
  try {
    // console.log('mssqlExecute:', query);
    if (connection === false) await dbConnect(config);
    lastUsed = Date.now();
    connection.connect();

    const result = await connection.query(query);

    // console.log('Result:', result);

    callback(result, true);

    if (close) {
      clearInterval(intervalHandle);
      await connection.close();
      connection = false;
    }

    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

module.exports = {
  mssqlFetch,
  mssqlExecute,
};
