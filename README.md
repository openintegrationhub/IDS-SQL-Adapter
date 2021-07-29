![alpha](https://img.shields.io/badge/Status-Alpha-yellow.svg)

# IDS-SQL Adapter

The IDS-SQL Adapter is a variation of the standard [OIH-SQL Adapter](https://github.com/openintegrationhub/sql-adapter) and provides some additional functionality in order to interact with IDS. It generates UIDs for incoming data, stores it in an SQL database and fetches data based on provided UIDs.


## Actions and triggers
The IDS-SQL-Adapter supports the following **actions** and **triggers**:

#### Triggers:

A trigger usually is the first component within a flow and is executed when the flow is triggered by a request to the flow webhook or a CRON job event.

**Get Data Polling** (```getDataPolling.js```)

Sends the provided SQL-Query to the connected database and fetches the resulting data row by row. It is recommended to create a separate database user with the required permission.

1. Accepts an SQL-Query from incoming data or optionally from config (field `query`). 
2. Fetches the data from database and emits it row by row.

```
fields: {
  databaseType: 'postgresql',
  user: 'root',
  password: 'root',
  databaseUrl: 'postgres.oih-dev-ns.svc.cluster.local',
  port: '5432',
  databaseName: 'test',
  (OPTIONAL) query: 'SELECT * FROM public.oih_ids_iot_test_data'
}
```

#### Actions:

An action is executed whenever it receives data from another component in the same flow.

**Add Data** (```addData.js```)

Combines incoming data with provided query and writes it to specified database.

1. Accepts an SQL-Query from config (field `query`) and combines it with incoming data.
2. If `uidIDS` is present in query it generates a UID for each data row and inserts it into the query. 
3. Writes data to SQL/MySQL/PostgreSQL database. 

```
fields: {
  databaseType: 'postgresql',
  user: '',
  password: '',
  databaseUrl: '',
  port: '',
  databaseName: '',
  query: 'INSERT INTO oih_ids_iot_test_data_sink(uidIDS,Column2,Column3) VALUES (\'{uidIDS}\',\'{VALUE1}\',\'{VALUE2}\')'
}
```

## License

Apache-2.0 © [X-integrate](https://X-integrate.de/)
