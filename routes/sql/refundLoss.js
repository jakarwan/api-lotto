const connection = require("../../config/connection");
const util = require("util");
const query = util.promisify(connection.query).bind(connection);
async function getPhoneQuery(params) {
    try {
      var sql =
        "SELECT * FROM member WHERE phone = ? LIMIT 1";
      const rows = await query(sql, params);
      return rows;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

async function refundLossQuery(params) {
  try {
    var sql =
      `SELECT IFNULL(SUM(p.total), 0) as pay_total, IFNULL(SUM(pl.total), 0) as prize_total, IFNULL(SUM(pl.total - p.total), 0) as total FROM poy as p LEFT JOIN prize_log as pl ON p.created_by = pl.created_by WHERE p.created_by = ? AND p.date_lotto BETWEEN ? AND ?`;
    const rows = await query(sql, params);
    return rows;
  } catch (error) {
    console.log(error);
    return false;
  }
}

module.exports = {
    refundLossQuery,
    getPhoneQuery
};
