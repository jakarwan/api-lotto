const connection = require("../../config/connection");
const util = require("util");
const query = util.promisify(connection.query).bind(connection);
async function payRateUpdate(params) {
  try {
    var sql =
      "UPDATE type_options SET name = ?, price = ?  WHERE type_option_id = ?";
    const rows = await query(sql, params);
    return rows;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function payRateQuery() {
  try {
    var sql = "SELECT * FROM type_options";
    const rows = await query(sql);
    return rows;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function typeQuery() {
  try {
    var sql = "SELECT * FROM type";
    const rows = await query(sql);
    return rows;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function delPayRate(params) {
  try {
    var sql = "DELETE FROM type_options WHERE type_id = ?";
    const rows = await query(sql, params);
    return rows;
  } catch (error) {
    console.log(error);
    return false;
  }
}
module.exports = {
  payRateUpdate,
  payRateQuery,
  typeQuery,
  delPayRate,
};
