function paginatedResults(req, res, model) {
  if (req.query.page && req.query.perPage && model) {
    const page = req.query.page;
    const perPage = req.query.perPage;
    const startIndex = (page - 1) * perPage;
    const endIndex = page * perPage;

    const data = model.slice(startIndex, endIndex);
    const resp = {
      data: data,
      page: page,
      perPage: perPage,
      total: model.length,
    };
    return resp;
  } else {
    return res
      .status(400)
      .send({ status: "error", msg: "กรุณากรอก page, perPage" });
  }
}

module.exports = paginatedResults;
