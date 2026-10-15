const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const createdResponse = (res, data = null, message = 'Resource created successfully') => {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
};

const noContentResponse = (res) => {
  return res.status(204).send();
};

export {
  successResponse,
  createdResponse,
  noContentResponse,
};