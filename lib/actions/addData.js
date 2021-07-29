/* eslint no-param-reassign: "off" */
/* eslint array-callback-return: "off" */
/* eslint no-unused-expressions: "off" */

/**
 * Copyright 2018 Wice GmbH

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
const { fillQueryIDS } = require('../helpers');

const { mysqlExecute } = require('./../utils/mysql');
const { mssqlExecute } = require('./../utils/mssql');
const { postgreExecute } = require('./../utils/postgreSQL');

/**
 * This method will be called from elastic.io platform providing following data
 *
 * @param msg incoming message object that contains ``body`` with payload
 * @param cfg configuration that is account information and configuration field values
 */

async function processAction(msg, cfg) {
  function handleResult(result) {
    console.log('Result:', result);
  }

  try {
    const transformedMsg = transform(msg, cfg);

    console.log(transformedMsg);
    // const oihUid = (transformedMsg.meta !== undefined && transformedMsg.meta !== undefined)
    //   ? transformedMsg.meta.oihUid : undefined;
    // const recordUid = (transformedMsg !== undefined && transformedMsg.meta !== undefined)
    //   ? transformedMsg.meta.recordUid : undefined;
    // const applicationUid = (transformedMsg.meta !== undefined && transformedMsg.meta !== undefined)
    //   ? transformedMsg.meta.applicationUid : undefined;
    //

    const {
      // domainId,
      // schema,
      query,
      databaseType,
    } = cfg;

    /** The following block creates the meta object.
   *  This meta object stores information which are
   *  later needed in order to make the hub and spoke architecture work properly
   */
    // const oihMeta = {
    //   applicationUid,
    //   oihUid,
    //   recordUid,
    // };

    const oihMeta = {};

    const [realQuery,uidIDS] = fillQueryIDS(query, transformedMsg);

    console.log('realQuery:', realQuery);

    let reply;
    if (databaseType) {
      const dbType = databaseType.toLowerCase();
      if (dbType === 'mysql') {
        reply = mysqlExecute(cfg, realQuery, handleResult);
      } else if (dbType === 'postgresql') {
        reply = postgreExecute(cfg, realQuery, handleResult);
      } else if (dbType === 'mssql' || dbType === 'sql') {
        reply = mssqlExecute(cfg, realQuery, handleResult);
      } else {
        console.error(`Unknown database type [${databaseType}] falling back to MySQL`);
        reply = mysqlExecute(cfg, realQuery, handleResult);
      }
    } else {
      console.error('No database type set asuming MySQL');
      reply = mysqlExecute(cfg, realQuery, handleResult);
    }



    const response = {
      metadata: oihMeta,
      data: uidIDS,
    };

    this.emit('data', response)

    console.log('Response:', response);
    /*
    const data = response;
    this.emit('data', data);*/
  } catch (e) {
    console.log('Oops! Error occurred');
    this.emit('error', e);
  }
}

module.exports = {
  process: processAction,
};
