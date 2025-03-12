const connection = require("../../config/connection");
const util = require("util");
const query = util.promisify(connection.query).bind(connection);
async function hotnumberInsert(params) {
  try {
    var sql =
      "INSERT INTO lotto_number (number, type_option, price, pay, discount, total, lotto_type_id, created_by, poy_code, status, date_lotto, installment_date) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, curdate(), ?)";
    const rows = await query(sql, params);
    return rows;
  } catch (error) {
    console.log(error);
    return false;
  }
}

module.exports = {
    hotnumberInsert,
};
