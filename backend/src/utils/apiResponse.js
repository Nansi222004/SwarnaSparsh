const success = (res, data = {}, message = "OK", statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const paginated = (res, data, pagination, message = "OK") =>
  res.status(200).json({ success: true, message, data, pagination });

const error = (res, message = "Something went wrong", statusCode = 500, errorCode = null) =>
  res.status(statusCode).json({ success: false, message, ...(errorCode && { error: errorCode }) });

module.exports = { success, paginated, error };
