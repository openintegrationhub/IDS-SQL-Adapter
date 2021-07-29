/* eslint no-param-reassign: "off" */
/* eslint no-inner-declarations: "off" */

/**
 * Copyright 2019 Wice GmbH

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const { transform } = require('@openintegrationhub/ferryman');

const { mysqlFetch } = require('./../utils/mysql');
const { mssqlFetch } = require('./../utils/mssql');
const { postgreFetch } = require('./../utils/postgreSQL');

/**
 * This method will be called from OIH platform providing following data
 *
 * @param msg - incoming message object that contains ``body`` with payload
 * @param cfg - configuration that is account information and configuration field values
 * @param snapshot - saves the current state of integration step for the future reference
 */
async function processTrigger(msg, cfg, snapshot = {}) {
  try {
    const {
      databaseType
    } = cfg;

    console.dir(msg);
    console.dir( cfg);

    try{
    if ('query' in msg.data){
      query=msg.data.query;}
    else {
      query=cfg.query;
    }}catch (e) {
    console.log(`ERROR: ${e}`);
    }

    // Set the snapshot if it is not provided
    snapshot.lastUpdated = snapshot.lastUpdated || 1;

    async function handleResult(data, last) {
      console.log("INFO: entered handleResults. data=" + data + " last=" + last);
      if (data === false) {
        if (cfg.devMode) console.log('Skipping empty entry');
      } else if (data === true) {
      // @todo: !

        // All done let's make a snapshot
        snapshot.lastUpdated = parseInt(last.sequenceNumber, 10) + 1;
        snapshot.date = last.date;
        if (cfg.devMode) console.log(`New snapshot: ${JSON.stringify(snapshot, undefined, 2)}`);
        this.emit('snapshot', snapshot);
      } else {
      // Prepare and emit entry

        const newElement = { meta: data.recordUid };

        const transformedData = transform(data, cfg);

        newElement.data = transformedData;
        console.log("INFO: handleResults.newElement.data=" + newElement);
        if (cfg.devMode) console.log('newElement', newElement);

        // Emit the object with meta and data properties
        this.emit('data', newElement);
      }
    }


    const matches = query.match(/(^|[\s)(]+)(delete|insert|update|set)(?=\s|\(|\)|$)/iu);

    if (matches !== null) {
      console.error('SQL edit operation found --> Aborting fetch');
      console.error('Query was:', query);
    }

    if (databaseType) {
      const dbType = databaseType.toLowerCase();
      if (dbType === 'mysql') {
        mysqlFetch(cfg, query, handleResult.bind(this));
      } else if (dbType === 'postgresql') {
        postgreFetch(cfg, query, handleResult.bind(this));
      } else if (dbType === 'mssql' || dbType === 'sql') {
        mssqlFetch(cfg, query, handleResult.bind(this));
      } else {
        console.error(`Unknown database type [${databaseType}] falling back to MySQL`);
        mysqlFetch(cfg, query, handleResult.bind(this));
      }
    } else {
      console.error('No database type set asuming MySQL');
      mysqlFetch(cfg, query, handleResult.bind(this));
    }

    console.log('Finished execution');
    this.emit('end');
  } catch (e) {
    console.log(`ERROR: ${e}`);
    this.emit('error', e);
  }
}

module.exports = {
  process: processTrigger,
};
