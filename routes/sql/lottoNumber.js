const connection = require("../../config/connection");
const util = require("util");
const query = util.promisify(connection.query).bind(connection);
async function lottoNumberInsert(params) {
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

async function closeLottoNumberUpdate(updateField, params) {
  try {
    var sql = `UPDATE close_number SET ${updateField} = ? WHERE cn_id = ?`;
    const rows = await query(sql, params);
    return rows;
  } catch (error) {
    console.log(error);
    return false;
  }
}
// const lottoNumberInsert = () => {
//   var sql =
//     "INSERT INTO lotto_number (number, type_option, price, pay, discount, total, lotto_type_id, created_by, poy_code, status, date_lotto, installment_date) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, curdate(), ?)";
//    var queryLotto = "SELECT number"
// };

async function maxPlayUpdate(params) {
  try {
    var sql = `UPDATE member SET max_play = ? WHERE id = ?`;
    const rows = await query(sql, params);
    return rows;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function updatePlayLimitMembers(params) {
  try {
    var sql = `UPDATE member SET max_play = ?`;
    const rows = await query(sql, params);
    return rows;
  } catch (error) {
    console.log(error);
    return false;
  }
}

module.exports = {
  lottoNumberInsert,
  closeLottoNumberUpdate,
  maxPlayUpdate,
  updatePlayLimitMembers,
};
