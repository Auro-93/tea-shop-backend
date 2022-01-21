import currencyFormatter from "currency-formatter";

//CALCULATE DISCOUNT
export const calcDiscount = (itemPrice, discount) => {
  let decimal = discount / 100;
  let multiply = itemPrice * decimal;
  let prodPrice = itemPrice - multiply;
  return prodPrice;
};

//GET TOTAL PRICE OF CART ITEMS

export const getNumOfProdInCart = (cart) => {
  let totalEl = [];
  cart.forEach((el) => {
    totalEl.push(el.quantity);
  });
  const reducer = (previousValue, currentValue) => previousValue + currentValue;

  return totalEl.reduce(reducer, 0);
};

export const displayTotal = (cart) => {
  let totalEl = [];
  cart &&
    cart.forEach((el) => {
      let itemTotal;
      if (el.discount) {
        itemTotal = calcDiscount(el.price, el.discount) * el.quantity;
      } else {
        itemTotal = el.price * el.quantity;
      }
      totalEl.push(itemTotal);
    });
  let sumArray = [];
  const reducer = (previousValue, currentValue) => previousValue + currentValue;
  totalEl.forEach((el) => {
    let totalNumFormat = currencyFormatter.unformat(el, {
      code: "EUR",
    });
    sumArray.push(totalNumFormat);
  });

  return sumArray.reduce(reducer, 0);
};
