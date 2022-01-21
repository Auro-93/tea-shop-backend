export const checkOrderFields = async (req, res, next) => {
  const { order } = req.body;
  try {
    if (
      !order.name ||
      !order.lastName ||
      !order.telephone ||
      !order.products ||
      !order.productsTotalPrice ||
      !order.shipping ||
      !order.orderTotalPrice ||
      !order.shippingAddress ||
      !order.billingAddress ||
      !order.payment
    ) {
      return res.status(400).json({ errorMessage: "Missing order info" });
    } else {
      req.order = order;
      next();
    }
  } catch (error) {
    return res.status(500).json({ errorMessage: `${error}` });
  }
};
