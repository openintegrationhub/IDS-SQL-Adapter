
const { Pool } = require('pg');
const Cursor = require('pg-cursor');

const connectionMaxAge = 100000;
const intervalMs = 300000;

let lastUsed = Date.now();
let connection = false;
let intervalHandle;

async function dbConnect(config) {
  try {
    const pool = new Pool({
      user: config.user,
      host: config.databaseUrl,
      database: config.databaseName,
      password: config.password,
      port: config.port,
    });

    connection = await pool.connect();
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
  // console.log(lastUsed, threshold);
  if (lastUsed < threshold) {
    console.log('Connection-Pool is idle for too long --> closing');
    try {
      clearInterval(intervalHandle);
      await connection.end();
      connection = false;
      return true;
    } catch (e) {
      console.error(e);
    }
  }
  return false;
}

intervalHandle = setInterval(connectionMayEnd, intervalMs);

// async function postgreFetch(config, query, callback, close) {
//   try {
//     if (connection === false) await dbConnect(config);
//     lastUsed = Date.now();
//     const results = await connection.query(query);
//
//     const resultsLength = results.rows.length;
//     // console.log(resultsLength, 'Results');
//     for (let i = 0; i < resultsLength; i += 1) {
//       // console.log(results.rows[i]);
//       const last = (i + 1 === resultsLength);
//       callback(results.rows[i], last);
//     }
//
//     lastUsed = Date.now();
//     if (close) {
//       clearInterval(intervalHandle);
//       await connection.end();
//       connection = false;
//     }
//     return true;
//   } catch (e) {
//     console.error(e);
//     return false;
//   }
// }

async function postgreFetch(config, query, callback, close) {
  console.log("INFO: Entered postgreFetch. config=" + config + " query=" + query + " callback=" + callback);
  try {
    if (connection === false) await dbConnect(config);
    lastUsed = Date.now();

    const currentQuery = connection.query(new Cursor(query));

    const fetchRows = () => {
      currentQuery.read(1, (err, rows) => {
        if (err) {
          console.error(err);
          connection.end();
        }
        // console.log(rows);
        if (rows.length > 0) {
          callback(rows[0], false);
          fetchRows();
        } else {
          callback(true, true);
          if (close) connection.end();
        }
      });
    };

    fetchRows();

    return true;
  } catch (e) {
    console.error(this.className + " ERROR:" + e + " Query: " + query + " Config: " + config);
    return false;
  }
}

async function postgreExecute(config, query, callback, close) {
  try {
    // console.log('Query:', query);
    if (connection === false) await dbConnect(config);
    lastUsed = Date.now();

    const results = await connection.query(query);
    // console.log('Results:', results);
    callback(results, true);

    lastUsed = Date.now();
    if (close) {
      clearInterval(intervalHandle);
      await connection.end();
      connection = false;
    }
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

module.exports = {
  postgreFetch,
  postgreExecute,
};
